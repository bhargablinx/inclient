import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createInvoice,
    getInvoice,
    updateInvoice,
} from "@/features/invoices/invoiceThunk";
import { getClients } from "@/features/clients/clientThunk";

const CreateInvoice = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { invoiceId } = useParams();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const { clients } = useSelector((state) => state.clients);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        clientId: "",
        dueDate: "",
        currency: "INR",
        taxAmount: "0",
        discountAmount: "0",
        notes: "",
        items: [createItem()],
    });
    const isEditMode = Boolean(invoiceId);

    useEffect(() => {
        if (!activeOrganization?._id) return;

        dispatch(
            getClients({
                organizationId: activeOrganization._id,
                params: { limit: 100 },
            }),
        );
    }, [activeOrganization?._id, dispatch]);

    useEffect(() => {
        if (!activeOrganization?._id || !invoiceId) return;

        const loadInvoice = async () => {
            try {
                const response = await dispatch(
                    getInvoice({
                        organizationId: activeOrganization._id,
                        invoiceId,
                    }),
                ).unwrap();

                const invoice = response?.invoice;
                const items = response?.items ?? [];

                setForm({
                    clientId: invoice?.client?._id || invoice?.client || "",
                    dueDate: invoice?.dueDate
                        ? new Date(invoice.dueDate).toISOString().slice(0, 10)
                        : "",
                    currency: invoice?.currency || "INR",
                    taxAmount: String(invoice?.taxAmount ?? 0),
                    discountAmount: String(invoice?.discountAmount ?? 0),
                    notes: "",
                    items: items.length
                        ? items.map((item) => ({
                              description: item.description || "",
                              quantity: String(item.quantity ?? 1),
                              unitPrice: String(item.unitPrice ?? 0),
                              taxRate: String(item.taxRate ?? 0),
                              discountAmount: String(item.discountAmount ?? 0),
                          }))
                        : [createItem()],
                });
            } catch (err) {
                setError(err?.message || "Failed to load invoice");
            }
        };

        loadInvoice();
    }, [activeOrganization?._id, dispatch, invoiceId]);

    const clientOptions = useMemo(
        () =>
            clients.map((client) => ({
                id: client._id,
                label: client.companyName || client.name || "Unknown Client",
            })),
        [clients],
    );

    const updateItem = (index, field, value) => {
        setForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const addItem = () => {
        setForm((current) => ({
            ...current,
            items: [...current.items, createItem()],
        }));
    };

    const removeItem = (index) => {
        setForm((current) => ({
            ...current,
            items: current.items.length === 1
                ? current.items
                : current.items.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const totals = useMemo(() => {
        const subtotal = form.items.reduce((sum, item) => {
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.unitPrice || 0);
            const discountAmount = Number(item.discountAmount || 0);
            return sum + quantity * unitPrice - discountAmount;
        }, 0);

        const taxAmount = Number(form.taxAmount || 0);
        const discountAmount = Number(form.discountAmount || 0);
        const totalAmount = subtotal + taxAmount - discountAmount;

        return { subtotal, totalAmount };
    }, [form.items, form.taxAmount, form.discountAmount]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!activeOrganization?._id) {
            setError("No active organization selected.");
            return;
        }

        if (!form.clientId) {
            setError("Please select a client.");
            return;
        }

        if (!form.dueDate) {
            setError("Please select a due date.");
            return;
        }

        const validItems = form.items.filter(
            (item) => item.description.trim() && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0,
        );

        if (!validItems.length) {
            setError("Add at least one valid invoice item.");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                clientId: form.clientId,
                dueDate: form.dueDate,
                currency: form.currency,
                taxAmount: Number(form.taxAmount || 0),
                discountAmount: Number(form.discountAmount || 0),
                items: validItems.map((item) => ({
                    description: item.description,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    taxRate: Number(item.taxRate || 0),
                    discountAmount: Number(item.discountAmount || 0),
                })),
            };

            if (isEditMode) {
                await dispatch(
                    updateInvoice({
                        organizationId: activeOrganization._id,
                        invoiceId,
                        data: payload,
                    }),
                ).unwrap();
            } else {
                await dispatch(
                    createInvoice({
                        organizationId: activeOrganization._id,
                        data: payload,
                    }),
                ).unwrap();
            }

            navigate("/invoices/manage");
        } catch (err) {
            setError(err?.message || err?.data?.message || "Failed to create invoice.");
        } finally {
            setSubmitting(false);
        }
    };

    if (orgLoading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEditMode ? "Edit Invoice" : "Create Invoice"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditMode ? "Update invoice for" : "Build a new invoice for"}{" "}
                        <span className="font-medium text-foreground">
                            {activeOrganization.name}
                        </span>
                        .
                    </p>
                </div>

                <Button type="submit" disabled={submitting}>
                    {submitting
                        ? isEditMode
                            ? "Saving..."
                            : "Creating..."
                        : isEditMode
                          ? "Save Changes"
                          : "Save Invoice"}
                </Button>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Client</Label>
                                <Select
                                    value={form.clientId}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            clientId: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientOptions.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            dueDate: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select
                                    value={form.currency}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            currency: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INR">INR</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Tax Amount</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.taxAmount}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            taxAmount: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Discount Amount</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.discountAmount}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            discountAmount: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Invoice Items</CardTitle>
                            <Button type="button" variant="outline" onClick={addItem}>
                                <Plus className="mr-2 size-4" />
                                Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {form.items.map((item, index) => (
                                <div key={index} className="rounded-lg border p-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Description</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "description",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Quantity</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "quantity",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Unit Price</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "unitPrice",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Tax Rate (%)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.taxRate}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "taxRate",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Line Discount</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.discountAmount}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "discountAmount",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(index)}
                                            disabled={form.items.length === 1}
                                        >
                                            <Trash2 className="mr-2 size-4 text-destructive" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                rows={4}
                                value={form.notes}
                                onChange={(e) =>
                                    setForm((current) => ({
                                        ...current,
                                        notes: e.target.value,
                                    }))
                                }
                                placeholder="Optional invoice notes"
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span>Subtotal</span>
                            <span>{formatAmount(totals.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Tax</span>
                            <span>{formatAmount(Number(form.taxAmount || 0))}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Discount</span>
                            <span>-{formatAmount(Number(form.discountAmount || 0))}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
                            <span>Total</span>
                            <span>{formatAmount(totals.totalAmount)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
};

export default CreateInvoice;

function createItem() {
    return {
        description: "",
        quantity: "1",
        unitPrice: "",
        taxRate: "0",
        discountAmount: "0",
    };
}

const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount || 0);
