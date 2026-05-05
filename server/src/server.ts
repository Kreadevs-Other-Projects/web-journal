import app from "./app";
import { env } from "./configs/envs";
import { supabase } from "./configs/supabase";

const PORT = env.PORT || process.env.PORT || 4000;

async function checkSupabaseBucket() {
  const bucket = env.SUPABASE_STORAGE_BUCKET || "giki";
  try {
    const { error } = await supabase.storage.getBucket(bucket);
    if (error) {
      console.error(
        `❌ Supabase bucket '${bucket}' not found or not accessible`,
      );
      console.error(
        `   Create it at: supabase.com → Storage → New Bucket → name: ${bucket} → Public`,
      );
    } else {
      console.log(`✅ Supabase storage '${bucket}' connected`);
    }
  } catch (e: any) {
    console.error("❌ Supabase connection failed:", e.message);
  }
}

checkSupabaseBucket();

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
