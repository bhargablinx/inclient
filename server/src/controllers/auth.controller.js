import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import crypto from "crypto";
import { sendMail } from "../utils/sendMail.js";
import {
    verifyEmailTemplate,
    forgotPasswordTemplate,
} from "../utils/emailTemplate.js";
import { validatePasswordStrength } from "../utils/passwordValidator.js";

const cookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "none" is required for cross-site (cross-domain) cookie sending in production.
    // "lax"/"strict" blocks cookies when frontend and backend are on different domains.
    // "none" MUST be paired with secure:true (enforced above).
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const generateToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.log("Server error: Generating token", error);
        throw error;
    }
};

const signup = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        throw new ApiError(400, "Required Filed is Missing!");

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
        throw new ApiError(400, passwordError);
    }

    // if (!req.file) throw new ApiError(400, "Avatar is required!");

    const existingUser = await User.findOne({ email: email });

    if (existingUser)
        throw new ApiError(400, "User already exists with this email!");

    const avatar = "";

    if (req.file) {
        const avatarPath = req.file.path;
        const cloudinaryResponse = await uploadToCloudinary(avatarPath);
        if (!cloudinaryResponse) {
            throw new ApiError(500, "Failed to upload avatar");
        }
        avatar = cloudinaryResponse.url;
    }

    const user = await User.create({
        name,
        email,
        password,
        avatar,
    });

    const verificationToken = user.generateEmailToken();
    await user.save({ validateBeforeSave: false });

    // Sending Mail
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    try {
        await sendMail(
            user.email,
            "Verify Your Email",
            verifyEmailTemplate(verificationUrl)
        );
    } catch (error) {
        throw new ApiError(500, "Verification email could not be sent");
    }

    res.status(201).json(
        new ApiResponse(
            201,
            // verificationToken, // just for testing (remove in production)
            "Registration Successful (as we don't have funds for email verification)!"
        )
    );
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) throw new ApiError(401, "Invalid Email or Password!!");

    if (user.isDeleted)
        throw new ApiError(403, "This account has been deleted.");

    if (!user.isEmailVerified)
        throw new ApiError(403, "Please verify your email before logging in");

    const isPassValid = await user.isPasswordCorrect(password); // user not User to access its methods
    if (!isPassValid) throw new ApiError(401, "Invalid email or password!!");

    const { accessToken, refreshToken } = await generateToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    res.status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(new ApiResponse(200, loggedInUser, "Login successful"));
});

const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { returnDocument: "after" }
    );

    res.status(200)
        .clearCookie("accessToken", cookieOption)
        .clearCookie("refreshToken", cookieOption)
        .json(new ApiResponse(200, "User logged out!!", req.user));
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "All fields are required");
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
        throw new ApiError(400, passwordError);
    }

    const user = await User.findById(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect current password");
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json(
        new ApiResponse(200, null, "Password changed successfully")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) throw new ApiError(400, "Email is empty!!");

    const user = await User.findOne({ email });

    if (!user) throw new ApiError(400, "User not found!!");

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Password Reset Mail
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    try {
        await sendMail(
            user.email,
            "Reset Your Password",
            forgotPasswordTemplate(user.name, resetUrl)
        );
    } catch (error) {
        throw new ApiError(500, "Password reset email could not be sent");
    }

    res.status(200).json(
        new ApiResponse(200, null, "Password reset link sent to your inbox!")
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        passwordRecoveryToken: hashedToken,
        passwordResetTokenExpiry: {
            $gt: Date.now(),
        },
    });

    if (!user) throw new ApiError(404, "Invalid or expired token");

    const { newPassword } = req.body;
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
        throw new ApiError(400, passwordError);
    }

    user.password = newPassword;
    user.passwordRecoveryToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();

    res.status(200).json(
        new ApiResponse(200, null, "Password changed successfully!!")
    );
});

const resendMail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) throw new ApiError(400, null, "Invalid Email");

    const newVerificationToken = user.generateEmailToken();
    await user.save({ validateBeforeSave: false });

    // Re-Sending Mail
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${newVerificationToken}`;
    try {
        await sendMail(
            user.email,
            "Verify Your Email",
            verifyEmailTemplate(verificationUrl)
        );
    } catch (error) {
        throw new ApiError(500, "Verification email could not be sent");
    }

    res.status(200).json(new ApiResponse(200, "New Verification Mail Sent!!"));
});

const verifyMail = asyncHandler(async (req, res) => {
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: {
            $gt: Date.now(),
        },
    }).select(
        "-password -passwordRecoveryToken -passwordResetTokenExpiry -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
    );

    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    user.isEmailVerified = true;

    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;

    await user.save();

    res.status(200).json(new ApiResponse(200, user, "Email Verified!!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user._id).select(
        "-password -passwordRecoveryToken -passwordResetTokenExpiry -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
    );

    if (!currentUser) throw new ApiError(404, "User not found!");

    res.status(200).json(new ApiResponse(200, currentUser));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const clientRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!clientRefreshToken) throw new ApiError(404, "Token not found");

    const decodedToken = jwt.verify(
        clientRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    // search user in db by id
    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(404, "User not found");

    // verify both tokens
    if (clientRefreshToken !== user.refreshToken)
        throw new ApiError(403, "Invalid Token");

    // if verified generate new token
    const { accessToken, refreshToken } = await generateToken(user._id);

    res.status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(new ApiResponse(201, "New Token Created!"));
});

const deleteUsr = asyncHandler(async (req, res) => {
    const user = req.user;

    await User.findByIdAndUpdate(user._id, {
        isDeleted: true,
        deletedAt: new Date(),
        refreshToken: null,
    });

    res.status(200)
        .clearCookie("accessToken", cookieOption)
        .clearCookie("refreshToken", cookieOption)
        .json(new ApiResponse(200, null, "Account deleted successfully!"));
});

export {
    signup,
    login,
    logout,
    changePassword,
    forgotPassword,
    resendMail,
    verifyMail,
    resetPassword,
    getCurrentUser,
    refreshAccessToken,
    deleteUsr,
};
