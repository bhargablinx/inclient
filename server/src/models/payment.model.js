import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema({
    organization: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },

    invoice: {
        type: Schema.Types.ObjectId,
        ref: "Invoice",
        required: true,
        index: true,
    },

    amount: {
        type: Number,
        required: true,
        min: 0,
    },

    paymentDate: {
        type: Date,
        required: true,
        default: Date.now,
    },

    paymentMethod: {
        type: String,
        enum: [
            "cash",
            "bank_transfer",
            "upi",
            "credit_card",
            "debit_card",
            "cheque",
            "other",
        ],
        required: true,
    },

    referenceNumber: {
        type: String,
        trim: true,
    },

    receivedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

paymentSchema.index({
    organization: 1,
    paymentDate: -1,
});

paymentSchema.index({
    organization: 1,
    invoice: 1,
    paymentDate: -1,
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
