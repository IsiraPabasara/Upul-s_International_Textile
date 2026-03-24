import { Router } from "express";
import { addUserAddress, deleteUserAddress, getAdmin, getUser, loginUser, logOutUser, refreshToken, resetUserPassword, setDefaultAddress, updateUserAddress, updateUserProfile, userForgotPassword, userRegistration, verifyUser, verifyUserForgotPassword } from "../src/auth-service.js";
import isAuthenticated from "../../../../../packages/middleware/isAuthenticated.js";
import { isAdmin } from "../../../../../packages/middleware/authorizedRoles.js";

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

authRouter.post("/add-address", isAuthenticated, addUserAddress);
authRouter.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);
authRouter.put("/update-address/:addressId", isAuthenticated, updateUserAddress);
authRouter.patch("/set-default-address/:addressId", isAuthenticated, setDefaultAddress);
authRouter.put("/update-profile", isAuthenticated, updateUserProfile);

authRouter.get("/logged-in-admin", isAuthenticated, isAdmin, getAdmin);
