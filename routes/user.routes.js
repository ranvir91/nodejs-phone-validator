import { Router } from "express";
import { sendCode, resendCode, verifyCode, logoutUser } from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// define routes
router.route("/send-code").post(sendCode);
router.route("/resend-code").post(verifyJWT, resendCode); // authenticate middleware via jwt
router.route("/verify-code").post(verifyJWT, verifyCode); // authenticate middleware via jwt

// logout and remove session-cookie
router.route("/logout").post(verifyJWT, logoutUser);

export default router;