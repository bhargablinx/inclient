import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";
import InvoiceItem from "../models/invoiceItem.model.js";
import Organization from "../models/organization.model.js";
import mongoose from "mongoose";
import { escapeRegex } from "../utils/escapeRegex.js";
import PDFDocument from "pdfkit";
import { buildInvoicePdf } from "../utils/generatePdf.js";
import { sendMail } from "../utils/sendMail.js";
import { invoiceEmailTemplate } from "../utils/emailTemplate.js";

const createInvoice = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const {
        clientId,
        dueDate,
        currency = "INR",
        taxAmount = 0,
        discountAmount = 0,
        items,
    } = req.body;

    if (!clientId) {
        throw new ApiError(400, "Client is required");
    }

    if (!dueDate) {
        throw new ApiError(400, "Due date is required");
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, "At least one invoice item is required");
    }

    const client = await Client.findOne({
        _id: clientId,
        organization: organizationId,
        isActive: true,
    });

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Calculate subtotal
        let subtotal = 0;

        const processedItems = items.map((item) => {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            const itemDiscount = Number(item.discountAmount || 0);

            const lineTotal = quantity * unitPrice - itemDiscount;

            subtotal += lineTotal;

            return {
                description: item.description,
                quantity,
                unitPrice,
                taxRate: item.taxRate || 0,
                discountAmount: itemDiscount,
                lineTotal,
            };
        });

        const totalAmount =
            subtotal + Number(taxAmount) - Number(discountAmount);

        // Temporary invoice number generation
        const invoiceCount = await Invoice.countDocuments({
            organization: organizationId,
        });

        const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(
            4,
            "0"
        )}`;

        const [invoice] = await Invoice.create(
            [
                {
                    organization: organizationId,
                    client: clientId,
                    invoiceNumber,
                    dueDate,
                    currency,
                    subtotal,
                    taxAmount,
                    discountAmount,
                    totalAmount,
                    amountPaid: 0,
                    balanceDue: totalAmount,
                    createdBy: req.user._id,
                },
            ],
            { session }
        );

        const invoiceItems = processedItems.map((item) => ({
            ...item,
            invoice: invoice._id,
        }));

        await InvoiceItem.insertMany(invoiceItems, {
            session,
        });

        await session.commitTransaction();

        return res
            .status(201)
            .json(
                new ApiResponse(201, invoice, "Invoice created successfully")
            );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

const getInvoices = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const { status, clientId, search } = req.query;

    const filter = {
        organization: organizationId,
    };

    if (status) {
        filter.status = status;
    }

    if (clientId) {
        filter.client = clientId;
    }

    if (search) {
        filter.invoiceNumber = {
            $regex: escapeRegex(search),
            $options: "i",
        };
    }

    const [invoices, totalInvoices] = await Promise.all([
        Invoice.find(filter)
            .populate("client", "name companyName email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Invoice.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalInvoices / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                invoices,
                pagination: {
                    page,
                    limit,
                    totalInvoices,
                    totalPages,
                },
            },
            "Invoices fetched successfully"
        )
    );
});

const getInvoice = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    })
        .populate("client", "name email phone companyName address taxId")
        .populate("createdBy", "name email")
        .lean();

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    const items = await InvoiceItem.find({
        invoice: invoiceId,
    })
        .select("-invoice -__v")
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                invoice,
                items,
            },
            "Invoice fetched successfully"
        )
    );
});

const updateInvoice = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const { clientId, dueDate, currency, taxAmount, discountAmount, items } =
        req.body;

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    });

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (["paid", "cancelled"].includes(invoice.status)) {
        throw new ApiError(400, `Cannot edit a ${invoice.status} invoice`);
    }

    if (clientId) {
        const client = await Client.findOne({
            _id: clientId,
            organization: organizationId,
            isActive: true,
        });

        if (!client) {
            throw new ApiError(404, "Client not found");
        }

        invoice.client = clientId;
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        let subtotal = invoice.subtotal;

        // Update invoice items if provided
        if (items && Array.isArray(items)) {
            if (items.length === 0) {
                throw new ApiError(
                    400,
                    "Invoice must contain at least one item"
                );
            }

            await InvoiceItem.deleteMany({ invoice: invoiceId }, { session });

            let calculatedSubtotal = 0;

            const invoiceItems = items.map((item) => {
                const quantity = Number(item.quantity);
                const unitPrice = Number(item.unitPrice);
                const itemDiscount = Number(item.discountAmount || 0);

                const lineTotal = quantity * unitPrice - itemDiscount;

                calculatedSubtotal += lineTotal;

                return {
                    invoice: invoiceId,
                    description: item.description,
                    quantity,
                    unitPrice,
                    taxRate: item.taxRate || 0,
                    discountAmount: itemDiscount,
                    lineTotal,
                };
            });

            await InvoiceItem.insertMany(invoiceItems, {
                session,
            });

            subtotal = calculatedSubtotal;
        }

        if (dueDate) {
            invoice.dueDate = dueDate;
        }

        if (currency) {
            invoice.currency = currency;
        }

        if (taxAmount !== undefined) {
            invoice.taxAmount = Number(taxAmount);
        }

        if (discountAmount !== undefined) {
            invoice.discountAmount = Number(discountAmount);
        }

        invoice.subtotal = Number(subtotal);

        invoice.totalAmount =
            Number(invoice.subtotal) +
            Number(invoice.taxAmount || 0) -
            Number(invoice.discountAmount || 0);

        invoice.balanceDue =
            invoice.totalAmount - Number(invoice.amountPaid || 0);

        if (invoice.status !== "cancelled") {
            if (invoice.balanceDue <= 0 && invoice.amountPaid > 0) {
                invoice.status = "paid";
            } else if (invoice.amountPaid > 0 && invoice.balanceDue > 0) {
                invoice.status = "partially_paid";
            }
        }

        await invoice.save({ session });

        await session.commitTransaction();

        return res
            .status(200)
            .json(
                new ApiResponse(200, invoice, "Invoice updated successfully")
            );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

const deleteInvoice = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    });

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.status === "paid") {
        throw new ApiError(400, "Paid invoices cannot be cancelled");
    }

    invoice.status = "cancelled";

    await invoice.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Invoice cancelled successfully"));
});

const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
        "draft",
        "sent",
        "viewed",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
    ];

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    if (!allowedStatuses.includes(status)) {
        throw new ApiError(400, "Invalid invoice status");
    }

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    });

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    // Prevent modifications after cancellation
    if (invoice.status === "cancelled") {
        throw new ApiError(400, "Cancelled invoices cannot be updated");
    }

    // Prevent reverting paid invoices
    if (invoice.status === "paid" && status !== "paid") {
        throw new ApiError(
            400,
            "Paid invoices cannot be moved to another status"
        );
    }

    invoice.status = status;

    // Keep financial fields consistent
    if (status === "paid") {
        invoice.amountPaid = invoice.totalAmount;
        invoice.balanceDue = 0;
    }

    await invoice.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, invoice, "Invoice status updated successfully")
        );
});

const generateInvoicePdf = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    })
        .populate("client", "name email phone companyName address taxId")
        .populate("createdBy", "name email")
        .lean();

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    const organization = await Organization.findById(organizationId).lean();
    const items = await InvoiceItem.find({ invoice: invoiceId }).lean();

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`
    );

    doc.pipe(res);
    buildInvoicePdf(doc, { invoice, items, organization });
    doc.end();
});

const sendInvoice = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    }).populate("client", "name companyName email");

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (!invoice.client?.email) {
        throw new ApiError(400, "Client does not have a valid email address");
    }

    const organization = await Organization.findById(organizationId).lean();
    const organizationName = organization?.name || "InClient Organization";
    const clientName = invoice.client.companyName || invoice.client.name || "Valued Client";

    const invoiceUrl = `${process.env.CLIENT_URL}/invoices/${invoice._id}`;

    try {
        await sendMail(
            invoice.client.email,
            `Invoice #${invoice.invoiceNumber} from ${organizationName}`,
            invoiceEmailTemplate(invoice, organizationName, clientName, invoiceUrl)
        );
    } catch (error) {
        console.error("Error sending invoice email:", error);
        throw new ApiError(500, "Failed to send invoice email");
    }

    if (invoice.status === "draft") {
        invoice.status = "sent";
        await invoice.save();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            invoice,
            `Invoice #${invoice.invoiceNumber} emailed to ${invoice.client.email} successfully!`
        )
    );
});

const duplicateInvoice = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const sourceInvoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    });

    if (!sourceInvoice) {
        throw new ApiError(404, "Invoice not found");
    }

    const sourceItems = await InvoiceItem.find({ invoice: invoiceId });

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const invoiceCount = await Invoice.countDocuments({
            organization: organizationId,
        });

        const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, "0")}`;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const [duplicatedInvoice] = await Invoice.create(
            [
                {
                    organization: organizationId,
                    client: sourceInvoice.client,
                    invoiceNumber,
                    dueDate,
                    currency: sourceInvoice.currency,
                    subtotal: sourceInvoice.subtotal,
                    taxAmount: sourceInvoice.taxAmount,
                    discountAmount: sourceInvoice.discountAmount,
                    totalAmount: sourceInvoice.totalAmount,
                    amountPaid: 0,
                    balanceDue: sourceInvoice.totalAmount,
                    status: "draft",
                    createdBy: req.user._id,
                },
            ],
            { session }
        );

        if (sourceItems.length > 0) {
            const duplicatedItems = sourceItems.map((item) => ({
                invoice: duplicatedInvoice._id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                discountAmount: item.discountAmount,
                lineTotal: item.lineTotal,
            }));

            await InvoiceItem.insertMany(duplicatedItems, { session });
        }

        await session.commitTransaction();

        return res.status(201).json(
            new ApiResponse(
                201,
                duplicatedInvoice,
                `Invoice duplicated successfully as ${invoiceNumber}`
            )
        );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

const downloadInvoice = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    })
        .populate("client", "name email phone companyName address taxId")
        .populate("createdBy", "name email")
        .lean();

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    const organization = await Organization.findById(organizationId).lean();
    const items = await InvoiceItem.find({ invoice: invoiceId }).lean();

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`
    );

    doc.pipe(res);
    buildInvoicePdf(doc, { invoice, items, organization });
    doc.end();
});

export {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    generateInvoicePdf,
    sendInvoice,
    duplicateInvoice,
    downloadInvoice,
};
