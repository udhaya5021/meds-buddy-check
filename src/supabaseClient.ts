import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://nxrkeeizhfdctnnldxdr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmtlZWl6aGZkY3RubmxkeGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjAzMjUsImV4cCI6MjA2NTk5NjMyNX0.ZNwKR7OS_jsKzYwB5r0k9xG-QwEgOTPtAQ7cIScjAL4'; // replace with actual key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);