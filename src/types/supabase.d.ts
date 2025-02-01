import { Database } from '../types/supabase'

declare global {
  type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json }
    | Json[]

  interface Window {
    supabase: SupabaseClient<Database>
  }
}