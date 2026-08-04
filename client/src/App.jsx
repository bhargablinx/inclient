import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import Dashboard from "./pages/Dashboard";
import MyOrganizations from "./pages/MyOrganizations";
import Invitations from "./pages/Invitations";
import ViewMembers from "./pages/ViewMembers";
import ManageMembers from "./pages/ManageMembers";
import AllClients from "./pages/AllClients";
import ManageClients from "./pages/ManageClients";
import ViewInvoices from "./pages/ViewInvoices";
import ManageInvoices from "./pages/ManageInvoices";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetails from "./pages/InvoiceDetails";
import Payments from "./pages/Payments";
import PaymentDetails from "./pages/PaymentDetails";
import InvitationResponse from "./pages/InvitationResponse";
import CreateOrganization from "./pages/CreateOrganization";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "./features/auth/authThunk";
import { getMyOrganizations } from "./features/organization/organizationThunk";

import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchUser = async () => {
            await dispatch(getCurrentUser());
            await dispatch(getMyOrganizations());
        };

        fetchUser();
    }, []);

    const router = createBrowserRouter([
        // Un-Protected Routes
        {
            path: "/",
            element: <AuthLayout />,
            children: [
                {
                    path: "/",
                    element: <Home />,
                },
                {
                    path: "/login",
                    element: <Login />,
                },
                {
                    path: "/signup",
                    element: <Signup />,
                },
            ],
        },
        // Protected Routes
        {
            path: "/",
            element: <ProtectedLayout />,
            children: [
                {
                    path: "dashboard",
                    element: <Dashboard />,
                },
                {
                    path: "organizations/new",
                    element: <CreateOrganization />,
                },
                {
                    path: "organizations",
                    element: <MyOrganizations />,
                },
                {
                    path: "organizations/invitations",
                    element: <Invitations />,
                },
                {
                    path: "members",
                    element: <ViewMembers />,
                },
                {
                    path: "members/manage",
                    element: <ManageMembers />,
                },
                {
                    path: "clients",
                    element: <AllClients />,
                },
                {
                    path: "clients/manage",
                    element: <ManageClients />,
                },
                {
                    path: "invoices",
                    element: <ViewInvoices />,
                },
                {
                    path: "invoices/manage",
                    element: <ManageInvoices />,
                },
                {
                    path: "invoices/new",
                    element: <CreateInvoice />,
                },
                {
                    path: "invoices/:invoiceId",
                    element: <InvoiceDetails />,
                },
                {
                    path: "invoices/:invoiceId/edit",
                    element: <CreateInvoice />,
                },
                {
                    path: "payments",
                    element: <Payments />,
                },
                {
                    path: "payments/:paymentId",
                    element: <PaymentDetails />,
                },
                {
                    path: "invitations/:token",
                    element: <InvitationResponse />,
                },
            ],
        },
        {
            path: "*",
            element: <NotFound />,
        },
    ]);

    return (
        <ErrorBoundary>
            <OfflineBanner />
            <RouterProvider router={router} />
        </ErrorBoundary>
    );
}

export default App;
