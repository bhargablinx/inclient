import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganizationPayments } from "@/features/payments/paymentThunk";

const PaymentDetails = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { paymentId } = useParams();
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const { payments, loading: paymentLoading } = useSelector(
        (state) => state.payments,
    );

    useEffect(() => {
        if (!activeOrganization?._id) return;

        dispatch(
            getOrganizationPayments({
                organizationId: activeOrganization._id,
                params: { limit: 100 },
            }),
        );
    }, [activeOrganization?._id, dispatch]);

    const payment = useMemo(
        () => payments.find((item) => item._id === paymentId),
        [paymentId, payments],
    );

    if (orgLoading || paymentLoading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Payment Details
                    </h1>
                    <p className="text-muted-foreground">
                        View payment details for{" "}
                        <span className="font-medium text-foreground">
                            {activeOrganization.name}
                        </span>
                        .
                    </p>
                </div>

                <Button variant="outline" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{payment?._id || "Payment"}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                    <Info label="Amount" value={formatAmount(payment?.amount)} />
                    <Info
                        label="Method"
                        value={formatMethod(payment?.paymentMethod)}
                    />
                    <Info
                        label="Date"
                        value={formatDate(payment?.paymentDate)}
                    />
                    <Info
                        label="Reference"
                        value={payment?.referenceNumber || "-"}
                    />
                    <Info
                        label="Invoice"
                        value={payment?.invoice?.invoiceNumber || "-"}
                    />
                    <Info
                        label="Received By"
                        value={payment?.receivedBy?.name || "-"}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentDetails;

const Info = ({ label, value }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
    </div>
);

const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount || 0);

const formatMethod = (value) =>
    (value || "-")
        .replaceAll("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const formatDate = (date) =>
    date
        ? new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          }).format(new Date(date))
        : "-";
