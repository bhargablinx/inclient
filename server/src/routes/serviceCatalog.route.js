import { Router } from "express";
import {
    createService,
    getServices,
    getService,
    updateService,
    deleteService,
} from "../controllers/serviceCatalog.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

// Enforce auth and membership for all services routes
router.use(verifyJWT, authorizeRoles("owner", "admin", "member"));

router.route("/")
    .post(authorizeRoles("owner", "admin"), createService)
    .get(getServices);

router.route("/:serviceId")
    .get(getService)
    .patch(authorizeRoles("owner", "admin"), updateService)
    .delete(authorizeRoles("owner", "admin"), deleteService);

export default router;
