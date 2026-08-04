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

clientSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    const invoiceIds = await mongoose.model("Invoice").find({ client: this._id }).distinct("_id");
    await mongoose.model("Invoiceitem").deleteMany({ invoice: { $in: invoiceIds } });
    await mongoose.model("Payment").deleteMany({ invoice: { $in: invoiceIds } });
    await mongoose.model("Invoice").deleteMany({ client: this._id });
    next();
});

clientSchema.pre("findOneAndDelete", async function (next) {
    const docToQuery = await this.model.findOne(this.getQuery());
    if (docToQuery) {
        const invoiceIds = await mongoose.model("Invoice").find({ client: docToQuery._id }).distinct("_id");
        await mongoose.model("Invoiceitem").deleteMany({ invoice: { $in: invoiceIds } });
        await mongoose.model("Payment").deleteMany({ invoice: { $in: invoiceIds } });
        await mongoose.model("Invoice").deleteMany({ client: docToQuery._id });
    }
    next();
});

const Client = mongoose.model("Client", clientSchema);

export default Client;
