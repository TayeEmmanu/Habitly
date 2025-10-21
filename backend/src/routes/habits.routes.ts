import express from "express";
import type { Request, Response, NextFunction } from "express";
import {
  createHabit,
  getHabits,
  deleteHabit,
  completeHabit,
  getCompletions,
} from "../controllers/habits.controller.ts";
import { authenticateToken } from "../middleware/auth.ts";



// Extend Express Request for user (optional)
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string | number;
        [key: string]: any;
      };
    }
  }
}

const router = express.Router();

// Helper wrapper for async controllers to catch errors cleanly
const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Use router handlers directly — Express handles the Request type automatically
router.post("/", authenticateToken, asyncHandler(createHabit));
router.get("/", authenticateToken, asyncHandler(getHabits));
router.delete("/:id", authenticateToken, asyncHandler(deleteHabit));
router.post("/:id/complete", authenticateToken, asyncHandler(completeHabit));
router.get("/:id/completions", authenticateToken, asyncHandler(getCompletions));

export default router;
