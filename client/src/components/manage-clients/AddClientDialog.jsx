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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/features/clients/clientThunk";

const AddClientDialog = ({ open, onOpenChange, onCreated }) => {
    const dispatch = useDispatch();
    const { activeOrganization } = useSelector((state) => state.organization);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        taxId: "",
        address: "",
    });

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    useEffect(() => {
        if (!open) {
            setForm({
                name: "",
                companyName: "",
                email: "",
                phone: "",
                taxId: "",
                address: "",
            });
            setSubmitting(false);
            setError("");
        }
    }, [open]);

    const handleCreate = async () => {
        if (!activeOrganization?._id) {
            setError("No active organization selected");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await dispatch(
                createClient({
                    organizationId: activeOrganization._id,
                    data: {
                        organizationId: activeOrganization._id,
                        ...form,
                    },
                }),
            ).unwrap();

            await onCreated?.();
            onOpenChange(false);
        } catch (err) {
            setError(err?.message ?? "Failed to create client");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add Client</DialogTitle>

                    <DialogDescription>
                        Create a new client for your organization.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Client Name</Label>

                        <Input
                            value={form.name}
                            onChange={(e) =>
                                handleChange("name", e.target.value)
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Company</Label>

                        <Input
                            value={form.companyName}
                            onChange={(e) =>
                                handleChange("companyName", e.target.value)
                            }
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Email</Label>

                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    handleChange("email", e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Phone</Label>

                            <Input
                                value={form.phone}
                                onChange={(e) =>
                                    handleChange("phone", e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>GST Number</Label>

                        <Input
                            value={form.taxId}
                            onChange={(e) => handleChange("taxId", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Address</Label>

                        <Textarea
                            rows={3}
                            value={form.address}
                            onChange={(e) =>
                                handleChange("address", e.target.value)
                            }
                        />
                    </div>
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
                        onClick={handleCreate}
                        disabled={submitting || !form.name.trim()}
                    >
                        {submitting ? "Creating..." : "Create Client"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddClientDialog;
