import app from "./app";
import { verifyEmailConfig } from "./configs/email";
import { env } from "./configs/envs";
import { supabase } from "./configs/supabase";
// import journalSuspensionCron from "./cron/journalSuspensionCron";
// import yearlyEmailCron from "./cron/yearlyEmailCron";
import invitationExpiryCron from "./cron/invitationExpiryCron";
import issueResetCron from "./cron/issueResetCron";

async function verifySupabaseBucket() {
  const bucket = env.SUPABASE_STORAGE_BUCKET || "giki";
  const { error } = await supabase.storage.getBucket(bucket);
  if (error) {
    console.warn(`⚠️  Supabase bucket '${bucket}' not found or inaccessible. Create it in Supabase dashboard.`);
  } else {
    console.log(`✅ Supabase storage bucket '${bucket}' connected`);
  }
}

// yearlyEmailCron();
// journalSuspensionCron();
invitationExpiryCron();
issueResetCron();
verifyEmailConfig();
verifySupabaseBucket();

app.listen(env.PORT, () => {
  console.log(`Server is running on port: ${env.PORT}`);
});
