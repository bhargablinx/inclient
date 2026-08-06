import Sidebar from "@/components/Sidebar";
import Loading from "@/components/Loading";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getMyOrganizations } from "@/features/organization/organizationThunk";

const ProtectedLayout = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { isAuthenticated, loading: authLoading } = useSelector(
        (state) => state.auth,
    );
    const {
        activeOrganization,
        loading: orgLoading,
        fetched: orgFetched,
    } = useSelector((state) => state.organization);

    useEffect(() => {
        if (isAuthenticated && !orgFetched && !orgLoading) {
            dispatch(getMyOrganizations());
        }
    }, [dispatch, isAuthenticated, orgFetched, orgLoading]);

    if (!isAuthenticated) return <Navigate to="/signup" replace />;

    if (authLoading || orgLoading || !orgFetched) return <Loading />;

    const onCreateOrgPage = location.pathname === "/organizations/new";

    if (!activeOrganization && !onCreateOrgPage) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <>
            <Sidebar>
                <Outlet />
            </Sidebar>
        </>
    );
};

export default ProtectedLayout;

