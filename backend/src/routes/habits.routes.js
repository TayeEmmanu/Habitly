import express from "express"
import {
  createHabit,
  updateHabit,
  getHabits,
  deleteHabit,
  completeHabit,
  uncompleteHabit,
  getCompletions,
  getHabitWithStreaks,
  getAllHabitsWithStreaks,
  getHabitsByDate,
} from "../controllers/habits.controller.js"
import { authenticateToken } from "../middleware/auth.ts"

const router = express.Router()

router.post("/", authenticateToken, createHabit)
router.put("/:id", authenticateToken, updateHabit)
router.get("/", authenticateToken, getHabits)
router.get("/by-date", authenticateToken, getHabitsByDate)
router.get("/with-streaks", authenticateToken, getAllHabitsWithStreaks)
router.get("/:id/with-streaks", authenticateToken, getHabitWithStreaks)
router.get("/completions", authenticateToken, getCompletions)
router.delete("/:id", authenticateToken, deleteHabit)
router.post("/:id/complete", authenticateToken, completeHabit)
router.post("/:id/uncomplete", authenticateToken, uncompleteHabit)

export default router
