import express from "express"
import { getProfile, updateProfile } from "../controllers/users.controller.js"
import { authenticateToken } from "../middleware/auth.ts"

const router = express.Router()

// All user routes require authentication
router.use(authenticateToken)

// GET /api/users/profile - Get user profile
router.get("/profile", getProfile)

// PUT /api/users/profile - Update user profile
router.put("/profile", updateProfile)

export default router
