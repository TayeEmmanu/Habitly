"use client"

import { useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { Button } from "../components/ui/button.jsx"
import { CheckCircle2, Target, TrendingUp, Zap } from "lucide-react"

export default function HomePage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard")
    }
  }, [user, loading, navigate])

  if (loading) {
    return null
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="home-hero">
          <h1 className="home-title">
            Build Better Habits, <span className="home-title-highlight">One Day at a Time</span>
          </h1>
          <p className="home-subtitle">
            Track your daily habits, stay motivated with streaks, and transform your life with Habitly
          </p>

          <div className="home-buttons">
            <Button asChild size="lg">
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          <div className="home-features">
            <div className="feature-card">
              <Target className="feature-icon" />
              <h3 className="feature-title">Set Goals</h3>
              <p className="feature-description">Create custom habits with flexible frequencies</p>
            </div>
            <div className="feature-card">
              <CheckCircle2 className="feature-icon" />
              <h3 className="feature-title">Track Progress</h3>
              <p className="feature-description">Mark habits complete and build consistency</p>
            </div>
            <div className="feature-card">
              <Zap className="feature-icon" />
              <h3 className="feature-title">Stay Motivated</h3>
              <p className="feature-description">Maintain streaks and celebrate milestones</p>
            </div>
            <div className="feature-card">
              <TrendingUp className="feature-icon" />
              <h3 className="feature-title">See Insights</h3>
              <p className="feature-description">Visualize your progress over time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
