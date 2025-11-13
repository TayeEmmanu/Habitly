import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { pool } from "../config/database.ts"
import { sendPasswordResetEmail } from "../services/email.service.js"

const generateTokens = (userId, email) => {
  const accessToken = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: "15m" })
  const refreshToken = crypto.randomBytes(40).toString("hex")
  return { accessToken, refreshToken }
}

const storeRefreshToken = async (userId, refreshToken) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await pool.query("INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)", [
    userId,
    refreshToken,
    expiresAt,
  ])
}

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" })
    }

    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name, email, hashedPassword],
    )

    const user = result.rows[0]
    const { accessToken, refreshToken } = generateTokens(user.id, user.email)
    await storeRefreshToken(user.id, refreshToken)

    res.status(201).json({ user, token: accessToken, refreshToken })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ error: "Server error during signup" })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email)
    await storeRefreshToken(user.id, refreshToken)

    const { password_hash: _, ...userWithoutPassword } = user

    res.json({ user: userWithoutPassword, token: accessToken, refreshToken })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error during login" })
  }
}

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken])
    }

    res.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({ error: "Server error during logout" })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [req.user.userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({ error: "Server error fetching user" })
  }
}

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" })
    }

    // Find valid refresh token
    const tokenResult = await pool.query("SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()", [
      refreshToken,
    ])

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired refresh token" })
    }

    const storedToken = tokenResult.rows[0]

    // Get user details
    const userResult = await pool.query("SELECT id, email FROM users WHERE id = $1", [storedToken.user_id])

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = userResult.rows[0]

    // Generate new access token
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    })

    console.log(`[v0] Access token refreshed for user ID: ${user.id}`)

    res.json({ token: accessToken })
  } catch (error) {
    console.error("Refresh token error:", error)
    res.status(500).json({ error: "Server error refreshing token" })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.json({ message: "If an account exists with this email, a password reset link has been sent." })
    }

    const user = result.rows[0]

    const resetToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 3600000)

    await pool.query("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)", [
      user.id,
      resetToken,
      expiresAt,
    ])

    await sendPasswordResetEmail(email, resetToken)

    res.json({ message: "If an account exists with this email, a password reset link has been sent." })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ error: "Server error processing request" })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    const tokenResult = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()",
      [token],
    )

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" })
    }

    const resetToken = tokenResult.rows[0]

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hashedPassword, resetToken.user_id])

    await pool.query("UPDATE password_reset_tokens SET used = true WHERE id = $1", [resetToken.id])

    console.log(`[v0] Password reset successful for user ID: ${resetToken.user_id}`)

    res.json({ message: "Password reset successful. You can now log in with your new password." })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ error: "Server error resetting password" })
  }
}
