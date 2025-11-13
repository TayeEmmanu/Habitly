"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import SplashScreen from "./SplashScreen"

export default function HomeRedirect() {
  const { loading } = useAuth()

  if (loading) {
    return <SplashScreen />
  }

  return <Navigate to="/dashboard" replace />
}
