import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js";
import { invitationTemplate } from "../utils/emailTemplate.js";
import { sendMail } from "../utils/sendMail.js";
import crypto from "crypto";
import Organization from "../models/organization.model.js";
import Membership from "../models/membership.model.js";

const inviteUser = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { email, role } = req.body;

    if (!email || !role) throw new ApiError(400, "Email or role is missing");

    const allowedRoles = ["admin", "member"];

    if (!allowedRoles.includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) throw new ApiError(404, "Organization not found!");

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === req.user.email.toLowerCase()) {
        throw new ApiError(400, "You cannot invite yourself");
    }

    const userToInvite = await User.findOne({
        email: normalizedEmail,
    });

    if (userToInvite) {
        const existingMembership = await Membership.findOne({
            user: userToInvite._id,
            organization: organizationId,
        });

        if (existingMembership) {
            throw new ApiError(
                400,
                "User is already a member of this organization"
            );
        }
    }

    const existingInvitation = await Invitation.findOne({
        email: normalizedEmail,
        organization: organizationId,
        status: "pending",
    });

    if (existingInvitation) {
        throw new ApiError(400, "User already has a pending invitation");
    }

    const invitation = await Invitation.create({
        user: userToInvite ? userToInvite._id : null,
        organization: organizationId,
        role,
        email: normalizedEmail,
        invitedBy: req.user._id,
    });

    const invitationToken = invitation.generateToken();
    await invitation.save({ validateBeforeSave: false });

    // Sending Mail
    const invitationUrl = `${process.env.CLIENT_URL}/invitations/${invitationToken}`;
    try {
        await sendMail(
            normalizedEmail,
            `Invitation to join ${organization.name}`,
            invitationTemplate(
                organization.name,
                invitation.role,
                invitationUrl
            )
        );
    } catch (error) {
        await Invitation.findByIdAndDelete(invitation._id);

        throw new ApiError(500, "Invitation email could not be sent");
    }

    res.status(201).json(
        new ApiResponse(201, null, "Mail is sent and user is invited!!")
    );
});

const acceptInvitation = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const invitation = await Invitation.findOne({
        invitationToken: hashedToken,
        expiresAt: {
            $gt: Date.now(),
        },
        status: "pending",
    });

    if (!invitation) {
        throw new ApiError(400, "Invalid or expired invitation");
    }

    // Ensure invitation matches logged-in user
    const isUserMatch = invitation.user
        ? invitation.user.equals(req.user._id)
        : invitation.email.toLowerCase() === req.user.email.toLowerCase();

    if (!isUserMatch) {
        throw new ApiError(403, "This invitation is not for you");
    }

    // Prevent duplicate membership
    const existingMembership = await Membership.findOne({
        user: req.user._id,
        organization: invitation.organization,
    });

    if (existingMembership) {
        throw new ApiError(
            400,
            "You are already a member of this organization"
        );
    }

    const membership = await Membership.create({
        user: req.user._id,
        organization: invitation.organization,
        role: invitation.role,
    });

    invitation.status = "accepted";
    invitation.user = req.user._id;
    invitation.invitationToken = undefined;
    invitation.expiresAt = undefined;

    await invitation.save({
        validateBeforeSave: false,
    });

    res.status(200).json(
        new ApiResponse(200, membership, "Invitation accepted successfully")
    );
});

const rejectInvitation = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const invitation = await Invitation.findOne({
        invitationToken: hashedToken,
        expiresAt: {
            $gt: Date.now(),
        },
        status: "pending",
    });

    if (!invitation) {
        throw new ApiError(400, "Invalid or expired invitation");
    }

    // Ensure invitation matches logged-in user
    const isUserMatch = invitation.user
        ? invitation.user.equals(req.user._id)
        : invitation.email.toLowerCase() === req.user.email.toLowerCase();

    if (!isUserMatch) {
        throw new ApiError(403, "This invitation is not for you");
    }

    invitation.status = "rejected";
    invitation.invitationToken = undefined;
    invitation.expiresAt = undefined;

    await invitation.save({
        validateBeforeSave: false,
    });

    res.status(200).json(
        new ApiResponse(200, null, "Invitation rejected successfully")
    );
});

const getInvitations = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { status = "pending" } = req.query;
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }
    const invitations = await Invitation.find({
        organization: organizationId,
        status,
    })
        .populate("user", "name email avatar")
        .populate("invitedBy", "name email avatar")
        .sort({ createdAt: -1 });
    res.status(200).json(
        new ApiResponse(200, invitations, "Invitations fetched successfully")
    );
});

export { inviteUser, acceptInvitation, rejectInvitation, getInvitations };
