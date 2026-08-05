import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { inviteMemberToOrganization } from "@/features/organization/organizationThunk";

const InviteMemberDialog = ({ open, onOpenChange, onInvited }) => {
    const dispatch = useDispatch();
    const { activeOrganization } = useSelector((state) => state.organization);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            setEmail("");
            setRole("member");
            setError("");
            setSubmitting(false);
        }
    }, [open]);

    const handleInvite = async () => {
        if (!activeOrganization?._id) {
            setError("No active organization selected");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await dispatch(
                inviteMemberToOrganization({
                    organizationId: activeOrganization._id,
                    data: { email, role },
                }),
            ).unwrap();
            await onInvited?.();
            onOpenChange(false);
        } catch (err) {
            setError(err?.message ?? "Failed to send invitation");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite Member</DialogTitle>

                    <DialogDescription>
                        Send an invitation to join your organization.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Input
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="member">Member</SelectItem>

                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {error ? (
                    <div className="rounded-md border border-dashed p-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : null}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleInvite}
                        disabled={submitting || !email.trim()}
                    >
                        {submitting ? "Sending..." : "Send Invitation"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InviteMemberDialog;
