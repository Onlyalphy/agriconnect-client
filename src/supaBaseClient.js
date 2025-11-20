import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('Environment Variables Check:');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!SUPABASE_ANON_KEY);
console.log('SUPABASE_ANON_KEY length:', SUPABASE_ANON_KEY?.length);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials!');
  throw new Error('Missing Supabase environment variables!');
}

if (!SUPABASE_URL.startsWith('https://')) {
  console.error('Invalid Supabase URL format!');
  throw new Error('Supabase URL must start with https://');
}

console.log('Supabase client initialized successfully');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);