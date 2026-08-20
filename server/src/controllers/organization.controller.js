import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Organization from "../models/organization.model.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { generateSlug } from "../utils/generateSlug.js";
import mongoose from "mongoose";
import Membership from "../models/membership.model.js";
import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";

const createOrganization = asyncHandler(async (req, res) => {
    const { name, email, phone, website, address, taxId, currency, timezone } =
        req.body;

    let logo = "";

    if (website) {
        try {
            new URL(website);
        } catch {
            throw new ApiError(400, "Invalid website URL");
        }
    }

    if (!name) throw new ApiError(400, "Organization name is required!");

    const slug = generateSlug(name);

    if (req.file) {
        const logoPath = req.file.path;
        const cloudinaryResponse = await uploadToCloudinary(logoPath);
        if (!cloudinaryResponse) {
            throw new ApiError(500, "Failed to upload company logo");
        }
        logo = cloudinaryResponse.url;
    }

    const session = await mongoose.startSession();

    let organization;

    try {
        session.startTransaction();

        [organization] = await Organization.create(
            [
                {
                    name,
                    slug,
                    logo,
                    email,
                    phone,
                    website,
                    address,
                    taxId,
                    currency,
                    timezone,
                    owner: req.user._id,
                },
            ],
            { session }
        );

        await Membership.create(
            [
                {
                    user: req.user._id,
                    organization: organization._id,
                    role: "owner",
                },
            ],
            { session }
        );

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }

    const createdOrganization = await Organization.findById(
        organization._id
    ).populate("owner", "name email avatar");

    res.status(201).json(
        new ApiResponse(
            201,
            createdOrganization,
            "Organization created successfully!"
        )
    );
});

const getOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const organization = await Organization.findById(organizationId).populate(
        "owner",
        "name email avatar"
    );

    if (!organization) throw new ApiError(404, "Organization not found!");

    res.status(200).json(
        new ApiResponse(200, organization, "Organization fetched successfully!")
    );
});

const getMyOrganizations = asyncHandler(async (req, res) => {
    const memberships = await Membership.find({
        user: req.user._id,
        status: "active",
    })
        .populate({
            path: "organization",
            match: { isActive: true },
            populate: {
                path: "owner",
                select: "name email avatar",
            },
        })
        .sort({ createdAt: -1 })
        .lean();

    const activeMemberships = memberships.filter(
        (membership) => membership.organization
    );

    if (activeMemberships.length === 0) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    [],
                    "My organizations fetched successfully"
                )
            );
    }

    const orgIds = activeMemberships.map(
        (membership) => membership.organization._id
    );

    const [memberCountsRaw, clientCountsRaw, invoiceCountsRaw] =
        await Promise.all([
            Membership.aggregate([
                {
                    $match: {
                        organization: { $in: orgIds },
                        status: "active",
                    },
                },
                {
                    $group: {
                        _id: "$organization",
                        count: { $sum: 1 },
                    },
                },
            ]),
            Client.aggregate([
                {
                    $match: {
                        organization: { $in: orgIds },
                        isActive: true,
                    },
                },
                {
                    $group: {
                        _id: "$organization",
                        count: { $sum: 1 },
                    },
                },
            ]),
            Invoice.aggregate([
                {
                    $match: {
                        organization: { $in: orgIds },
                    },
                },
                {
                    $group: {
                        _id: "$organization",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

    const memberMap = new Map(
        memberCountsRaw.map((item) => [item._id.toString(), item.count])
    );
    const clientMap = new Map(
        clientCountsRaw.map((item) => [item._id.toString(), item.count])
    );
    const invoiceMap = new Map(
        invoiceCountsRaw.map((item) => [item._id.toString(), item.count])
    );

    const resolvedOrganizations = activeMemberships.map((membership) => {
        const orgIdStr = membership.organization._id.toString();

        return {
            ...membership.organization,
            role: membership.role,
            membershipId: membership._id,
            membersCount: memberMap.get(orgIdStr) || 0,
            clientsCount: clientMap.get(orgIdStr) || 0,
            invoicesCount: invoiceMap.get(orgIdStr) || 0,
        };
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                resolvedOrganizations,
                "My organizations fetched successfully"
            )
        );
});

const updateOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const organization = await Organization.findById(
        new mongoose.Types.ObjectId(organizationId)
    );

    if (!organization) throw new ApiError(404, "Organization not found!");

    if (organization.owner.toString() !== req.user._id.toString())
        throw new ApiError(
            403,
            "You are not authorized to update this organization!"
        );

    const { name, email, phone, website, address, taxId, currency, timezone } =
        req.body;

    if (name) organization.name = name;
    if (email !== undefined) organization.email = email;
    if (phone !== undefined) organization.phone = phone;
    if (website !== undefined) organization.website = website;
    if (address !== undefined) organization.address = address;
    if (taxId !== undefined) organization.taxId = taxId;
    if (currency) organization.currency = currency;
    if (timezone) organization.timezone = timezone;

    if (req.file) {
        const cloudinaryResponse = await uploadToCloudinary(req.file.path);

        if (!cloudinaryResponse)
            throw new ApiError(500, "Failed to upload company logo!");

        organization.logo = cloudinaryResponse.url;
    }

    await organization.save();

    res.status(200).json(
        new ApiResponse(200, organization, "Organization updated successfully!")
    );
});

const deleteOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const organization = await Organization.findById(organizationId);

    if (!organization) throw new ApiError(404, "Organization not found!");

    if (organization.owner.toString() !== req.user._id.toString())
        throw new ApiError(
            403,
            "You are not authorized to delete this organization!"
        );

    organization.isActive = false;

    await organization.save();

    res.status(200).json(
        new ApiResponse(200, null, "Organization deleted successfully!")
    );
});

export {
    createOrganization,
    getOrganization,
    getMyOrganizations,
    updateOrganization,
    deleteOrganization,
};
