import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvoice } from "@/features/invoices/invoiceThunk";
import { generateInvoicePdf, downloadInvoicePdf, sendInvoice, duplicateInvoice } from "@/api/invoice.api";

const InvoiceDetails = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { invoiceId } = useParams();
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const { selectedInvoice, loading: invoiceLoading } = useSelector(
        (state) => state.invoices,
    );

    useEffect(() => {
        if (!activeOrganization?._id || !invoiceId) return;
        dispatch(
            getInvoice({ organizationId: activeOrganization._id, invoiceId }),
        );
    }, [activeOrganization?._id, dispatch, invoiceId]);

    if (orgLoading || invoiceLoading) return <Loading />;

    if (!activeOrganization) return <Navigate to="/organizations/new" replace />;

    const invoice = selectedInvoice?.invoice || selectedInvoice;
    const items = selectedInvoice?.items ?? [];

    const handlePreviewPdf = async () => {
        if (!activeOrganization?._id || !invoiceId) return;
        try {
            const response = await generateInvoicePdf(activeOrganization._id, invoiceId);
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            setPdfPreviewUrl(url);
        } catch (error) {
            console.error("Failed to preview PDF", error);
        }
    };

    const handleViewPdf = async () => {
        if (!activeOrganization?._id || !invoiceId) return;
        try {
            const response = await generateInvoicePdf(activeOrganization._id, invoiceId);
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (error) {
            console.error("Failed to view PDF", error);
        }
    };

    const handleDownloadPdf = async () => {
        if (!activeOrganization?._id || !invoiceId) return;
        try {
            const response = await downloadInvoicePdf(activeOrganization._id, invoiceId);
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Invoice-${invoice?.invoiceNumber || "document"}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download PDF", error);
        }
    };

    const handleSendEmail = async () => {
        if (!activeOrganization?._id || !invoiceId) return;
        try {
            await sendInvoice(activeOrganization._id, invoiceId);
            dispatch(getInvoice({ organizationId: activeOrganization._id, invoiceId }));
            alert(`Invoice #${invoice?.invoiceNumber} emailed successfully!`);
        } catch (error) {
            console.error("Failed to send invoice email", error);
            alert(error.response?.data?.message || "Failed to send email");
        }
    };

    const handleDuplicate = async () => {
        if (!activeOrganization?._id || !invoiceId) return;
        try {
            const res = await duplicateInvoice(activeOrganization._id, invoiceId);
            const duplicated = res.data?.data || res.data;
            alert(`Invoice duplicated as ${duplicated?.invoiceNumber || "new draft"}!`);
            if (duplicated?._id) {
                navigate(`/invoices/${duplicated._id}`);
            }
        } catch (error) {
            console.error("Failed to duplicate invoice", error);
            alert(error.response?.data?.message || "Failed to duplicate invoice");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {invoice?.invoiceNumber || "Invoice Details"}
                    </h1>
                    <p className="text-muted-foreground">
                        View invoice details for{" "}
                        <span className="font-medium text-foreground">
                            {activeOrganization.name}
                        </span>
                        .
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePreviewPdf}>
                        Preview PDF
                    </Button>
                    <Button variant="outline" onClick={handleDuplicate}>
                        Duplicate
                    </Button>
                    <Button variant="outline" onClick={handleSendEmail}>
                        Send Email
                    </Button>
                    <Button onClick={handleDownloadPdf}>
                        Download PDF
                    </Button>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </div>

            {pdfPreviewUrl && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="font-semibold text-lg">PDF Preview - Invoice #{invoice?.invoiceNumber}</h3>
                            <Button variant="ghost" size="sm" onClick={() => {
                                window.URL.revokeObjectURL(pdfPreviewUrl);
                                setPdfPreviewUrl(null);
                            }}>
                                Close
                            </Button>
                        </div>
                        <div className="flex-1 bg-slate-100 p-2">
                            <iframe src={pdfPreviewUrl} className="w-full h-full rounded border-0" title="PDF Preview" />
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                    <Info label="Client" value={invoice?.client?.companyName || invoice?.client?.name || "-"} />
                    <Info label="Status" value={formatStatus(invoice?.status)} />
                    <Info label="Due Date" value={formatDate(invoice?.dueDate)} />
                    <Info label="Total" value={formatAmount(invoice?.totalAmount)} />
                    <Info label="Paid" value={formatAmount(invoice?.amountPaid)} />
                    <Info label="Balance Due" value={formatAmount(invoice?.balanceDue)} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {items.length ? items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-muted-foreground">
                                    {item.quantity} x {formatAmount(item.unitPrice)}
                                </p>
                            </div>
                            <span className="font-semibold">{formatAmount(item.lineTotal)}</span>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">No items found.</p>}
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoiceDetails;

const Info = ({ label, value }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
    </div>
);

const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount || 0);

const formatDate = (date) =>
    date
        ? new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          }).format(new Date(date))
        : "-";

const formatStatus = (status) =>
    (status || "-")
        .replaceAll("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
