import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";

import Loading from "@/components/Loading";
import PaymentHeader from "@/components/payments/PaymentHeader";
import PaymentStats from "@/components/payments/PaymentStats";
import PaymentTable from "@/components/payments/PaymentTable";
import RecordPaymentCard from "@/components/payments/RecordPaymentCard";
import { getInvoices } from "@/features/invoices/invoiceThunk";
import {
    deletePayment,
    getOrganizationPayments,
} from "@/features/payments/paymentThunk";

const Payments = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const { payments, loading: paymentLoading } = useSelector(
        (state) => state.payments,
    );
    const { invoices } = useSelector((state) => state.invoices);
    const [filters] = useState({
        search: "",
    });

    useEffect(() => {
        if (!activeOrganization?._id) return;

        dispatch(
            getOrganizationPayments({
                organizationId: activeOrganization._id,
                params: { limit: 100, ...(filters.search ? { search: filters.search } : {}) },
            }),
        );
        dispatch(
            getInvoices({
                organizationId: activeOrganization._id,
                params: { limit: 100 },
            }),
        );
    }, [activeOrganization?._id, dispatch, filters.search]);

    const paymentData = useMemo(() => {
        const list = payments ?? [];

        const totalPayments = list.length;
        const totalAmount = list.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const completedPayments = totalPayments;
        const pendingPayments = 0;
        const failedPayments = 0;

        return {
            stats: {
                totalAmount: formatAmount(totalAmount),
                totalPayments,
                completedPayments,
                pendingPayments,
                failedPayments,
            },
            payments: list.map((payment) => ({
                id: payment._id,
                invoiceId: payment.invoice?._id,
                invoice: payment.invoice?.invoiceNumber || "-",
                client:
                    payment.invoice?.client?.companyName ||
                    payment.invoice?.client?.name ||
                    "Unknown Client",
                date: formatDate(payment.paymentDate),
                amount: formatAmount(payment.amount),
                method: formatPaymentMethod(payment.paymentMethod),
                status: formatPaymentStatus(payment),
                raw: payment,
            })),
            preview: list[0] || null,
        };
    }, [payments]);

    const handleDeletePayment = async (payment) => {
        if (!payment.invoiceId) return;
        if (!window.confirm("Delete this payment?")) return;

        await dispatch(
            deletePayment({
                organizationId: activeOrganization._id,
                invoiceId: payment.invoiceId,
                paymentId: payment.id,
            }),
        ).unwrap();

        dispatch(
            getOrganizationPayments({
                organizationId: activeOrganization._id,
                params: { limit: 100 },
            }),
        );
    };

    const handleDownloadReceipt = (payment) => {
        const blob = new Blob([buildReceipt(payment)], {
            type: "text/plain;charset=utf-8",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${payment.id}-receipt.txt`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    if (orgLoading || paymentLoading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <div className="space-y-6">
            <PaymentHeader organizationName={activeOrganization.name} />

            <PaymentStats stats={paymentData.stats} />

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <PaymentTable
                        payments={paymentData.payments}
                        onView={(payment) => navigate(`/payments/${payment.id}`)}
                        onDownloadReceipt={handleDownloadReceipt}
                        onDelete={handleDeletePayment}
                    />
                </div>

                <RecordPaymentCard
                    organizationId={activeOrganization._id}
                    invoices={invoices}
                    onPaymentCreated={() =>
                        dispatch(
                            getOrganizationPayments({
                                organizationId: activeOrganization._id,
                                params: { limit: 100 },
                            }),
                        )
                    }
                />
            </div>
        </div>
    );
};

export default Payments;

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

const formatPaymentMethod = (method) =>
    (method || "other")
        .replaceAll("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const formatPaymentStatus = (payment) => {
    if (!payment) return "Pending";
    return "Completed";
};

const buildReceipt = (payment) =>
    [
        "InvoiceFlow Payment Receipt",
        `Payment ID: ${payment.id}`,
        `Invoice: ${payment.invoice}`,
        `Client: ${payment.client}`,
        `Date: ${payment.date}`,
        `Method: ${payment.method}`,
        `Amount: ${payment.amount}`,
        `Status: ${payment.status}`,
    ].join("\n");
