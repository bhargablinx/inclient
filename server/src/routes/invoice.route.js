import { Router } from "express";
import {
    createInvoice,
    deleteInvoice,
    downloadInvoice,
    duplicateInvoice,
    generateInvoicePdf,
    getInvoice,
    getInvoices,
    sendInvoice,
    updateInvoice,
    updateInvoiceStatus,
} from "../controllers/invoice.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createInvoiceSchema } from "../validators/schemas.js";

const router = Router({ mergeParams: true });

// Enforce auth and membership for all invoice routes
router.use(verifyJWT, authorizeRoles("owner", "admin", "member"));

router.route("/")
    .post(validate(createInvoiceSchema), createInvoice)
    .get(getInvoices);

router.route("/:invoiceId")
    .get(getInvoice);

// Only owner or admin can update, delete, or change status
router.route("/:invoiceId")
    .patch(authorizeRoles("owner", "admin"), updateInvoice)
    .delete(authorizeRoles("owner", "admin"), deleteInvoice);

router.route("/:invoiceId/status")
    .patch(authorizeRoles("owner", "admin"), updateInvoiceStatus);

router.route("/:invoiceId/pdf")
    .get(generateInvoicePdf);

router.route("/:invoiceId/download")
    .get(downloadInvoice);

router.route("/:invoiceId/send")
    .post(sendInvoice);

router.route("/:invoiceId/duplicate")
    .post(authorizeRoles("owner", "admin"), duplicateInvoice);

export default router;
