import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xyz.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'public-key';

const isConfigured = supabaseUrl !== 'https://xyz.supabase.co' && supabaseKey !== 'public-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isOfflineMode = !isConfigured;