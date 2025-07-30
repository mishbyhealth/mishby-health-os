// features/auth/useAuth.ts
import { useState, useEffect } from 'react'
import {
  login,
  register,
  logout,
  resetPassword,
  onAuthChange
} from './authService'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, loading, login, register, logout, resetPassword }
}
