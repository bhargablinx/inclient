import { Router } from "express";
import {
    createOrganization,
    getOrganization,
    getMyOrganizations,
    updateOrganization,
    deleteOrganization,
} from "../controllers/organization.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOrganizationSchema } from "../validators/schemas.js";

// Sub-routers
import clientRouter from "./client.route.js";
import invoiceRouter from "./invoice.route.js";
import paymentRouter from "./payment.route.js";
import serviceCatalogRouter from "./serviceCatalog.route.js";
import membershipRouter from "./membership.route.js";

const router = Router();

// Any authorized user can create
router.route("/").post(upload.single("logo"), verifyJWT, validate(createOrganizationSchema), createOrganization);
router.route("/").get(verifyJWT, getMyOrganizations);

// User for that organization can get info
router
    .route("/:organizationId")
    .get(
        verifyJWT,
        authorizeRoles("owner", "admin", "member"),
        getOrganization
    );

// Only owner can update organization info and delete
router
    .route("/:organizationId")
    .patch(verifyJWT, authorizeRoles("owner"), updateOrganization);
router
    .route("/:organizationId")
    .delete(verifyJWT, authorizeRoles("owner"), deleteOrganization);

// Mount sub-routers
router.use("/:organizationId/clients", clientRouter);
router.use("/:organizationId/invoices", invoiceRouter);
router.use("/:organizationId/services", serviceCatalogRouter);
router.use("/:organizationId", paymentRouter);
router.use("/:organizationId", membershipRouter);

export default router;
