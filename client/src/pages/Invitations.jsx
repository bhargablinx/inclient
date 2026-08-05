import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import Loading from "@/components/Loading";
import PendingInvitations from "@/components/manage-members/PendingInvitations";
import { getOrganizationInvitations } from "@/features/organization/organizationThunk";

const Invitations = () => {
    const dispatch = useDispatch();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const { invitations } = useSelector((state) => state.organization);
    const [localInvitations, setLocalInvitations] = useState([]);

    useEffect(() => {
        if (!activeOrganization?._id) return;
        dispatch(getOrganizationInvitations(activeOrganization._id));
    }, [activeOrganization?._id, dispatch]);

    useEffect(() => {
        setLocalInvitations(invitations);
    }, [invitations]);

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

        setLocalInvitations((current) =>
            current.filter((item) => item._id !== invite._id),
        );
    };

    if (orgLoading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Invitations
                </h1>

                <p className="text-muted-foreground">
                    Review pending invitations for{" "}
                    <span className="font-medium text-foreground">
                        {activeOrganization.name}
                    </span>
                    .
                </p>
            </div>

            <PendingInvitations
                invitations={localInvitations}
                onResendInvitation={handleResendInvitation}
                onCancelInvitation={handleCancelInvitation}
            />
        </div>
    );
};

export default Invitations;
