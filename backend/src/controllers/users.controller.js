import { pool } from "../config/database.ts"

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" })
    }

    // Check if email is already taken by another user
    const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, userId])

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" })
    }

    // Update user profile
    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, email, created_at",
      [name, email, userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
