import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Invoice from "../models/invoice.model.js";
import Payment from "../models/payment.model.js";
import mongoose from "mongoose";
import recalculateInvoicePaymentStatus from "../utils/recalculatePayment.js";
import Client from "../models/client.model.js";

const createPayment = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const { amount, paymentDate, paymentMethod, referenceNumber } = req.body;

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Payment amount must be greater than 0");
    }

    if (!paymentMethod) {
        throw new ApiError(400, "Payment method is required");
    }

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    });

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.status === "cancelled") {
        throw new ApiError(
            400,
            "Cannot record payment for a cancelled invoice"
        );
    }

    if (amount > invoice.balanceDue) {
        throw new ApiError(
            400,
            `Payment amount cannot exceed balance due (${invoice.balanceDue})`
        );
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const [payment] = await Payment.create(
            [
                {
                    organization: organizationId,
                    invoice: invoiceId,
                    amount,
                    paymentDate,
                    paymentMethod,
                    referenceNumber,
                    receivedBy: req.user._id,
                },
            ],
            { session }
        );

        const updatedInvoice = await recalculateInvoicePaymentStatus(
            invoiceId,
            session
        );

        await session.commitTransaction();

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    payment,
                    invoice: {
                        _id: updatedInvoice._id,
                        status: updatedInvoice.status,
                        amountPaid: updatedInvoice.amountPaid,
                        balanceDue: updatedInvoice.balanceDue,
                    },
                },
                "Payment recorded successfully"
            )
        );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

const getPayments = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId } = req.params;

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        organization: organizationId,
    });

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    const payments = await Payment.find({
        organization: organizationId,
        invoice: invoiceId,
    })
        .populate("receivedBy", "name email")
        .sort({ paymentDate: -1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                invoice: {
                    _id: invoice._id,
                    invoiceNumber: invoice.invoiceNumber,
                    totalAmount: invoice.totalAmount,
                    amountPaid: invoice.amountPaid,
                    balanceDue: invoice.balanceDue,
                    status: invoice.status,
                },
                payments,
            },
            "Payments fetched successfully"
        )
    );
});

const getPayment = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId, paymentId } = req.params;

    const payment = await Payment.findOne({
        _id: paymentId,
        organization: organizationId,
        invoice: invoiceId,
    })
        .populate("receivedBy", "name email")
        .populate({
            path: "invoice",
            select: "invoiceNumber totalAmount amountPaid balanceDue status",
        })
        .lean();

    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, payment, "Payment fetched successfully"));
});

const updatePayment = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId, paymentId } = req.params;
    const { amount, paymentDate, paymentMethod, referenceNumber } = req.body;

    if (amount !== undefined && amount <= 0) {
        throw new ApiError(400, "Payment amount must be greater than 0");
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const payment = await Payment.findOne({
            _id: paymentId,
            organization: organizationId,
            invoice: invoiceId,
        }).session(session);

        if (!payment) {
            throw new ApiError(404, "Payment not found");
        }

        const invoice = await Invoice.findOne({
            _id: invoiceId,
            organization: organizationId,
        }).session(session);

        if (!invoice) {
            throw new ApiError(404, "Invoice not found");
        }

        if (amount !== undefined && amount !== payment.amount) {
            const currentPaidWithoutPayment = invoice.amountPaid - payment.amount;
            const maxAllowed = invoice.totalAmount - currentPaidWithoutPayment;

            if (amount > maxAllowed) {
                throw new ApiError(
                    400,
                    `Payment amount (${amount}) exceeds remaining invoice balance (${maxAllowed.toFixed(2)})`
                );
            }
            payment.amount = amount;
        }

        if (paymentDate !== undefined) payment.paymentDate = paymentDate;
        if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
        if (referenceNumber !== undefined) payment.referenceNumber = referenceNumber;

        await payment.save({ session });

        const updatedInvoice = await recalculateInvoicePaymentStatus(
            invoiceId,
            session
        );

        await session.commitTransaction();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    payment,
                    invoice: {
                        _id: updatedInvoice._id,
                        status: updatedInvoice.status,
                        amountPaid: updatedInvoice.amountPaid,
                        balanceDue: updatedInvoice.balanceDue,
                    },
                },
                "Payment updated successfully"
            )
        );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

const deletePayment = asyncHandler(async (req, res) => {
    const { organizationId, invoiceId, paymentId } = req.params;

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const payment = await Payment.findOne({
            _id: paymentId,
            organization: organizationId,
            invoice: invoiceId,
        }).session(session);

        if (!payment) {
            throw new ApiError(404, "Payment not found");
        }

        await Payment.deleteOne(
            {
                _id: paymentId,
            },
            { session }
        );

        const updatedInvoice = await recalculateInvoicePaymentStatus(
            invoiceId,
            session
        );

        await session.commitTransaction();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    invoice: {
                        _id: updatedInvoice._id,
                        status: updatedInvoice.status,
                        amountPaid: updatedInvoice.amountPaid,
                        balanceDue: updatedInvoice.balanceDue,
                    },
                },
                "Payment deleted successfully"
            )
        );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

const getOrganizationPayments = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {
        organization: organizationId,
    };

    if (status) {
        if (status === "completed") {
            filter.amount = { $gt: 0 };
        }
    }

    const [payments, totalPayments, amountSummary] = await Promise.all([
        Payment.find(filter)
            .populate({
                path: "invoice",
                select: "invoiceNumber client totalAmount amountPaid balanceDue status dueDate issueDate",
                populate: {
                    path: "client",
                    select: "name companyName email",
                },
            })
            .populate("receivedBy", "name email")
            .sort({ paymentDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Payment.countDocuments(filter),
        Payment.aggregate([
            { $match: { organization: new mongoose.Types.ObjectId(organizationId) } },
            {
                $group: {
                    _id: null,
                    totalPayments: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]),
    ]);

    const normalizedSearch = (search || "").trim().toLowerCase();
    const filteredPayments = normalizedSearch
        ? payments.filter((payment) => {
              const invoiceNumber = payment.invoice?.invoiceNumber || "";
              const clientName =
                  payment.invoice?.client?.companyName ||
                  payment.invoice?.client?.name ||
                  "";
              const referenceNumber = payment.referenceNumber || "";

              return (
                  invoiceNumber.toLowerCase().includes(normalizedSearch) ||
                  clientName.toLowerCase().includes(normalizedSearch) ||
                  referenceNumber.toLowerCase().includes(normalizedSearch)
              );
          })
        : payments;

    const completed = filteredPayments.filter((payment) =>
        ["cash", "bank_transfer", "upi", "credit_card", "debit_card", "cheque", "other"].includes(
            payment.paymentMethod,
        ),
    ).length;

    const summary = amountSummary[0] || {};

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                payments: filteredPayments,
                pagination: {
                    page,
                    limit,
                    totalPayments,
                    totalPages: Math.ceil(totalPayments / limit),
                },
                summary: {
                    totalPayments: summary.totalPayments || 0,
                    totalAmount: summary.totalAmount || 0,
                    completedPayments: completed,
                    pendingPayments: 0,
                    failedPayments: 0,
                },
            },
            "Payments fetched successfully"
        )
    );
});

export {
    createPayment,
    getPayments,
    getPayment,
    updatePayment,
    deletePayment,
    getOrganizationPayments,
};
