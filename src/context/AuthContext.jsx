import { createContext, useContext, useState } from 'react'
import { useData } from './DataContext'

/**
 * Mock auth. Any email/password signs in as the demo owner.
 * Step 3 will replace this with Supabase Auth.
 */
const AuthContext = createContext(null)
const KEY = 'billstock-auth'

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export function AuthProvider({ children }) {
  const { data } = useData()
  const [session, setSession] = useState(read)

  const save = (s) => {
    setSession(s)
    try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY) } catch { /* ignore */ }
  }

  const login = async (email) => {
    await new Promise((r) => setTimeout(r, 400))
    save({ user: { ...data.currentUser, email: email || data.currentUser.email }, onboarded: true })
  }

  const register = async ({ name, email }) => {
    await new Promise((r) => setTimeout(r, 400))
    save({ user: { ...data.currentUser, name, email }, onboarded: false })
  }

  const completeOnboarding = () => save({ ...session, onboarded: true })
  const logout = () => save(null)

  return (
    <AuthContext.Provider value={{ session, user: session?.user, login, register, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
