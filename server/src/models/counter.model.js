import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema(
    {
        organization: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true,
            index: true,
        },

        seq: {
            type: Number,
            default: 0,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
