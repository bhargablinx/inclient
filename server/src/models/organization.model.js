import mongoose, { Schema } from "mongoose";

const organizationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        logo: {
            type: String,
            default: "",
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

        website: {
            type: String,
            trim: true,
        },

        address: {
            type: String,
            trim: true,
        },

        taxId: {
            type: String,
            trim: true,
        },

        currency: {
            type: String,
            default: "INR",
        },

        timezone: {
            type: String,
            default: "Asia/Kolkata",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

organizationSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    const orgId = this._id;
    const invoiceIds = await mongoose.model("Invoice").find({ organization: orgId }).distinct("_id");
    await mongoose.model("Invoiceitem").deleteMany({ invoice: { $in: invoiceIds } });
    await mongoose.model("Invoice").deleteMany({ organization: orgId });
    await mongoose.model("Payment").deleteMany({ organization: orgId });
    await mongoose.model("Client").deleteMany({ organization: orgId });
    await mongoose.model("Servicecatalog").deleteMany({ organization: orgId });
    await mongoose.model("Membership").deleteMany({ organization: orgId });
    await mongoose.model("Invitation").deleteMany({ organization: orgId });
    next();
});

organizationSchema.pre("findOneAndDelete", async function (next) {
    const docToQuery = await this.model.findOne(this.getQuery());
    if (docToQuery) {
        const orgId = docToQuery._id;
        const invoiceIds = await mongoose.model("Invoice").find({ organization: orgId }).distinct("_id");
        await mongoose.model("Invoiceitem").deleteMany({ invoice: { $in: invoiceIds } });
        await mongoose.model("Invoice").deleteMany({ organization: orgId });
        await mongoose.model("Payment").deleteMany({ organization: orgId });
        await mongoose.model("Client").deleteMany({ organization: orgId });
        await mongoose.model("Servicecatalog").deleteMany({ organization: orgId });
        await mongoose.model("Membership").deleteMany({ organization: orgId });
        await mongoose.model("Invitation").deleteMany({ organization: orgId });
    }
    next();
});

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
