import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"

interface JwtPayload {
  userId: number
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"]
  console.log("[v0] Auth header:", authHeader ? "Present" : "Missing")

  const token = authHeader && authHeader.split(" ")[1]
  console.log("[v0] Token extracted:", token ? "Yes" : "No")

  if (!token) {
    console.log("[v0] No token provided, returning 401")
    return res.status(401).json({ error: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    console.log("[v0] Token verified successfully for user:", decoded.userId)
    req.user = decoded
    next()
  } catch (err: any) {
    console.log("[v0] Token verification failed:", err.message)
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}
