import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import InvoiceStatus from "@/components/dashboard/InvoiceStatus";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RecentInvoices from "@/components/dashboard/RecentInvoices";
import RevenueChart from "@/components/dashboard/RevenueChart";
import StatCards from "@/components/dashboard/StatCard";
import TopServices from "@/components/dashboard/TopServices";
import UpcomingPayments from "@/components/dashboard/UpcomingPayments";
import Loading from "@/components/Loading";
import {
    getOverview,
    getMonthlyRevenue,
    getRecentInvoices,
    getTopClients,
} from "@/features/dashboard/dashboardThunk";
import { getServices } from "@/features/services/serviceThunk";

const Dashboard = () => {
    const dispatch = useDispatch();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const { overview, monthlyRevenue, recentInvoices, topClients, loading } =
        useSelector((state) => state.dashboard);
    const { services } = useSelector((state) => state.services);

    useEffect(() => {
        if (!activeOrganization?._id) return;

        dispatch(getOverview(activeOrganization._id));
        dispatch(getMonthlyRevenue(activeOrganization._id));
        dispatch(getRecentInvoices(activeOrganization._id));
        dispatch(getTopClients(activeOrganization._id));
        dispatch(
            getServices({
                organizationId: activeOrganization._id,
                params: { limit: 6 },
            }),
        );
    }, [activeOrganization?._id, dispatch]);

    const dashboardData = useMemo(() => {
        const summary = overview?.summary ?? {};
        const invoiceStats = overview?.invoiceStats ?? {};

        const statCards = [
            {
                title: "Total Revenue",
                value: formatAmount(summary.totalRevenue),
                change: `${summary.totalInvoices ?? 0} invoices`,
            },
            {
                title: "Invoices",
                value: String(summary.totalInvoices ?? 0),
                change: `${invoiceStats.paid ?? 0} paid`,
            },
            {
                title: "Clients",
                value: String(summary.totalClients ?? 0),
                change: `${topClients.length} top clients`,
            },
            {
                title: "Outstanding",
                value: formatAmount(summary.outstandingAmount),
                change: `${invoiceStats.overdue ?? 0} overdue invoices`,
            },
        ];

        const statusBreakdown = [
            {
                status: "Paid",
                value: percent(invoiceStats.paid, summary.totalInvoices),
                color: "bg-green-500",
            },
            {
                status: "Pending",
                value: percent(
                    invoiceStats.sent +
                        invoiceStats.viewed +
                        invoiceStats.partiallyPaid,
                    summary.totalInvoices,
                ),
                color: "bg-yellow-500",
            },
            {
                status: "Overdue",
                value: percent(invoiceStats.overdue, summary.totalInvoices),
                color: "bg-red-500",
            },
        ];

        const recentInvoicesList = (recentInvoices ?? []).map((invoice) => ({
            id: invoice.invoiceNumber,
            client:
                invoice.client?.companyName ||
                invoice.client?.name ||
                "Unknown Client",
            amount: formatAmount(invoice.totalAmount),
            status: capitalizeStatus(invoice.status),
        }));

        const upcomingPayments = (recentInvoices ?? [])
            .filter((invoice) => Number(invoice.balanceDue || 0) > 0)
            .slice(0, 3)
            .map((invoice) => ({
                client:
                    invoice.client?.companyName ||
                    invoice.client?.name ||
                    "Unknown Client",
                due: dueLabel(invoice.dueDate),
                amount: formatAmount(invoice.balanceDue),
            }));

        const activity = buildActivity(recentInvoices ?? []);

        const topServicesList = (services ?? []).slice(0, 4).map((service) => ({
            name: service.name,
            revenue: formatAmount(service.unitPrice ?? 0),
            progress: Math.min(
                100,
                Math.round(Number(service.taxRate ?? 0) * 10),
            ),
        }));

        const chartData = buildChartData(monthlyRevenue ?? []);

        return {
            statCards,
            statusBreakdown,
            recentInvoicesList,
            upcomingPayments,
            activity,
            topServicesList,
            chartData,
        };
    }, [overview, monthlyRevenue, recentInvoices, topClients, services]);

    if (orgLoading || loading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <div className="space-y-6">
            <StatCards stats={dashboardData.statCards} />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueChart data={dashboardData.chartData} />
                </div>

                <InvoiceStatus statusItems={dashboardData.statusBreakdown} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <RecentInvoices invoices={dashboardData.recentInvoicesList} />
                <UpcomingPayments payments={dashboardData.upcomingPayments} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentActivity activities={dashboardData.activity} />
                </div>

                {/* <TopServices services={dashboardData.topServicesList} /> */}
            </div>

            {/* <QuickActions /> */}
        </div>
    );
};

export default Dashboard;

const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount || 0);

const capitalizeStatus = (status) =>
    (status || "Unknown")
        .replaceAll("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const percent = (value, total) =>
    total ? Math.max(0, Math.round((Number(value || 0) / total) * 100)) : 0;

const dueLabel = (date) => {
    if (!date) return "Due date unavailable";

    const diffDays = Math.round(
        (new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `In ${diffDays} days`;
};

const buildActivity = (invoices) => {
    const items = [];

    invoices.slice(0, 4).forEach((invoice) => {
        items.push({
            icon: "invoice",
            title: `Invoice ${invoice.invoiceNumber} created`,
            time: relativeTime(invoice.createdAt),
        });
        if (invoice.status === "paid") {
            items.push({
                icon: "paid",
                title: `Invoice ${invoice.invoiceNumber} marked as paid`,
                time: relativeTime(invoice.updatedAt || invoice.createdAt),
            });
        }
    });

    return items.slice(0, 4);
};

const relativeTime = (date) => {
    if (!date) return "Recently";

    const diffMinutes = Math.max(
        0,
        Math.round((Date.now() - new Date(date).getTime()) / (60 * 1000)),
    );

    if (diffMinutes < 60)
        return `${diffMinutes || 1} minute${diffMinutes === 1 ? "" : "s"} ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24)
        return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    return `${Math.round(diffHours / 24)} day${Math.round(diffHours / 24) === 1 ? "" : "s"} ago`;
};

const buildChartData = (revenue) => {
    const months = [];
    const now = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        months.push(d.toLocaleString("en-US", { month: "short" }));
    }

    const bucket = new Map();
    revenue.forEach((item) => {
        const key = monthLabel(item.month);
        bucket.set(key, Number(item.revenue || 0));
    });

    return months.map((month) => ({ month, revenue: bucket.get(month) || 0 }));
};

const monthLabel = (monthNum) => {
    if (!monthNum) return "";
    const date = new Date(2024, monthNum - 1, 1);
    return date.toLocaleString("en-US", { month: "short" });
};
