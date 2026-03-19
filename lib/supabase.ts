import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://vhemkzciypbwwptjejfj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZW1remNpeXBid3dwdGplamZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzIzMzMsImV4cCI6MjA4OTUwODMzM30.RmrXd4PK3LAGDqEQW6eYAS3vPevh1KYPGEzZ547eGYI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
