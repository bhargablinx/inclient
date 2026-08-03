import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Membership from "../models/membership.model.js";
import Organization from "../models/organization.model.js";
import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";
import mongoose from "mongoose";
import { escapeRegex } from "../utils/escapeRegex.js";

const createClient = asyncHandler(async (req, res) => {
    const { organizationId, name, email, phone, companyName, address, taxId } =
        req.body;

    if (!organizationId) {
        throw new ApiError(400, "Organization ID is required");
    }

    if (!name?.trim()) {
        throw new ApiError(400, "Client name is required");
    }

    const organization = await Organization.findById(organizationId);

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    const membership = await Membership.findOne({
        organization: organizationId,
        user: req.user._id,
    });

    if (!membership) {
        throw new ApiError(403, "You are not a member of this organization");
    }

    const existingClient = await Client.findOne({
        organization: organizationId,
        email: email?.toLowerCase(),
    });

    if (email && existingClient) {
        throw new ApiError(409, "A client with this email already exists");
    }

    const client = await Client.create({
        organization: organizationId,
        name: name.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        companyName: companyName?.trim(),
        address: address?.trim(),
        taxId: taxId?.trim(),
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, client, "Client created successfully"));
});

const getClients = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim();

    const membership = await Membership.findOne({
        organization: new mongoose.Types.ObjectId(organizationId),
        user: req.user._id,
    });

    if (!membership) {
        throw new ApiError(403, "You are not a member of this organization");
    }

    const filter = {
        organization: new mongoose.Types.ObjectId(organizationId),
    };

    if (search) {
        const safeSearch = escapeRegex(search);
        filter.$or = [
            { name: { $regex: safeSearch, $options: "i" } },
            { email: { $regex: safeSearch, $options: "i" } },
            { companyName: { $regex: safeSearch, $options: "i" } },
        ];
    }

    const [clients, totalClients, invoiceStats] = await Promise.all([
        Client.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Client.countDocuments(filter),

        Invoice.aggregate([
            {
                $match: {
                    organization: new mongoose.Types.ObjectId(organizationId),
                    status: { $ne: "cancelled" },
                },
            },
            {
                $group: {
                    _id: "$client",
                    totalRevenue: { $sum: "$totalAmount" },
                    amountPaid: { $sum: "$amountPaid" },
                    outstandingAmount: { $sum: "$balanceDue" },
                    totalInvoices: { $sum: 1 },
                },
            },
        ]),
    ]);

    const statsByClientId = invoiceStats.reduce((acc, stat) => {
        acc[String(stat._id)] = stat;
        return acc;
    }, {});

    const enrichedClients = clients.map((client) => {
        const stats = statsByClientId[String(client._id)] ?? {};

        return {
            ...client,
            totalRevenue: stats.totalRevenue ?? 0,
            amountPaid: stats.amountPaid ?? 0,
            outstandingAmount: stats.outstandingAmount ?? 0,
            totalInvoices: stats.totalInvoices ?? 0,
        };
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                clients: enrichedClients,
                pagination: {
                    page,
                    limit,
                    totalClients,
                    totalPages: Math.ceil(totalClients / limit),
                },
            },
            "Clients fetched successfully"
        )
    );
});

const getClient = asyncHandler(async (req, res) => {
    const { organizationId, clientId } = req.params;

    const client = await Client.findOne({
        _id: clientId,
        organization: organizationId,
    })
        .populate("createdBy", "name email")
        .lean();

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, client, "Client fetched successfully"));
});

const updateClient = asyncHandler(async (req, res) => {
    const { organizationId, clientId } = req.params;

    const { name, email, phone, companyName, address, taxId } = req.body;

    if (name !== undefined && !name.trim()) {
        throw new ApiError(400, "Client name cannot be empty");
    }

    const client = await Client.findOne({
        _id: clientId,
        organization: organizationId,
        isActive: true,
    });

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    // Check email uniqueness within organization
    if (email && email !== client.email) {
        const existingClient = await Client.findOne({
            organization: organizationId,
            email: email.toLowerCase(),
            _id: { $ne: clientId },
        });

        if (existingClient) {
            throw new ApiError(409, "A client with this email already exists");
        }
    }

    if (name !== undefined) client.name = name.trim();
    if (email !== undefined) client.email = email?.trim().toLowerCase();
    if (phone !== undefined) client.phone = phone?.trim();
    if (companyName !== undefined) client.companyName = companyName?.trim();
    if (address !== undefined) client.address = address?.trim();
    if (taxId !== undefined) client.taxId = taxId?.trim();

    await client.save();

    return res
        .status(200)
        .json(new ApiResponse(200, client, "Client updated successfully"));
});

const deleteClient = asyncHandler(async (req, res) => {
    const { organizationId, clientId } = req.params;

    const client = await Client.findOne({
        _id: clientId,
        organization: organizationId,
        isActive: true,
    });

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    client.isActive = false;

    await client.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Client deactivated successfully"));
});

const getClientInvoices = asyncHandler(async (req, res) => {
    const { organizationId, clientId } = req.params;

    const invoices = await Invoice.find({
        organization: organizationId,
        client: clientId,
    })
        .sort({ createdAt: -1 })
        .lean();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                invoices,
                "Client invoices fetched successfully"
            )
        );
});

const getClientStats = asyncHandler(async (req, res) => {
    const { organizationId, clientId } = req.params;

    const [stats] = await Invoice.aggregate([
        {
            $match: {
                organization: new mongoose.Types.ObjectId(organizationId),
                client: new mongoose.Types.ObjectId(clientId),
                status: { $ne: "cancelled" },
            },
        },
        {
            $group: {
                _id: "$client",
                totalInvoices: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
                amountPaid: { $sum: "$amountPaid" },
                outstandingAmount: { $sum: "$balanceDue" },
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            stats ?? {
                totalInvoices: 0,
                totalRevenue: 0,
                amountPaid: 0,
                outstandingAmount: 0,
            },
            "Client stats fetched successfully"
        )
    );
});

export {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    getClientInvoices,
    getClientStats,
};
