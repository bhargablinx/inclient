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
import { validate } from "../middlewares/validate.middleware.js";
import {
    signupSchema,
    loginSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "../validators/schemas.js";

const router = Router();

router.route("/signup").post(authLimiter, upload.single("avatar"), validate(signupSchema), signup);
router.route("/login").post(authLimiter, validate(loginSchema), login);
router.route("/logout").post(verifyJWT, logout);
router.route("/change-password").post(verifyJWT, authLimiter, validate(changePasswordSchema), changePassword);
router.route("/forgot-password").post(authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.route("/reset-password/:token").post(authLimiter, validate(resetPasswordSchema), resetPassword);
router.route("/verify-email/:token").get(verifyMail);
router.route("/resend-email").post(authLimiter, resendMail);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/delete").delete(verifyJWT, deleteUsr);

export default router;
