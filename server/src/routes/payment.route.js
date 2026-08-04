import { Router } from "express";
import {
    createPayment,
    getOrganizationPayments,
    getPayments,
    getPayment,
    updatePayment,
    deletePayment,
} from "../controllers/payment.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPaymentSchema } from "../validators/schemas.js";

const router = Router({ mergeParams: true });

// Enforce auth and membership for all payment routes
router.use(verifyJWT, authorizeRoles("owner", "admin", "member"));

// Organization-wide payments
router.route("/payments")
    .get(getOrganizationPayments);

// Invoice-specific payments
router.route("/invoices/:invoiceId/payments")
    .post(authorizeRoles("owner", "admin"), validate(createPaymentSchema), createPayment)
    .get(getPayments);

router.route("/invoices/:invoiceId/payments/:paymentId")
    .get(getPayment)
    .patch(authorizeRoles("owner", "admin"), updatePayment)
    .delete(authorizeRoles("owner", "admin"), deletePayment);

export default router;
