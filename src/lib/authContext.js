import { createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && anon ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}
