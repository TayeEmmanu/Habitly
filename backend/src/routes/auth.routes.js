 import { Router } from "express"
import { signup, login, logout, getCurrentUser} from "../controllers/auth.controller.js"
import { authenticateToken } from "../middleware/auth.ts"

const router = Router()

// Public routes
router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", logout)

// Protected routes
router.get("/me", authenticateToken, getCurrentUser)

export default router
