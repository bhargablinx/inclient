import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";

import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    acceptInvitation,
    rejectInvitation,
} from "@/features/invitations/invitationThunk";

const InvitationResponse = () => {
    const { token } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useSelector(
        (state) => state.auth,
    );

    // "checking"  — waiting to know if the user is logged in (auth hydration)
    // "pending"   — logged in, auto-accept in progress
    // "accepted"  — successfully joined
    // "rejected"  — user chose to reject
    // "error"     — something went wrong (expired, wrong user, etc.)
    // "unauthenticated" — not logged in, prompt to log in
    const [status, setStatus] = useState("checking");
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Wait for auth state to hydrate from the /me endpoint called in App.jsx
        if (authLoading) return;

        if (!isAuthenticated) {
            setStatus("unauthenticated");
            return;
        }

        if (!token) return;

        const autoAccept = async () => {
            setStatus("pending");
            try {
                await dispatch(acceptInvitation(token)).unwrap();
                setStatus("accepted");
                setMessage("You've successfully joined the organization!");
            } catch (error) {
                setStatus("error");
                setMessage(
                    error?.message || "Invitation could not be accepted.",
                );
            }
        };

        autoAccept();
    }, [dispatch, token, isAuthenticated, authLoading]);

    const handleReject = async () => {
        try {
            await dispatch(rejectInvitation(token)).unwrap();
            setStatus("rejected");
            setMessage("Invitation rejected.");
        } catch (error) {
            setMessage(error?.message || "Invitation could not be rejected.");
        }
    };

    // Still waiting for auth hydration
    if (status === "checking" || status === "pending") return <Loading />;

    // User is not logged in — show a prompt that preserves the token in ?redirect
    if (status === "unauthenticated") {
        const redirectPath = `/invitations/${token}`;
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
                    <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                </div>

                <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 rounded-3xl border bg-card/70 shadow-xl backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <span className="text-xl font-bold">I</span>
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            You've been invited!
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Please sign in to accept your organization invitation.
                        </p>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3">
                        <Button
                            size="lg"
                            className="w-full shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                            asChild
                        >
                            <Link
                                to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
                            >
                                Sign In to Accept
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full" asChild>
                            <Link
                                to={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
                            >
                                Create an Account
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            </div>

            <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 rounded-3xl border bg-card/70 shadow-xl backdrop-blur-xl">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <span className="text-xl font-bold">I</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Invitation Response
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p
                        className={`text-sm text-center ${
                            status === "accepted"
                                ? "text-green-600"
                                : status === "rejected"
                                  ? "text-muted-foreground"
                                  : "text-red-500"
                        }`}
                    >
                        {message}
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button
                            size="lg"
                            className="w-full shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5"
                            onClick={() => navigate("/dashboard")}
                        >
                            Go to Dashboard
                        </Button>

                        {status === "error" && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                onClick={handleReject}
                            >
                                Reject Invitation
                            </Button>
                        )}

                        {status === "accepted" && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                onClick={handleReject}
                            >
                                Reject Invitation
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
};

export default InvitationResponse;
