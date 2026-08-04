import { Router } from "express";
import {
    createClient,
    deleteClient,
    getClient,
    getClientInvoices,
    getClients,
    getClientStats,
    updateClient,
} from "../controllers/client.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createClientSchema } from "../validators/schemas.js";

const router = Router({ mergeParams: true });

// Enforce auth and membership for all client routes
router.use(verifyJWT, authorizeRoles("owner", "admin", "member"));

router.route("/")
    .post(validate(createClientSchema), createClient)
    .get(getClients);

router.route("/:clientId")
    .get(getClient)
    .patch(updateClient);

// Only owner or admin can delete a client
router.route("/:clientId")
    .delete(authorizeRoles("owner", "admin"), deleteClient);

router.route("/:clientId/invoices")
    .get(getClientInvoices);

router.route("/:clientId/stats")
    .get(getClientStats);

export default router;
