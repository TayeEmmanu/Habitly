export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

export interface UserResponse {
  id: number
  name: string
  email: string
  created_at: Date
  updated_at: Date
}
