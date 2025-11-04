import express, { type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import dotenv from "dotenv"
import { pool } from "./config/database.ts"
// @ts-ignore
import authRoutes from "./routes/auth.routes.js"
// @ts-ignore
import usersRoutes from "./routes/users.routes.js"
// @ts-ignore
import habitsRoutes from "./routes/habits.routes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      // Allow any localhost origin
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true)
      }

      // Reject other origins
      callback(new Error("Not allowed by CORS"))
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    exposedHeaders: ["Authorization"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)
app.use(express.json())

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[v0] Incoming request: ${req.method} ${req.url}`)
  next()
})

// Routes
app.use("/auth", authRoutes)
app.use("/users", usersRoutes)
app.use("/habits", habitsRoutes)

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" })
})

// 404 handler
app.use((req: Request, res: Response) => {
  console.log(`[v0] 404 - Route not found: ${req.method} ${req.path}`)
  res.status(404).json({ error: "Route not found" })
})

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[v0] Server error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// Test database connection
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("Database connection error:", err)
  } else {
    console.log("Database connected successfully")
  }
})
