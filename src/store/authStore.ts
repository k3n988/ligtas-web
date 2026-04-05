// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password + 'LIGTAS_SALT_2025')
  const hash = await crypto.subtle.digest('SHA-256', encoded)
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
  authTab: 'login' | 'signup'
  setShowModal: (v: boolean) => void
  setAuthTab: (tab: 'login' | 'signup') => void
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
      authTab: 'login',
      
      setShowModal: (v) => set({ showModal: v }),
      setAuthTab: (tab) => set({ authTab: tab }),

      signUp: async (contact, password) => {
        set({ loading: true })
        try {
          const isEmail = contact.includes('@')

          if (isEmail) {
            // SIGN UP VIA SUPABASE AUTH (For Admins/Email users)
            const { error } = await supabase.auth.signUp({
              email: contact,
              password: password,
            })
            if (error) {
              set({ loading: false })
              return error.message
            }
          } else {
            // SIGN UP VIA CUSTOM TABLE (For Household Members)
            const passwordHash = await hashPassword(password)
            const { error } = await supabase
              .from('households') // <-- UPDATED TABLE
              .insert({ contact, citizen_password_hash: passwordHash }) // <-- UPDATED COLUMN
              
            if (error) {
              set({ loading: false })
              if (error.code === '23505')
                return 'This contact number already has an account.'
              return error.message
            }
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
          const isEmail = contact.includes('@')

          if (isEmail) {
            // LOGIN VIA SUPABASE AUTH (Admin Login)
            const { data, error } = await supabase.auth.signInWithPassword({
              email: contact,
              password: password,
            })

            if (error || !data.user) {
              set({ loading: false })
              return 'Invalid admin email or password.'
            }
          } else {
            // LOGIN VIA CUSTOM TABLE (Household Member Login)
            const passwordHash = await hashPassword(password)
            const { data, error } = await supabase
              .from('households') // <-- UPDATED TABLE
              .select('contact')
              .eq('contact', contact)
              .eq('citizen_password_hash', passwordHash) // <-- UPDATED COLUMN
              .single()

            if (error || !data) {
              set({ loading: false })
              return 'Invalid contact number or password.'
            }
          }

          // Kung walang error, success ang login!
          set({ user: { contact }, loading: false })
          return null
        } catch {
          set({ loading: false })
          return 'Login failed. Please try again.'
        }
      },

      logout: async () => {
        // I-sign out din sa Supabase Auth para malinis ang session ng Admin
        await supabase.auth.signOut()
        set({ user: null })
      },
    }),
    { name: 'ligtas-auth' },
  ),
)