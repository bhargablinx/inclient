import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import AddClientDialog from "@/components/manage-clients/AddClientDialog";
import ClientFilters from "@/components/manage-clients/ClientFilters";
import ClientStats from "@/components/manage-clients/ClientStats";
import ClientsHeader from "@/components/manage-clients/ClientsHeader";
import ClientsTable from "@/components/manage-clients/ClientsTable";
import ArchivedClients from "@/components/manage-clients/ArchivedClients";
import Loading from "@/components/Loading";
import { getClients } from "@/features/clients/clientThunk";

const ManageClients = () => {
    const dispatch = useDispatch();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("latest");

    const fetchClients = useCallback(async () => {
        if (!activeOrganization?._id) return;

        try {
            setLoading(true);
            setError("");

            const response = await dispatch(
                getClients({
                    organizationId: activeOrganization._id,
                    params: { limit: 100 },
                }),
            ).unwrap();

            setClients(response?.clients ?? []);
        } catch (err) {
            setError(err?.message ?? "Failed to load clients");
        } finally {
            setLoading(false);
        }
    }, [activeOrganization?._id, dispatch]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const filteredClients = useMemo(() => {
        const normalized = [...clients].filter((client) => {
            const matchesSearch =
                !search ||
                client.name?.toLowerCase().includes(search.toLowerCase()) ||
                client.companyName
                    ?.toLowerCase()
                    .includes(search.toLowerCase()) ||
                client.email?.toLowerCase().includes(search.toLowerCase()) ||
                client.phone?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                status === "all" ||
                (status === "active" && client.isActive) ||
                (status === "archived" && !client.isActive);

            return matchesSearch && matchesStatus;
        });

        switch (sort) {
            case "oldest":
                return normalized.sort(
                    (a, b) =>
                        new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
                );
            case "name":
                return normalized.sort((a, b) =>
                    (a.name ?? "").localeCompare(b.name ?? ""),
                );
            case "revenue":
                return normalized.sort((a, b) => {
                    const aOutstanding = Number(a.outstandingAmount ?? 0);
                    const bOutstanding = Number(b.outstandingAmount ?? 0);

                    return bOutstanding - aOutstanding;
                });
            case "latest":
            default:
                return normalized.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
                );
        }
    }, [clients, search, sort, status]);

    const stats = useMemo(() => {
        const activeClients = clients.filter((client) => client.isActive);
        const archivedClients = clients.filter((client) => !client.isActive);

        return {
            total: clients.length,
            active: activeClients.length,
            archived: archivedClients.length,
            revenue:
                clients.reduce(
                    (sum, client) =>
                        sum + Number(client.outstandingAmount ?? 0),
                    0,
                ) || 0,
        };
    }, [clients]);

    if (orgLoading || loading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <>
            <AddClientDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onCreated={fetchClients}
            />

            <div className="space-y-6">
                <ClientsHeader onAddClient={() => setDialogOpen(true)} />

                {error ? (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-destructive">
                        {error}
                    </div>
                ) : null}

                <ClientStats stats={stats} />

                <ClientFilters
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    sort={sort}
                    onSortChange={setSort}
                />

                <ClientsTable
                    clients={filteredClients.filter(
                        (client) => client.isActive,
                    )}
                />

                <ArchivedClients
                    clients={filteredClients.filter(
                        (client) => !client.isActive,
                    )}
                />
            </div>
        </>
    );
};

export default ManageClients;
