import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

const invitationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

    organization: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },

    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
        required: true,
    },

    status: {
        type: String,
        enum: ["pending", "accepted", "expired", "revoked"],
        default: "pending",
    },

    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    invitationToken: {
        type: String,
    },

    expiresAt: {
        type: Date,
    },

    acceptedAt: {
        type: Date,
        default: null,
    },
});

invitationSchema.methods.generateToken = function () {
    const unHashedToken = crypto.randomBytes(32).toString("hex");
    this.invitationToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");
    this.expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24 hrs
    return unHashedToken;
};

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
