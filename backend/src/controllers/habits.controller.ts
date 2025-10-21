import { pool } from "../config/database.ts"

export const createHabit = async (req: { body: { name: any; frequency: any; startDate: any; }; user: { id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; habit?: any; }): void; new(): any; }; }; }) => {
  try {
    const { name, frequency, startDate } = req.body

    if (!name || !frequency || !startDate) {
      return res.status(400).json({ message: "Name, frequency, and start date are required" })
    }

    if (!["daily", "weekly", "monthly"].includes(frequency)) {
      return res.status(400).json({ message: "Frequency must be daily, weekly, or monthly" })
    }

    const result = await pool.query(
      "INSERT INTO habits (user_id, name, frequency, start_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.id, name, frequency, startDate],
    )

    res.status(201).json({
      message: "Habit created successfully",
      habit: result.rows[0],
    })
  } catch (error) {
    console.error("Create habit error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getHabits = async (req: { user: { id: any; }; }, res: { json: (arg0: { habits: any[]; }) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) => {
  try {
    const result = await pool.query(
      "SELECT * FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC",
      [req.user.id],
    )

    res.json({ habits: result.rows })
  } catch (error) {
    console.error("Get habits error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const deleteHabit = async (req: { params: { id: any; }; user: { id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; json: (arg0: { message: string; }) => void; }) => {
  try {
    const { id } = req.params

    const result = await pool.query("UPDATE habits SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *", [
      id,
      req.user.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found" })
    }

    res.json({ message: "Habit deleted successfully" })
  } catch (error) {
    console.error("Delete habit error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const completeHabit = async (req: { params: { id: any; }; body: { date: any; }; user: { id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; json: (arg0: { message: string; completion: any; }) => void; }) => {
  try {
    const { id } = req.params
    const { date } = req.body

    if (!date) {
      return res.status(400).json({ message: "Date is required" })
    }

    const habit = await pool.query("SELECT * FROM habits WHERE id = $1 AND user_id = $2 AND is_active = true", [
      id,
      req.user.id,
    ])

    if (habit.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found" })
    }

    const result = await pool.query(
      "INSERT INTO habit_completions (habit_id, completed_date) VALUES ($1, $2) ON CONFLICT (habit_id, completed_date) DO NOTHING RETURNING *",
      [id, date],
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Habit already completed for this date" })
    }

    res.json({
      message: "Habit marked as complete",
      completion: result.rows[0],
    })
  } catch (error) {
    console.error("Complete habit error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getCompletions = async (req: { params: { id: any; }; user: { id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; json: (arg0: { completions: any[]; }) => void; }) => {
  try {
    const { id } = req.params

    const habit = await pool.query("SELECT * FROM habits WHERE id = $1 AND user_id = $2", [id, req.user.id])

    if (habit.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found" })
    }

    const result = await pool.query(
      "SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY completed_date DESC",
      [id],
    )

    res.json({ completions: result.rows })
  } catch (error) {
    console.error("Get completions error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
