'use client'

import {createContext, useContext, useEffect, useState} from 'react'
import {auth} from "@/firebase"
import { onAuthStateChanged, User } from 'firebase/auth'

type AuthContextType = {
  user: User | null
}

const AuthContext = createContext<AuthContextType>({user: null})

function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null)
    })
    return () => unsubscribe()
  }, [auth])

  return (
    <AuthContext.Provider value={{user}}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider


export const useAuth = () => useContext(AuthContext)