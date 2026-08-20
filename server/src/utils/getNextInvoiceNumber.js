import Counter from "../models/counter.model.js";
import Invoice from "../models/invoice.model.js";

/**
 * Atomically generates the next sequential invoice number (INV-XXXX) for an organization.
 * Uses MongoDB findOneAndUpdate with $inc to prevent race conditions under concurrent requests.
 */
export const getNextInvoiceNumber = async (organizationId, session = null) => {
    let counter = await Counter.findOne({ organization: organizationId }).session(
        session
    );

    if (!counter) {
        // Inspect existing invoices for backward compatibility with existing data
        const existingInvoices = await Invoice.find({
            organization: organizationId,
        })
            .select("invoiceNumber")
            .session(session)
            .lean();

        let maxSeq = 0;
        for (const inv of existingInvoices) {
            if (inv.invoiceNumber) {
                const match = inv.invoiceNumber.match(/INV-(\d+)/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxSeq) {
                        maxSeq = num;
                    }
                }
            }
        }

        const count = await Invoice.countDocuments({
            organization: organizationId,
        }).session(session);

        maxSeq = Math.max(maxSeq, count);

        // Atomic upsert initializing sequence counter to maxSeq + 1
        counter = await Counter.findOneAndUpdate(
            { organization: organizationId },
            { $setOnInsert: { seq: maxSeq + 1 } },
            { upsert: true, new: true, session }
        );

        return `INV-${String(counter.seq).padStart(4, "0")}`;
    }

    // Atomic increment for existing sequence counter
    counter = await Counter.findOneAndUpdate(
        { organization: organizationId },
        { $inc: { seq: 1 } },
        { new: true, session }
    );

    return `INV-${String(counter.seq).padStart(4, "0")}`;
};
