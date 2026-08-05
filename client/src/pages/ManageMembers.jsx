import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import InviteMemberDialog from "@/components/manage-members/InviteMemberDialog";
import MemberFilters from "@/components/manage-members/MemberFilters";
import MembersHeader from "@/components/manage-members/MembersHeader";
import MemberStats from "@/components/manage-members/MemberStats";
import MembersTable from "@/components/manage-members/MembersTable";
import PendingInvitations from "@/components/manage-members/PendingInvitations";
import Loading from "@/components/Loading";
import {
    getOrganizationMembers,
    getOrganizationInvitations,
} from "@/features/organization/organizationThunk";

const ManageMembers = () => {
    const dispatch = useDispatch();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [members, setMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [memberError, setMemberError] = useState("");
    const [invitationError, setInvitationError] = useState("");
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("all");

    const fetchData = useCallback(async () => {
        if (!activeOrganization?._id) return;

        try {
            setLoading(true);
            setMemberError("");
            setInvitationError("");

            const membersRes = await dispatch(
                getOrganizationMembers(activeOrganization._id),
            ).unwrap();

            setMembers(membersRes ?? []);
        } catch (err) {
            setMemberError(err?.message ?? "Failed to load member data");
        } finally {
            setLoading(false);
        }

        try {
            const invitationsRes = await dispatch(
                getOrganizationInvitations(activeOrganization._id),
            ).unwrap();

            setInvitations(invitationsRes ?? []);
        } catch (err) {
            setInvitations([]);
            setInvitationError(err?.message ?? "Failed to load invitations");
        }
    }, [activeOrganization?._id, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const name = member.user?.name ?? "";
            const email = member.user?.email ?? "";
            const matchesSearch =
                !search ||
                name.toLowerCase().includes(search.toLowerCase()) ||
                email.toLowerCase().includes(search.toLowerCase());
            const matchesRole = role === "all" || member.role === role;

            return matchesSearch && matchesRole;
        });
    }, [members, role, search]);

    const stats = useMemo(() => {
        const activeMembers = members.filter(
            (member) => member.status === "active",
        );

        return {
            total: activeMembers.length,
            admins: activeMembers.filter((member) => member.role === "admin")
                .length,
            owners: activeMembers.filter((member) => member.role === "owner")
                .length,
            pendingInvites: invitations.length,
        };
    }, [invitations.length, members]);

    const handleResendInvitation = (invite) => {
        if (!invite) return;
        window.alert(
            `Resend invitation for ${invite.email} is not connected to the backend yet.`,
        );
    };

    const handleCancelInvitation = (invite) => {
        if (!invite) return;
        if (!window.confirm(`Cancel the invitation sent to ${invite.email}?`)) {
            return;
        }

        setInvitations((current) =>
            current.filter((item) => item._id !== invite._id),
        );
    };

    if (orgLoading || loading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <>
            <div className="space-y-6">
                <InviteMemberDialog
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                    onInvited={fetchData}
                />
            </div>

            <div className="space-y-6">
                <MembersHeader onInvite={() => setInviteDialogOpen(true)} />

                <MemberStats stats={stats} />

                <MemberFilters
                    search={search}
                    onSearchChange={setSearch}
                    role={role}
                    onRoleChange={setRole}
                />

                {memberError ? (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-destructive">
                        {memberError}
                    </div>
                ) : (
                    <MembersTable members={filteredMembers} />
                )}

                {invitationError && !memberError ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        {invitationError}
                    </div>
                ) : null}

                <PendingInvitations
                    invitations={invitations}
                    onResendInvitation={handleResendInvitation}
                    onCancelInvitation={handleCancelInvitation}
                />
            </div>
        </>
    );
};

export default ManageMembers;
