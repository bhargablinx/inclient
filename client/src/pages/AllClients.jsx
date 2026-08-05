import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import ClientGrowthChart from "@/components/all-clients/ClientGrowthChart";
import ClientStats from "@/components/all-clients/ClientStats";
import ClientStatus from "@/components/all-clients/ClientStatus";
import OutstandingPayments from "@/components/all-clients/OutstandingPayments";
import RecentClients from "@/components/all-clients/RecentClients";
import TopClients from "@/components/all-clients/TopClients";
import Loading from "@/components/Loading";
import {
    getOverview,
    getMonthlyRevenue,
    getRecentInvoices,
    getTopClients,
} from "@/features/dashboard/dashboardThunk";
import { getClients } from "@/features/clients/clientThunk";

const AllClients = () => {
    const dispatch = useDispatch();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const { overview, monthlyRevenue, recentInvoices, topClients, loading } =
        useSelector((state) => state.dashboard);
    const { clients } = useSelector((state) => state.clients);

    useEffect(() => {
        if (!activeOrganization?._id) return;

        dispatch(getOverview(activeOrganization._id));
        dispatch(getMonthlyRevenue(activeOrganization._id));
        dispatch(getRecentInvoices(activeOrganization._id));
        dispatch(getTopClients(activeOrganization._id));
        dispatch(
            getClients({
                organizationId: activeOrganization._id,
                params: { limit: 5 },
            }),
        );
    }, [activeOrganization?._id, dispatch]);

    if (orgLoading || loading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    const totalClients = overview?.summary?.totalClients ?? clients.length ?? 0;
    const activeClients = clients.filter((client) => client.isActive).length;
    const archivedClients = clients.filter((client) => !client.isActive).length;
    const totalOutstanding = overview?.summary?.outstandingAmount ?? 0;
    const totalRevenue = overview?.summary?.totalRevenue ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>

                <p className="text-muted-foreground">
                    Monitor your clients, payments, and overall client
                    performance for{" "}
                    <span className="font-medium text-foreground">
                        {activeOrganization.name}
                    </span>
                    .
                </p>
            </div>

            <ClientStats
                stats={{
                    totalClients,
                    activeClients,
                    archivedClients,
                    outstandingAmount: totalOutstanding,
                    revenue: totalRevenue,
                }}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    {/* <ClientGrowthChart data={monthlyRevenue} /> */}
                    <div className="flex h-full min-h-[300px] items-center justify-center">
                        <span className="text-muted-foreground text-lg font-medium">
                            Coming Soon
                        </span>
                    </div>
                </div>

                <ClientStatus
                    totalClients={totalClients}
                    activeClients={activeClients}
                    archivedClients={archivedClients}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <TopClients clients={topClients} />

                <OutstandingPayments invoices={recentInvoices} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <ClientGrowthChart data={monthlyRevenue} />
                <RecentClients clients={clients} />
            </div>
        </div>
    );
};

export default AllClients;
