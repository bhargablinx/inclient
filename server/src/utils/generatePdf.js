import PDFDocument from "pdfkit";

/**
 * Builds a clean, professional PDF invoice layout.
 * @param {PDFDocument} doc - PDFKit document instance.
 * @param {Object} data - Contains invoice, client, organization, and items data.
 */
export const buildInvoicePdf = (doc, { invoice, items, organization }) => {
    const primaryColor = "#1E3A8A";
    const darkTextColor = "#1F2937";
    const lightGray = "#F3F4F6";
    const borderColor = "#E5E7EB";

    const client = invoice.client || {};
    const currencySymbol = invoice.currency === "USD" ? "$" : invoice.currency === "EUR" ? "€" : "₹";

    // --- Header Section ---
    doc.fillColor(primaryColor)
       .fontSize(22)
       .font("Helvetica-Bold")
       .text(organization?.name || "InClient", 50, 45);

    doc.fillColor(primaryColor)
       .fontSize(24)
       .font("Helvetica-Bold")
       .text("INVOICE", 400, 45, { align: "right" });

    doc.fillColor(darkTextColor)
       .fontSize(9)
       .font("Helvetica")
       .text(organization?.email || "", 50, 72)
       .text(organization?.phone || "", 50, 85)
       .text(organization?.address || "", 50, 98);

    doc.fillColor(darkTextColor)
       .fontSize(10)
       .font("Helvetica-Bold")
       .text(`Invoice No: ${invoice.invoiceNumber}`, 350, 72, { align: "right" })
       .font("Helvetica")
       .text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`, 350, 87, { align: "right" })
       .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, 102, { align: "right" })
       .text(`Status: ${invoice.status.toUpperCase()}`, 350, 117, { align: "right" });

    // Divider
    doc.moveTo(50, 140).lineTo(550, 140).strokeColor(borderColor).stroke();

    // --- Bill To Section ---
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font("Helvetica-Bold")
       .text("Billed To:", 50, 155);

    doc.fillColor(darkTextColor)
       .fontSize(10)
       .font("Helvetica-Bold")
       .text(client.name || "Client Name", 50, 172)
       .font("Helvetica")
       .text(client.companyName || "", 50, 186)
       .text(client.email || "", 50, 200)
       .text(client.address || "", 50, 214);

    if (client.taxId) {
        doc.text(`Tax ID: ${client.taxId}`, 50, 228);
    }

    // --- Items Table Header ---
    const tableTop = 260;
    doc.rect(50, tableTop, 500, 22).fill(lightGray);

    doc.fillColor(primaryColor)
       .fontSize(9)
       .font("Helvetica-Bold")
       .text("Item / Description", 60, tableTop + 6)
       .text("Qty", 280, tableTop + 6, { width: 40, align: "right" })
       .text("Price", 330, tableTop + 6, { width: 60, align: "right" })
       .text("Tax %", 400, tableTop + 6, { width: 40, align: "right" })
       .text("Total", 460, tableTop + 6, { width: 80, align: "right" });

    let position = tableTop + 30;

    // --- Items Table Rows ---
    doc.font("Helvetica").fontSize(9).fillColor(darkTextColor);

    items.forEach((item) => {
        const lineTotal = item.lineTotal || (item.quantity * item.unitPrice - (item.discountAmount || 0));

        doc.text(item.description || "Service Item", 60, position, { width: 210 })
           .text(String(item.quantity), 280, position, { width: 40, align: "right" })
           .text(`${currencySymbol}${Number(item.unitPrice).toFixed(2)}`, 330, position, { width: 60, align: "right" })
           .text(`${item.taxRate || 0}%`, 400, position, { width: 40, align: "right" })
           .text(`${currencySymbol}${Number(lineTotal).toFixed(2)}`, 460, position, { width: 80, align: "right" });

        position += 20;

        doc.moveTo(50, position - 5).lineTo(550, position - 5).strokeColor(borderColor).stroke();
    });

    // --- Summary Section ---
    const summaryTop = position + 15;

    doc.font("Helvetica").fontSize(10);

    doc.text("Subtotal:", 350, summaryTop, { width: 100, align: "right" })
       .text(`${currencySymbol}${Number(invoice.subtotal).toFixed(2)}`, 460, summaryTop, { width: 80, align: "right" });

    doc.text("Tax Amount:", 350, summaryTop + 18, { width: 100, align: "right" })
       .text(`${currencySymbol}${Number(invoice.taxAmount).toFixed(2)}`, 460, summaryTop + 18, { width: 80, align: "right" });

    doc.text("Discount:", 350, summaryTop + 36, { width: 100, align: "right" })
       .text(`-${currencySymbol}${Number(invoice.discountAmount).toFixed(2)}`, 460, summaryTop + 36, { width: 80, align: "right" });

    doc.moveTo(350, summaryTop + 56).lineTo(550, summaryTop + 56).strokeColor(borderColor).stroke();

    doc.font("Helvetica-Bold")
       .fontSize(11)
       .text("Total Amount:", 350, summaryTop + 65, { width: 100, align: "right" })
       .text(`${currencySymbol}${Number(invoice.totalAmount).toFixed(2)}`, 460, summaryTop + 65, { width: 80, align: "right" });

    doc.font("Helvetica")
       .fontSize(10)
       .text("Amount Paid:", 350, summaryTop + 85, { width: 100, align: "right" })
       .text(`${currencySymbol}${Number(invoice.amountPaid).toFixed(2)}`, 460, summaryTop + 85, { width: 80, align: "right" });

    const balanceColor = invoice.balanceDue > 0 ? "#DC2626" : "#16A34A";
    doc.font("Helvetica-Bold")
       .fontSize(11)
       .fillColor(balanceColor)
       .text("Balance Due:", 350, summaryTop + 105, { width: 100, align: "right" })
       .text(`${currencySymbol}${Number(invoice.balanceDue).toFixed(2)}`, 460, summaryTop + 105, { width: 80, align: "right" });

    // --- Footer ---
    doc.fillColor("#6B7280")
       .fontSize(9)
       .font("Helvetica-Oblique")
       .text("Thank you for your business! Generated by InClient Platform.", 50, 720, { align: "center", width: 500 });
};
