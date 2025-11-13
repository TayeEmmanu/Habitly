import { pool } from "../config/database.ts"

export const createHabit = async (req, res) => {
  try {
    const { name, frequency, startDate, customInterval } = req.body
    const userId = req.user.userId

    console.log("[v0] Creating habit:", { name, frequency, startDate, customInterval, userId })

    if (!name || !frequency) {
      return res.status(400).json({ error: "Name and frequency are required" })
    }

    if (frequency === "custom" && (!customInterval || customInterval < 1)) {
      return res.status(400).json({ error: "Custom interval must be at least 1 day" })
    }

    const result = await pool.query(
      "INSERT INTO habits (user_id, name, frequency, start_date, custom_interval) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, name, frequency, startDate || new Date(), frequency === "custom" ? customInterval : null],
    )

    console.log("[v0] Habit created successfully:", result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("[v0] Create habit error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const updateHabit = async (req, res) => {
  try {
    const { id } = req.params
    const { name, frequency, startDate, customInterval } = req.body
    const userId = req.user.userId

    console.log("[v0] Updating habit:", { id, name, frequency, startDate, customInterval, userId })

    if (!name || !frequency) {
      return res.status(400).json({ error: "Name and frequency are required" })
    }

    if (frequency === "custom" && (!customInterval || customInterval < 1)) {
      return res.status(400).json({ error: "Custom interval must be at least 1 day" })
    }

    const result = await pool.query(
      "UPDATE habits SET name = $1, frequency = $2, start_date = $3, custom_interval = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *",
      [name, frequency, startDate, frequency === "custom" ? customInterval : null, id, userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    console.log("[v0] Habit updated successfully:", result.rows[0])
    res.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Update habit error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const getHabits = async (req, res) => {
  try {
    const userId = req.user.userId
    console.log("[v0] Fetching habits for user:", userId)

    const result = await pool.query("SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC", [userId])

    console.log("[v0] Found habits:", result.rows.length)
    res.json(result.rows)
  } catch (error) {
    console.error("[v0] Get habits error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const getHabitsByDate = async (req, res) => {
  try {
    const userId = req.user.userId
    const { date } = req.query

    console.log("[v0] Fetching habits by date:", { userId, date })

    const habitsResult = await pool.query("SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC", [userId])

    const habitsWithCompletion = await Promise.all(
      habitsResult.rows.map(async (habit) => {
        let completionQuery
        let queryParams

        if (habit.frequency === "custom") {
          completionQuery = `
            SELECT COUNT(*) as count 
            FROM habit_completions 
            WHERE habit_id = $1 
            AND completed_date >= $2::date - INTERVAL '1 day' * $3
            AND completed_date <= $2::date
          `
          queryParams = [habit.id, date, habit.custom_interval - 1]
        } else if (habit.frequency === "daily") {
          completionQuery = `
            SELECT COUNT(*) as count 
            FROM habit_completions 
            WHERE habit_id = $1 AND completed_date = $2
          `
          queryParams = [habit.id, date]
        } else if (habit.frequency === "weekly") {
          completionQuery = `
            SELECT COUNT(*) as count 
            FROM habit_completions 
            WHERE habit_id = $1 
            AND completed_date >= DATE_TRUNC('week', $2::date)
            AND completed_date < DATE_TRUNC('week', $2::date) + INTERVAL '7 days'
          `
          queryParams = [habit.id, date]
        } else if (habit.frequency === "monthly") {
          completionQuery = `
            SELECT COUNT(*) as count 
            FROM habit_completions 
            WHERE habit_id = $1 
            AND completed_date >= DATE_TRUNC('month', $2::date)
            AND completed_date < DATE_TRUNC('month', $2::date) + INTERVAL '1 month'
          `
          queryParams = [habit.id, date]
        }

        const completionResult = await pool.query(completionQuery, queryParams)
        const completed = Number.parseInt(completionResult.rows[0].count) > 0

        const completionsResult = await pool.query(
          "SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY completed_date DESC",
          [habit.id],
        )

        const streaks = calculateStreaks(completionsResult.rows, habit.frequency, habit.custom_interval)

        return {
          ...habit,
          completed,
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
          totalCompletions: completionsResult.rows.length,
        }
      }),
    )

    console.log("[v0] Habits with completion status and streaks:", habitsWithCompletion.length)
    res.json(habitsWithCompletion)
  } catch (error) {
    console.error("[v0] Get habits by date error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    await pool.query("DELETE FROM habit_completions WHERE habit_id = $1", [id])
    const result = await pool.query("DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING *", [id, userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    res.json({ message: "Habit deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete habit error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const completeHabit = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const { date } = req.body

    console.log("[v0] Completing habit:", { id, userId, date })

    const habitResult = await pool.query("SELECT * FROM habits WHERE id = $1 AND user_id = $2", [id, userId])

    if (habitResult.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    const habit = habitResult.rows[0]
    const completionDate = date || new Date().toISOString().split("T")[0]

    let existingCompletionQuery
    let queryParams

    if (habit.frequency === "custom") {
      existingCompletionQuery = `
        SELECT * FROM habit_completions 
        WHERE habit_id = $1 
        AND completed_date >= $2::date - INTERVAL '1 day' * $3
        AND completed_date <= $2::date
      `
      queryParams = [id, completionDate, habit.custom_interval - 1]
    } else if (habit.frequency === "daily") {
      existingCompletionQuery = `
        SELECT * FROM habit_completions 
        WHERE habit_id = $1 AND completed_date = $2
      `
      queryParams = [id, completionDate]
    } else if (habit.frequency === "weekly") {
      existingCompletionQuery = `
        SELECT * FROM habit_completions 
        WHERE habit_id = $1 
        AND completed_date >= DATE_TRUNC('week', $2::date)
        AND completed_date < DATE_TRUNC('week', $2::date) + INTERVAL '7 days'
      `
      queryParams = [id, completionDate]
    } else if (habit.frequency === "monthly") {
      existingCompletionQuery = `
        SELECT * FROM habit_completions 
        WHERE habit_id = $1 
        AND completed_date >= DATE_TRUNC('month', $2::date)
        AND completed_date < DATE_TRUNC('month', $2::date) + INTERVAL '1 month'
      `
      queryParams = [id, completionDate]
    }

    const existingCompletion = await pool.query(existingCompletionQuery, queryParams)

    if (existingCompletion.rows.length > 0) {
      const period =
        habit.frequency === "custom"
          ? `${habit.custom_interval}-day period`
          : habit.frequency === "daily"
            ? "date"
            : habit.frequency === "weekly"
              ? "week"
              : "month"
      return res.status(400).json({ error: `Habit already completed for this ${period}` })
    }

    const result = await pool.query(
      "INSERT INTO habit_completions (habit_id, completed_date) VALUES ($1, $2) RETURNING *",
      [id, completionDate],
    )

    console.log("[v0] Habit completed successfully:", result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("[v0] Complete habit error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const getCompletionHistory = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const result = await pool.query(
      `SELECT hc.* FROM habit_completions hc 
       JOIN habits h ON hc.habit_id = h.id 
       WHERE hc.habit_id = $1 AND h.user_id = $2 
       ORDER BY hc.completed_date DESC`,
      [id, userId],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("[v0] Get completion history error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const uncompleteHabit = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const { date } = req.body

    console.log("[v0] Uncompleting habit:", { id, userId, date })

    const habitResult = await pool.query("SELECT * FROM habits WHERE id = $1 AND user_id = $2", [id, userId])

    if (habitResult.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    const habit = habitResult.rows[0]
    const completionDate = date || new Date().toISOString().split("T")[0]

    let deleteQuery
    let queryParams

    if (habit.frequency === "custom") {
      deleteQuery = `
        DELETE FROM habit_completions 
        WHERE habit_id = $1 
        AND completed_date >= $2::date - INTERVAL '1 day' * $3
        AND completed_date <= $2::date
        RETURNING *
      `
      queryParams = [id, completionDate, habit.custom_interval - 1]
    } else if (habit.frequency === "daily") {
      deleteQuery = "DELETE FROM habit_completions WHERE habit_id = $1 AND completed_date = $2 RETURNING *"
      queryParams = [id, completionDate]
    } else if (habit.frequency === "weekly") {
      deleteQuery = `
        DELETE FROM habit_completions 
        WHERE habit_id = $1 
        AND completed_date >= DATE_TRUNC('week', $2::date)
        AND completed_date < DATE_TRUNC('week', $2::date) + INTERVAL '7 days'
        RETURNING *
      `
      queryParams = [id, completionDate]
    } else if (habit.frequency === "monthly") {
      deleteQuery = `
        DELETE FROM habit_completions 
        WHERE habit_id = $1 
        AND completed_date >= DATE_TRUNC('month', $2::date)
        AND completed_date < DATE_TRUNC('month', $2::date) + INTERVAL '1 month'
        RETURNING *
      `
      queryParams = [id, completionDate]
    }

    const result = await pool.query(deleteQuery, queryParams)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No completion found for this period" })
    }

    console.log("[v0] Habit uncompleted successfully")
    res.json({ message: "Completion removed successfully" })
  } catch (error) {
    console.error("[v0] Uncomplete habit error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const getCompletions = async (req, res) => {
  try {
    const userId = req.user.userId

    const result = await pool.query(
      `SELECT hc.* FROM habit_completions hc 
       JOIN habits h ON hc.habit_id = h.id 
       WHERE h.user_id = $1 
       ORDER BY hc.completed_date DESC`,
      [userId],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("[v0] Get completions error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

const calculateStreaks = (completions, frequency, customInterval = null) => {
  if (completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const sortedDates = completions.map((c) => new Date(c.completed_date)).sort((a, b) => b - a)

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getWeekStart = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day // If Sunday, go back 6 days; otherwise go back to Monday
    d.setDate(d.getDate() + diff)
    return d
  }

  const mostRecent = sortedDates[0]
  const isCurrentPeriod = (date) => {
    if (frequency === "custom") {
      const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24))
      return diffDays < customInterval
    } else if (frequency === "daily") {
      return date.toDateString() === today.toDateString()
    } else if (frequency === "weekly") {
      const currentWeekStart = getWeekStart(today)
      const dateWeekStart = getWeekStart(date)
      return currentWeekStart.getTime() === dateWeekStart.getTime()
    } else if (frequency === "monthly") {
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
    }
    return false
  }

  if (isCurrentPeriod(mostRecent)) {
    currentStreak = 1
  }

  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i]
    const previous = sortedDates[i - 1]

    let isConsecutive = false
    if (frequency === "custom") {
      const diffDays = Math.floor((previous - current) / (1000 * 60 * 60 * 24))
      isConsecutive = diffDays <= customInterval
    } else if (frequency === "daily") {
      const diffDays = Math.floor((previous - current) / (1000 * 60 * 60 * 24))
      isConsecutive = diffDays === 1
    } else if (frequency === "weekly") {
      const previousWeekStart = getWeekStart(previous)
      const currentWeekStart = getWeekStart(current)
      const diffMs = previousWeekStart - currentWeekStart
      const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7))
      isConsecutive = diffWeeks === 1
    } else if (frequency === "monthly") {
      const monthDiff =
        (previous.getFullYear() - current.getFullYear()) * 12 + (previous.getMonth() - current.getMonth())
      isConsecutive = monthDiff === 1
    }

    if (isConsecutive) {
      tempStreak++
      if (i === 1 && isCurrentPeriod(mostRecent)) {
        currentStreak = tempStreak
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak)
  return { currentStreak, longestStreak }
}

export const getHabitWithStreaks = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const habitResult = await pool.query("SELECT * FROM habits WHERE id = $1 AND user_id = $2", [id, userId])

    if (habitResult.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    const habit = habitResult.rows[0]

    const completionsResult = await pool.query(
      "SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY completed_date DESC",
      [id],
    )

    const streaks = calculateStreaks(completionsResult.rows, habit.frequency, habit.custom_interval)

    res.json({
      ...habit,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      totalCompletions: completionsResult.rows.length,
    })
  } catch (error) {
    console.error("[v0] Get habit with streaks error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const getAllHabitsWithStreaks = async (req, res) => {
  try {
    const userId = req.user.userId

    const habitsResult = await pool.query("SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC", [userId])

    const habitsWithStreaks = await Promise.all(
      habitsResult.rows.map(async (habit) => {
        const completionsResult = await pool.query(
          "SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY completed_date DESC",
          [habit.id],
        )

        const streaks = calculateStreaks(completionsResult.rows, habit.frequency, habit.custom_interval)

        return {
          ...habit,
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
          totalCompletions: completionsResult.rows.length,
        }
      }),
    )

    res.json(habitsWithStreaks)
  } catch (error) {
    console.error("[v0] Get all habits with streaks error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}
