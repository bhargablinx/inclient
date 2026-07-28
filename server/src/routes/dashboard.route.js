import { Router } from "express";
import {
    getMonthlyRevenue,
    getOverview,
    getRecentInvoices,
    getTopClients,
} from "../controllers/dashboard.controller.js";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:organizationId/overview").get(verifyJWT, authorizeRoles("owner", "admin", "member"), getOverview);
router
    .route("/:organizationId/monthly-revenue")
    .get(verifyJWT, authorizeRoles("owner", "admin", "member"), getMonthlyRevenue);
router
    .route("/:organizationId/recent-invoices")
    .get(verifyJWT, authorizeRoles("owner", "admin", "member"), getRecentInvoices);
router.route("/:organizationId/top-clients").get(verifyJWT, authorizeRoles("owner", "admin", "member"), getTopClients);

export default router;
