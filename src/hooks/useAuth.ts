import { useCallback, useEffect, useState } from 'react'
import { fetchAuthStatus, login as loginRequest, logout as logoutRequest } from '../services/authData'

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetchAuthStatus()
      .then((status) => {
        setAuthenticated(status.authenticated)
        setConfigured(status.configured)
      })
      .finally(() => setChecking(false))
  }, [])

  const login = useCallback(async (password: string) => {
    const result = await loginRequest(password)
    if (result.ok) setAuthenticated(true)
    return result
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setAuthenticated(false)
  }, [])

  return { authenticated, configured, checking, login, logout }
}
