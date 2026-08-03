import { Router } from "express";
import {
    signup,
    login,
    logout,
    changePassword,
    forgotPassword,
    verifyMail,
    resendMail,
    resetPassword,
    getCurrentUser,
    refreshAccessToken,
    deleteUsr,
} from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.route("/signup").post(authLimiter, upload.single("avatar"), signup);
router.route("/login").post(authLimiter, login);
router.route("/logout").post(verifyJWT, logout);
router.route("/change-password").post(verifyJWT, authLimiter, changePassword);
router.route("/forgot-password").post(authLimiter, forgotPassword);
router.route("/reset-password/:token").post(authLimiter, resetPassword);
router.route("/verify-email/:token").get(verifyMail);
router.route("/resend-email").post(authLimiter, resendMail);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/delete").delete(verifyJWT, deleteUsr);

export default router;
