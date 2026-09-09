import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
    user: User | null;
    session: Session | null;
    isGuest: boolean;
    loading: boolean;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    initialize: () => Promise<void>;
    signInAsGuest: () => void;
    signOut: () => Promise<void>;
}

const GUEST_STORAGE_KEY = "curalab_guest_session";

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    isGuest: false,
    loading: true,
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    initialize: async () => {
        // 1. Check if guest mode was active
        const guestActive = localStorage.getItem(GUEST_STORAGE_KEY);
        if (guestActive === "true") {
            const mockUser = {
                id: "00000000-0000-0000-0000-000000000000",
                email: "demo.patient@curalab.ai",
                app_metadata: { provider: "guest" },
                user_metadata: { full_name: "Demo Clinical User" },
                aud: "authenticated",
                created_at: new Date().toISOString(),
            } as unknown as User;

            set({
                user: mockUser,
                isGuest: true,
                session: {
                    access_token: "demo-guest-token",
                    token_type: "bearer",
                    expires_in: 3600,
                    refresh_token: "demo-refresh-token",
                    user: mockUser,
                } as unknown as Session,
                loading: false,
            });
            return;
        }

        // 2. Otherwise load Supabase session
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user || null, isGuest: false, loading: false });

            supabase.auth.onAuthStateChange((_event, session) => {
                if (!localStorage.getItem(GUEST_STORAGE_KEY)) {
                    set({ session, user: session?.user || null, isGuest: false, loading: false });
                }
            });
        } catch {
            set({ user: null, session: null, isGuest: false, loading: false });
        }
    },
    signInAsGuest: () => {
        localStorage.setItem(GUEST_STORAGE_KEY, "true");
        const mockUser = {
            id: "00000000-0000-0000-0000-000000000000",
            email: "demo.patient@curalab.ai",
            app_metadata: { provider: "guest" },
            user_metadata: { full_name: "Demo Clinical User" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
        } as unknown as User;

        set({
            user: mockUser,
            isGuest: true,
            session: {
                access_token: "demo-guest-token",
                token_type: "bearer",
                expires_in: 3600,
                refresh_token: "demo-refresh-token",
                user: mockUser,
            } as unknown as Session,
            loading: false,
        });
    },
    signOut: async () => {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        try {
            await supabase.auth.signOut();
        } catch {
            // Ignore if offline
        }
        set({ user: null, session: null, isGuest: false });
    },
}));