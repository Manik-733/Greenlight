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
    displayName: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

const getApiBase = () => {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) return "/api/bmdb";
  // If baseUrl already contains /api/bmdb, use it as-is
  if (baseUrl.includes("/api/bmdb")) return baseUrl;
  // Otherwise if it's a full URL, append /api/bmdb
  return baseUrl.startsWith("http") ? `${baseUrl}/api/bmdb` : baseUrl;
};

const API_BASE = getApiBase();

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
      console.log("Fetching profile from API:", API_BASE);
      const response = await fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Profile API response status:", response.status);

      if (!response.ok) {
        console.warn(`Failed to fetch profile: ${response.status}`);
        setProfile(null);
        return;
      }

      const data = await response.json();
      console.log("Profile API response data:", data);

      const { profile: profileData } = data;
      console.log("Profile data extracted:", profileData);

      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching profile from API:", err);
      setProfile(null);
    }
  }, []);

  // Refetch profile helper - can be called manually
  const refetchProfile = useCallback(async () => {
    const token = localStorage.getItem("greenlight_token");
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
            localStorage.setItem("greenlight_token", data.session.access_token);
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
        localStorage.setItem("greenlight_token", authSession.access_token);
        // Fetch profile from backend API on session change
        await fetchProfileFromApi(authSession.access_token);
      } else {
        setProfile(null);
        localStorage.removeItem("greenlight_token");
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
    displayName: string,
  ) => {
    try {
      setLoading(true);
      const fullUrl = `${API_BASE}/auth/signup`;
      console.log("Calling signup API:", fullUrl);
      console.log("Request data:", {
        email,
        username,
        displayName,
        password: "***",
      });

      // Use backend API to create account and profile
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          displayName,
        }),
      });

      console.log("Signup response status:", response.status);
      const responseData = await response.json();
      console.log("Signup response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create account");
      }

      // Give Supabase time to confirm the email
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If email not confirmed error, let the user know to login manually
      if (signInError?.message.includes("Email not confirmed")) {
        throw new Error(
          "Account created! Please log in now. Your email is being confirmed.",
        );
      }

      if (signInError) throw signInError;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Clear local storage first
      localStorage.removeItem("greenlight_token");

      // Try to sign out from Supabase (may fail if session is missing, that's ok)
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        console.warn(
          "Supabase signOut failed (session may already be cleared):",
          error,
        );
        // Continue anyway - we cleared the local token
      }

      // Clear auth state manually
      setSession(null);
      setUser(null);
      setProfile(null);
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
