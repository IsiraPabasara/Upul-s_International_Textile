import { Router } from "express";
import { getUser, loginUser, logOutUser, refreshToken, resetUserPassword, userForgotPassword, userRegistration, verifyUser, verifyUserForgotPassword } from "../src/auth-service.js";
import isAuthenticated from "../../../../../packages/middleware/isAuthenticated.js";

export const authRouter = Router();

authRouter.post("/register", userRegistration);
authRouter.post("/verify-user", verifyUser);

authRouter.post("/forgot-password-user", userForgotPassword);
authRouter.post("/verify-forgot-password-user", verifyUserForgotPassword);
authRouter.post("/reset-password-user", resetUserPassword);

authRouter.post("/login-user", loginUser);
authRouter.post("/refresh-token", refreshToken);
authRouter.get("/logged-in-user", isAuthenticated, getUser);
authRouter.get("/logout-user", isAuthenticated, logOutUser);

