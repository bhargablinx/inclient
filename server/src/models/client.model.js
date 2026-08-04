import mongoose, { Schema } from "mongoose";

const clientSchema = new Schema({
    organization: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
    },

    phone: {
        type: String,
        trim: true,
    },

    companyName: {
        type: String,
        trim: true,
        maxlength: 150,
    },

    address: {
        type: String,
        trim: true,
    },

    taxId: {
        type: String,
        trim: true,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

clientSchema.index(
    {
        organization: 1,
        email: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            email: { $exists: true, $type: "string" },
        },
    }
);

clientSchema.index({
    organization: 1,
    name: 1,
});

clientSchema.index({
    organization: 1,
    isActive: 1,
});

const Client = mongoose.model("Client", clientSchema);

export default Client;
