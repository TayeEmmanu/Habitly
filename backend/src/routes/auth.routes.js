import express from "express"
import {
  signup,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
} from "../controllers/auth.controller.js"
import { authenticateToken } from "../middleware/auth.ts"

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", logout)
router.get("/me", authenticateToken, getCurrentUser)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.post("/refresh", refreshAccessToken)

export default router
