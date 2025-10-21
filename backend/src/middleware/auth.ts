import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { pool } from "../config/database.ts"

interface JwtPayload {
  userId: number
  email: string
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: "Access token required" })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    // Fetch user from database
    const result = await pool.query("SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1", [
      decoded.userId,
    ])

    if (result.rows.length === 0) {
      res.status(401).json({ error: "User not found" })
      return
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    console.error("[v0] Auth middleware error:", error)
    res.status(403).json({ error: "Invalid or expired token" })
  }
}
