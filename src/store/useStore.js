import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------
// Global app state (Zustand).
// Holds who is currently "logged in" via PIN and which campaign
// session they belong to. We persist it to localStorage so a phone
// refresh keeps the player on their sheet instead of the login screen.
// ---------------------------------------------------------------
export const useStore = create(
  persist(
    (set) => ({
      // The campaign session row from Supabase { id, name, ... }
      session: null,

      // "player" or "dm" — decides which view to show
      role: null,

      // The logged-in character row (players only); null for the DM
      character: null,

      // Set when a new name + valid campaign code is entered: { session, name }.
      // Guards the /create route and seeds the creation wizard. Cleared on login/logout.
      pendingSignup: null,

      // Save a successful login (also clears any pending signup)
      login: ({ session, role, character = null }) =>
        set({ session, role, character, pendingSignup: null }),

      // Update the cached character (e.g. after live HP sync)
      setCharacter: (character) => set({ character }),

      // Stash a pending signup before routing to the creation wizard
      setPendingSignup: (pendingSignup) => set({ pendingSignup }),

      // Clear everything and return to the login screen
      logout: () =>
        set({ session: null, role: null, character: null, pendingSignup: null }),
    }),
    {
      name: 'dnd-companion-session', // localStorage key
    }
  )
)
