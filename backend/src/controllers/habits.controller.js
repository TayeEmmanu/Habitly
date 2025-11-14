import { pool } from "../config/database.ts"

// Helper function to calculate which period the requested date falls into based on start_date
const getPeriodFromStart = (startDate, currentDate, frequency, customInterval) => {
  const start = new Date(startDate)
  const current = new Date(currentDate)
  start.setHours(0, 0, 0, 0)
  current.setHours(0, 0, 0, 0)

  if (frequency === "daily") {
    const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24))
    return diffDays
  } else if (frequency === "weekly") {
    const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / 7)
  } else if (frequency === "monthly") {
    const monthsDiff = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth())
    if (current.getDate() >= start.getDate()) {
      return monthsDiff
    } else {
      return monthsDiff - 1
    }
  } else if (frequency === "custom") {
    const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / customInterval)
  }
  return 0
}

// Helper function to get period start and end dates
const getPeriodDates = (startDate, periodNumber, frequency, customInterval) => {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  if (frequency === "daily") {
    const periodStart = new Date(start)
    periodStart.setDate(start.getDate() + periodNumber)
    const periodEnd = new Date(periodStart)
    return { periodStart, periodEnd }
  } else if (frequency === "weekly") {
    const periodStart = new Date(start)
    periodStart.setDate(start.getDate() + periodNumber * 7)
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + 6)
    return { periodStart, periodEnd }
  } else if (frequency === "monthly") {
    const periodStart = new Date(start)
    periodStart.setMonth(start.getMonth() + periodNumber)
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    periodEnd.setDate(periodEnd.getDate() - 1)
    return { periodStart, periodEnd }
  } else if (frequency === "custom") {
    const periodStart = new Date(start)
    periodStart.setDate(start.getDate() + periodNumber * customInterval)
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + customInterval - 1)
    return { periodStart, periodEnd }
  }
  return { periodStart: start, periodEnd: start }
}

const canCompleteHabit = async (habitId, frequency, customInterval, requestedDate) => {
  const lastCompletionResult = await pool.query(
    "SELECT completed_date FROM habit_completions WHERE habit_id = $1 ORDER BY completed_date DESC LIMIT 1",
    [habitId],
  )

  if (lastCompletionResult.rows.length === 0) {
    return { canComplete: true }
  }

  const lastCompletion = new Date(lastCompletionResult.rows[0].completed_date)
  const requested = new Date(requestedDate)
  lastCompletion.setHours(0, 0, 0, 0)
  requested.setHours(0, 0, 0, 0)

  const daysSinceCompletion = Math.floor((requested - lastCompletion) / (1000 * 60 * 60 * 24))

  if (frequency === "daily") {
    return { canComplete: daysSinceCompletion >= 1 }
  } else if (frequency === "weekly") {
    return { canComplete: daysSinceCompletion >= 7 }
  } else if (frequency === "monthly") {
    const nextAllowedDate = new Date(lastCompletion)
    nextAllowedDate.setMonth(nextAllowedDate.getMonth() + 1)
    return { canComplete: requested >= nextAllowedDate }
  } else if (frequency === "custom") {
    return { canComplete: daysSinceCompletion >= customInterval }
  }

  return { canComplete: true }
}

const calculateStreaks = (completions, frequency, customInterval = null) => {
  if (completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const sortedDates = completions.map((c) => new Date(c.completed_date)).sort((a, b) => b - a)

  let currentStreak = 1
  let longestStreak = 1
  let tempStreak = 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const mostRecent = sortedDates[0]
  const daysSinceMostRecent = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24))

  let maxGap = 1
  if (frequency === "daily") {
    maxGap = 2 // Allow 1 day grace
  } else if (frequency === "weekly") {
    maxGap = 14 // Allow 7 days + 7 day grace (exactly 7-14 days)
  } else if (frequency === "monthly") {
    maxGap = 62 // Allow ~2 months grace
  } else if (frequency === "custom") {
    maxGap = customInterval * 2 // Allow interval + grace
  }

  if (daysSinceMostRecent > maxGap) {
    currentStreak = 0
  }

  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i]
    const previous = sortedDates[i - 1]
    const daysBetween = Math.floor((previous - current) / (1000 * 60 * 60 * 24))

    let isConsecutive = false

    if (frequency === "daily") {
      isConsecutive = daysBetween >= 1 && daysBetween <= 2
    } else if (frequency === "weekly") {
      isConsecutive = daysBetween >= 7 && daysBetween <= 14
    } else if (frequency === "monthly") {
      isConsecutive = daysBetween >= 28 && daysBetween <= 62
    } else if (frequency === "custom") {
      isConsecutive = daysBetween >= customInterval && daysBetween <= customInterval * 2
    }

    if (isConsecutive) {
      tempStreak++
      if (currentStreak > 0) {
        currentStreak = tempStreak
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
      if (currentStreak > 0) {
        currentStreak = 0
      }
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak)
  return { currentStreak, longestStreak }
}

export const createHabit = async (req, res) => {
  try {
    const { name, frequency, startDate, customInterval, category, dailyGoal, allowMultiple } = req.body
    const userId = req.user.userId

    console.log("[v0] Creating habit:", {
      name,
      frequency,
      startDate,
      customInterval,
      category,
      dailyGoal,
      allowMultiple,
      userId,
    })

    if (!name || !frequency) {
      return res.status(400).json({ error: "Name and frequency are required" })
    }

    if (frequency === "custom" && (!customInterval || customInterval < 1)) {
      return res.status(400).json({ error: "Custom interval must be at least 1 day" })
    }

    const result = await pool.query(
      "INSERT INTO habits (user_id, name, frequency, start_date, custom_interval, category, daily_goal, allow_multiple) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        userId,
        name,
        frequency,
        startDate || new Date(),
        frequency === "custom" ? customInterval : null,
        category || "productivity",
        dailyGoal || 1,
        allowMultiple || false,
      ],
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
    const { name, frequency, startDate, customInterval, category, dailyGoal, allowMultiple } = req.body
    const userId = req.user.userId

    console.log("[v0] Updating habit:", {
      id,
      name,
      frequency,
      startDate,
      customInterval,
      category,
      dailyGoal,
      allowMultiple,
      userId,
    })

    if (!name || !frequency) {
      return res.status(400).json({ error: "Name and frequency are required" })
    }

    if (frequency === "custom" && (!customInterval || customInterval < 1)) {
      return res.status(400).json({ error: "Custom interval must be at least 1 day" })
    }

    const result = await pool.query(
      "UPDATE habits SET name = $1, frequency = $2, start_date = $3, custom_interval = $4, category = $5, daily_goal = $6, allow_multiple = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND user_id = $9 RETURNING *",
      [
        name,
        frequency,
        startDate,
        frequency === "custom" ? customInterval : null,
        category || "productivity",
        dailyGoal || 1,
        allowMultiple || false,
        id,
        userId,
      ],
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
    const { includeArchived } = req.query

    console.log("[v0] Fetching habits for user:", userId, "includeArchived:", includeArchived)

    const query =
      includeArchived === "true"
        ? "SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC"
        : "SELECT * FROM habits WHERE user_id = $1 AND archived = false ORDER BY created_at DESC"

    const result = await pool.query(query, [userId])

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
    const { date, includeArchived } = req.query

    console.log("[v0] Fetching habits by date:", { userId, date, includeArchived })

    const query =
      includeArchived === "true"
        ? "SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC"
        : "SELECT * FROM habits WHERE user_id = $1 AND archived = false ORDER BY created_at DESC"

    const habitsResult = await pool.query(query, [userId])

    const habitsWithCompletion = await Promise.all(
      habitsResult.rows.map(async (habit) => {
        const completionQuery = `
          SELECT COALESCE(SUM(completion_count), 0) as count 
          FROM habit_completions 
          WHERE habit_id = $1 AND completed_date = $2
        `
        const completionResult = await pool.query(completionQuery, [habit.id, date])
        const completionCount = Number.parseInt(completionResult.rows[0].count)

        const completed = habit.allow_multiple ? completionCount >= (habit.daily_goal || 1) : completionCount > 0

        const completionsResult = await pool.query(
          "SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY completed_date DESC",
          [habit.id],
        )

        const streaks = calculateStreaks(completionsResult.rows, habit.frequency, habit.custom_interval)

        return {
          ...habit,
          completed,
          completionCount,
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
    const { date, count } = req.body

    console.log("[v0] Completing habit:", { id, userId, date, count })

    const habitResult = await pool.query("SELECT * FROM habits WHERE id = $1 AND user_id = $2", [id, userId])

    if (habitResult.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    const habit = habitResult.rows[0]
    const completionDate = date || new Date().toISOString().split("T")[0]
    const completionCount = count || 1

    if (habit.allow_multiple) {
      const existingResult = await pool.query(
        "SELECT * FROM habit_completions WHERE habit_id = $1 AND completed_date = $2",
        [id, completionDate],
      )

      if (existingResult.rows.length > 0) {
        // Update existing completion count
        const result = await pool.query(
          "UPDATE habit_completions SET completion_count = completion_count + $1 WHERE habit_id = $2 AND completed_date = $3 RETURNING *",
          [completionCount, id, completionDate],
        )
        console.log("[v0] Incremented habit completion count:", result.rows[0])
        return res.status(200).json(result.rows[0])
      }
    } else {
      // For single-completion habits, check if allowed
      const lastCompletionResult = await pool.query(
        "SELECT completed_date FROM habit_completions WHERE habit_id = $1 ORDER BY completed_date DESC LIMIT 1",
        [id],
      )

      if (lastCompletionResult.rows.length > 0) {
        const lastCompletion = new Date(lastCompletionResult.rows[0].completed_date)
        const requested = new Date(completionDate)
        lastCompletion.setHours(0, 0, 0, 0)
        requested.setHours(0, 0, 0, 0)

        const daysSinceCompletion = Math.floor((requested - lastCompletion) / (1000 * 60 * 60 * 24))

        let canComplete = true
        let errorMessage = ""

        if (habit.frequency === "daily" && daysSinceCompletion < 1) {
          canComplete = false
          errorMessage = "Habit can only be completed once per day"
        } else if (habit.frequency === "weekly" && daysSinceCompletion < 7) {
          canComplete = false
          errorMessage = `Habit can only be completed once every 7 days (${7 - daysSinceCompletion} days remaining)`
        } else if (habit.frequency === "monthly") {
          const nextAllowedDate = new Date(lastCompletion)
          nextAllowedDate.setMonth(nextAllowedDate.getMonth() + 1)
          if (requested < nextAllowedDate) {
            canComplete = false
            errorMessage = "Habit can only be completed once per month"
          }
        } else if (habit.frequency === "custom" && daysSinceCompletion < habit.custom_interval) {
          canComplete = false
          errorMessage = `Habit can only be completed once every ${habit.custom_interval} days (${habit.custom_interval - daysSinceCompletion} days remaining)`
        }

        if (!canComplete) {
          return res.status(400).json({ error: errorMessage })
        }
      }
    }

    const result = await pool.query(
      "INSERT INTO habit_completions (habit_id, completed_date, completion_count) VALUES ($1, $2, $3) ON CONFLICT (habit_id, completed_date) DO UPDATE SET completion_count = habit_completions.completion_count + $3 RETURNING *",
      [id, completionDate, completionCount],
    )

    console.log("[v0] Habit completed successfully:", result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("[v0] Complete habit error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const decrementHabit = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const { date, count } = req.body

    console.log("[v0] Decrementing habit:", { id, userId, date, count })

    const habitResult = await pool.query("SELECT * FROM habits WHERE id = $1 AND user_id = $2", [id, userId])

    if (habitResult.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    const habit = habitResult.rows[0]
    const completionDate = date || new Date().toISOString().split("T")[0]
    const decrementCount = count || 1

    if (!habit.allow_multiple) {
      return res.status(400).json({ error: "This habit does not support multiple completions" })
    }

    const existingResult = await pool.query(
      "SELECT * FROM habit_completions WHERE habit_id = $1 AND completed_date = $2",
      [id, completionDate],
    )

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "No completion found for this date" })
    }

    const currentCount = existingResult.rows[0].completion_count
    const newCount = Math.max(0, currentCount - decrementCount)

    if (newCount === 0) {
      // Delete the completion if count reaches 0
      await pool.query("DELETE FROM habit_completions WHERE habit_id = $1 AND completed_date = $2", [
        id,
        completionDate,
      ])
      console.log("[v0] Habit completion deleted (count reached 0)")
      return res.json({ message: "Completion removed", count: 0 })
    } else {
      // Update the count
      const result = await pool.query(
        "UPDATE habit_completions SET completion_count = $1 WHERE habit_id = $2 AND completed_date = $3 RETURNING *",
        [newCount, id, completionDate],
      )
      console.log("[v0] Habit completion count decremented:", result.rows[0])
      return res.json(result.rows[0])
    }
  } catch (error) {
    console.error("[v0] Decrement habit error:", error.message, error.stack)
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

    const completionDate = date || new Date().toISOString().split("T")[0]

    const result = await pool.query(
      "DELETE FROM habit_completions WHERE habit_id = $1 AND completed_date = $2 RETURNING *",
      [id, completionDate],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No completion found for this date" })
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

export const archiveHabit = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    console.log("[v0] Archiving habit:", { id, userId })

    const result = await pool.query(
      "UPDATE habits SET archived = true, archived_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    console.log("[v0] Habit archived successfully:", result.rows[0])
    res.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Archive habit error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const restoreHabit = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    console.log("[v0] Restoring habit:", { id, userId })

    const result = await pool.query(
      "UPDATE habits SET archived = false, archived_at = NULL WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" })
    }

    console.log("[v0] Habit restored successfully:", result.rows[0])
    res.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Restore habit error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}

export const getArchivedHabits = async (req, res) => {
  try {
    const userId = req.user.userId

    console.log("[v0] Fetching archived habits for user:", userId)

    const result = await pool.query(
      "SELECT * FROM habits WHERE user_id = $1 AND archived = true ORDER BY archived_at DESC",
      [userId],
    )

    console.log("[v0] Found archived habits:", result.rows.length)
    res.json(result.rows)
  } catch (error) {
    console.error("[v0] Get archived habits error:", error.message, error.stack)
    res.status(500).json({ error: "Server error", details: error.message })
  }
}
