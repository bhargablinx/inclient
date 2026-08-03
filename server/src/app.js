import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { verifyCSRF } from "./middlewares/csrf.middleware.js";
import { globalLimiter } from "./middlewares/rateLimiter.middleware.js";
import healthRouter from "./routes/healthCheck.route.js";
import authRouter from "./routes/auth.route.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import organizationRouter from "./routes/organization.route.js";
import invitationRouter from "./routes/invitation.route.js";
import dashboardRouter from "./routes/dashboard.route.js";

const app = express();

app.disable("x-powered-by");
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded());
app.use(cookieParser());
app.use(verifyCSRF);
app.use("/api/v1", globalLimiter);

app.use("/api/v1/healthcheck", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/invitations", invitationRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use(errorHandler);

export default app;
