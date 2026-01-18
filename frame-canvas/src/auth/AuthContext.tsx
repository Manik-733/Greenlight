import React, { createContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
  banned_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const API_BASE = import.meta.env.VITE_API_URL || "/api/bmdb";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile via backend API using current session token
  const fetchProfileFromApi = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch profile: ${response.status}`);
        setProfile(null);
        return;
      }

      const { profile: profileData } = await response.json();
      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching profile from API:", err);
      setProfile(null);
    }
  }, []);

  // Refetch profile helper - can be called manually
  const refetchProfile = useCallback(async () => {
    const token = localStorage.getItem("bmdb_token");
    if (token) {
      await fetchProfileFromApi(token);
    }
  }, [fetchProfileFromApi]);

  // Initialize auth on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get existing session
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          // Restore token to localStorage
          if (data.session.access_token) {
            localStorage.setItem("bmdb_token", data.session.access_token);
            // Fetch profile from backend API
            await fetchProfileFromApi(data.session.access_token);
          }
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      setSession(authSession);
      setUser(authSession?.user ?? null);

      if (authSession?.access_token) {
        localStorage.setItem("bmdb_token", authSession.access_token);
        // Fetch profile from backend API on session change
        await fetchProfileFromApi(authSession.access_token);
      } else {
        setProfile(null);
        localStorage.removeItem("bmdb_token");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfileFromApi]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (data.user) {
        // Create profile entry
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          username,
          display_name: displayName,
        });
        if (profileError) throw profileError;
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem("bmdb_token");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
