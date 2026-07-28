import { Router } from "express";
import {
    changeMemberRole,
    getMembers,
    removeMember,
} from "../controllers/membership.controller.js";
import {
    getInvitations,
    inviteUser,
} from "../controllers/invitation.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

// Enforce auth and membership for all routes in this router
router.use(verifyJWT, authorizeRoles("owner", "admin", "member"));

// Members endpoints
router.route("/members")
    .get(getMembers);

router.route("/members/:userId")
    .patch(authorizeRoles("owner"), changeMemberRole)
    .delete(authorizeRoles("owner"), removeMember);

// Invitations endpoints
router.route("/invitations")
    .post(authorizeRoles("owner", "admin"), inviteUser)
    .get(authorizeRoles("owner", "admin"), getInvitations);

export default router;
