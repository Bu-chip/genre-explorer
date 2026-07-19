import { createContext, useContext } from 'react'

// The context object lives here (a non-component module) so AuthContext.jsx can
// export only the AuthProvider component — keeps react-refresh happy.
export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
