import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import InvoiceHeader from "@/components/invoices-dashboard/InvoiceHeader";
import InvoiceStats from "@/components/invoices-dashboard/InvoiceStats";
import InvoiceStatus from "@/components/invoices-dashboard/InvoiceStatus";
import OutstandingInvoices from "@/components/invoices-dashboard/OutstandingInvoices";
import RecentInvoices from "@/components/invoices-dashboard/RecentInvoices";
import RevenueChart from "@/components/invoices-dashboard/RevenueChart";
import UpcomingDueDates from "@/components/invoices-dashboard/UpcomingDueDates";
import Loading from "@/components/Loading";
import { getInvoices } from "@/features/invoices/invoiceThunk";

const ViewInvoices = () => {
    const dispatch = useDispatch();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const { invoices, loading: invoiceLoading } = useSelector(
        (state) => state.invoices,
    );

    useEffect(() => {
        if (!activeOrganization?._id) return;

        dispatch(
            getInvoices({
                organizationId: activeOrganization._id,
                params: { limit: 100 },
            }),
        );
    }, [activeOrganization?._id, dispatch]);

    const dashboardData = useMemo(() => {
        const items = invoices ?? [];

        const normalizedStatus = (status) => (status || "").toLowerCase();
        const formatMoney = (amount) =>
            new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            }).format(amount || 0);

        const totalInvoices = items.length;
        const paidInvoices = items.filter((item) =>
            ["paid"].includes(normalizedStatus(item.status)),
        );
        const pendingInvoices = items.filter((item) =>
            ["sent", "viewed", "partially_paid", "draft"].includes(
                normalizedStatus(item.status),
            ),
        );
        const overdueInvoices = items.filter((item) =>
            ["overdue"].includes(normalizedStatus(item.status)),
        );

        const paidAmount = paidInvoices.reduce(
            (sum, item) => sum + (item.totalAmount || 0),
            0,
        );
        const pendingAmount = pendingInvoices.reduce(
            (sum, item) => sum + (item.balanceDue || 0),
            0,
        );
        const overdueAmount = overdueInvoices.reduce(
            (sum, item) => sum + (item.balanceDue || 0),
            0,
        );

        const totalAmount = items.reduce(
            (sum, item) => sum + (item.totalAmount || 0),
            0,
        );

        const statusCounts = [
            { status: "Paid", count: paidInvoices.length },
            { status: "Pending", count: pendingInvoices.length },
            { status: "Overdue", count: overdueInvoices.length },
        ];

        const statusItems = statusCounts.map((item) => ({
            ...item,
            value:
                totalInvoices > 0
                    ? Math.round((item.count / totalInvoices) * 100)
                    : 0,
        }));

        const recentInvoices = [...items]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4)
            .map((invoice) => ({
                id: invoice.invoiceNumber,
                client:
                    invoice.client?.companyName ||
                    invoice.client?.name ||
                    "Unknown Client",
                amount: formatMoney(invoice.totalAmount),
                status: capitalizeStatus(invoice.status),
            }));

        const outstandingInvoices = [...items]
            .filter((invoice) => invoice.balanceDue > 0)
            .sort((a, b) => (b.balanceDue || 0) - (a.balanceDue || 0))
            .slice(0, 4)
            .map((invoice) => ({
                id: invoice.invoiceNumber,
                client:
                    invoice.client?.companyName ||
                    invoice.client?.name ||
                    "Unknown Client",
                amount: formatMoney(invoice.balanceDue),
                due: buildDueLabel(invoice.dueDate, invoice.status),
                status: capitalizeStatus(invoice.status),
            }));

        const upcomingDueDates = [...items]
            .filter((invoice) => ["draft", "sent", "viewed", "partially_paid"].includes(normalizedStatus(invoice.status)))
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3)
            .map((invoice) => ({
                id: invoice.invoiceNumber,
                client:
                    invoice.client?.companyName ||
                    invoice.client?.name ||
                    "Unknown Client",
                due: buildDueLabel(invoice.dueDate, invoice.status),
                amount: formatMoney(invoice.balanceDue ?? invoice.totalAmount),
                status:
                    normalizedStatus(invoice.status) === "overdue"
                        ? "Overdue"
                        : "Upcoming",
            }));

        const monthlyRevenue = buildMonthlyRevenue(items);

        return {
            stats: {
                totalInvoices,
                paidAmount: formatMoney(paidAmount),
                pendingAmount: formatMoney(pendingAmount),
                overdueAmount: formatMoney(overdueAmount),
                totalAmount: formatMoney(totalAmount),
            },
            statusItems,
            recentInvoices,
            outstandingInvoices,
            upcomingDueDates,
            monthlyRevenue,
        };
    }, [invoices]);

    if (orgLoading || invoiceLoading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <div className="space-y-6">
            <InvoiceHeader organizationName={activeOrganization.name} />

            <InvoiceStats stats={dashboardData.stats} />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueChart monthlyRevenue={dashboardData.monthlyRevenue} />
                </div>

                {/* InvoiceStatus */}
                <InvoiceStatus statusItems={dashboardData.statusItems} />
            </div>

            {/* RecentInvoices */}
            <RecentInvoices invoices={dashboardData.recentInvoices} />

            {/* UpcomingDueDates */}
            <UpcomingDueDates invoices={dashboardData.upcomingDueDates} />

            {/* OutstandingInvoices */}
            <OutstandingInvoices invoices={dashboardData.outstandingInvoices} />
        </div>
    );
};

export default ViewInvoices;

const capitalizeStatus = (status) => {
    if (!status) return "Unknown";
    return status
        .replaceAll("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const buildDueLabel = (dueDate, status) => {
    if (!dueDate) return "No due date";

    const due = new Date(dueDate);
    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((due - today) / msPerDay);

    if (normalizedStatus(status) === "overdue" || diffDays < 0) {
        return `Overdue by ${Math.abs(diffDays)} Day${Math.abs(diffDays) === 1 ? "" : "s"}`;
    }

    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Due Tomorrow";
    return `Due in ${diffDays} Days`;
};

const buildMonthlyRevenue = (items) => {
    const buckets = new Map();
    const monthOrder = getLastSixMonths();

    items.forEach((invoice) => {
        const date = new Date(invoice.createdAt || invoice.issueDate || Date.now());
        const key = date.toLocaleString("en-US", { month: "short" });
        buckets.set(key, (buckets.get(key) || 0) + (invoice.totalAmount || 0));
    });

    return monthOrder.map((month) => ({
        month,
        amount: buckets.get(month) || 0,
    }));
};

const getLastSixMonths = () => {
    const months = [];
    const now = new Date();

    for (let offset = 5; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        months.push(date.toLocaleString("en-US", { month: "short" }));
    }

    return months;
};

function normalizedStatus(status) {
    return (status || "").toLowerCase();
}
