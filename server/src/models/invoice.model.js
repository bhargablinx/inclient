import mongoose, { Schema } from "mongoose";

const invoiceSchema = new Schema(
    {
        organization: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },

        client: {
            type: Schema.Types.ObjectId,
            ref: "Client",
            required: true,
        },

        invoiceNumber: {
            type: String,
            required: true,
        },

        issueDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        dueDate: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "draft",
                "sent",
                "viewed",
                "partially_paid",
                "paid",
                "overdue",
                "cancelled",
            ],
            default: "draft",
        },

        currency: {
            type: String,
            default: "INR",
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        taxAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        amountPaid: {
            type: Number,
            default: 0,
            min: 0,
        },

        balanceDue: {
            type: Number,
            required: true,
            min: 0,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

invoiceSchema.index(
    {
        organization: 1,
        invoiceNumber: 1,
    },
    {
        unique: true,
    }
);

invoiceSchema.index({
    organization: 1,
    status: 1,
});

invoiceSchema.index({
    organization: 1,
    client: 1,
});

invoiceSchema.index({
    organization: 1,
    createdAt: -1,
});

invoiceSchema.index({
    organization: 1,
    client: 1,
    createdAt: -1,
});

invoiceSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    await mongoose.model("Invoiceitem").deleteMany({ invoice: this._id });
    await mongoose.model("Payment").deleteMany({ invoice: this._id });
    next();
});

invoiceSchema.pre("findOneAndDelete", async function (next) {
    const docToQuery = await this.model.findOne(this.getQuery());
    if (docToQuery) {
        await mongoose.model("Invoiceitem").deleteMany({ invoice: docToQuery._id });
        await mongoose.model("Payment").deleteMany({ invoice: docToQuery._id });
    }
    next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
