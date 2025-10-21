import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { pool } from "../config/database.ts"
import type { UserResponse } from "../types/user.ts"

const SALT_ROUNDS = 10

// Generate JWT token
const generateToken = (userId: number, email: string): string => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  })
}

// Signup endpoint
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" })
      return
    }

    // Check if user already exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email])

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: "User already exists" })
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at, updated_at",
      [name, email, passwordHash],
    )

    const user: UserResponse = result.rows[0]

    // Generate token
    const token = generateToken(user.id, user.email)

    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Login endpoint
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" })
      return
    }

    // Find user
    const result = await pool.query(
      "SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE email = $1",
      [email],
    )

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    const user = result.rows[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    // Generate token
    const token = generateToken(user.id, user.email)

    // Remove password_hash from response
    const { password_hash, ...userResponse } = user

    res.status(200).json({
      message: "Login successful",
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Logout endpoint (client-side token removal, but we can add token blacklisting later)
export const logout = async (req: Request, res: Response): Promise<void> => {
  // In a JWT-based system, logout is typically handled client-side by removing the token
  // For now, we'll just send a success response
  res.status(200).json({ message: "Logout successful" })
}

// Get current user (protected route)
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is already attached to req by auth middleware
    res.status(200).json({ user: req.user })
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
