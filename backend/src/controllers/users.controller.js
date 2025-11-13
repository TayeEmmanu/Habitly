import { pool } from "../config/database.ts"

export const getProfile = async (req, res) => {
  try {
    console.log("[v0] Getting profile for user:", req.user.userId)

    const result = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [req.user.userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    res.status(500).json({ error: "Server error" })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body
    console.log("[v0] Updating profile for user:", req.user.userId, { name, email })

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" })
    }

    // Check if email is already in use by another user
    const emailExists = await pool.query("SELECT * FROM users WHERE email = $1 AND id != $2", [email, req.user.userId])

    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" })
    }

    // Update user profile
    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at",
      [name, email, req.user.userId],
    )

    console.log("[v0] Profile updated successfully")
    res.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    res.status(500).json({ error: "Server error" })
  }
}
