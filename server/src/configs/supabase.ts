import { createClient } from "@supabase/supabase-js";
import { env } from "./envs";

const supabaseUrl = env.SUPABASE_URL!;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
