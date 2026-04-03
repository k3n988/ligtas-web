// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface AuthUser {
  contact: string
}

interface AuthStore {
  user: AuthUser | null
  loading: boolean
  showModal: boolean
  setShowModal: (v: boolean) => void
  signUp: (contact: string, password: string) => Promise<string | null>
  login: (contact: string, password: string) => Promise<string | null>
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      showModal: false,
      setShowModal: (v) => set({ showModal: v }),

      signUp: async (contact, password) => {
        set({ loading: true })
        try {
          const passwordHash = await hashPassword(password)
          const { error } = await supabase
            .from('household_users')
            .insert({ contact, password_hash: passwordHash })
          if (error) {
            set({ loading: false })
            if (error.code === '23505')
              return 'This contact number already has an account.'
            return error.message
          }
          set({ user: { contact }, loading: false })
          return null
        } catch {
          set({ loading: false })
          return 'Sign up failed. Please try again.'
        }
      },

      login: async (contact, password) => {
        set({ loading: true })
        try {
          const passwordHash = await hashPassword(password)
          const { data, error } = await supabase
            .from('household_users')
            .select('contact')
            .eq('contact', contact)
            .eq('password_hash', passwordHash)
            .single()
          if (error || !data) {
            set({ loading: false })
            return 'Invalid contact number or password.'
          }
          set({ user: { contact }, loading: false })
          return null
        } catch {
          set({ loading: false })
          return 'Login failed. Please try again.'
        }
      },

      logout: () => set({ user: null }),
    }),
    { name: 'ligtas-auth' },
  ),
)
