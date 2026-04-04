import app from "./app";
import { env } from "./configs/envs";
import journalSuspensionCron from "./cron/journalSuspensionCron";
import yearlyEmailCron from "./cron/yearlyEmailCron";
import invitationExpiryCron from "./cron/invitationExpiryCron";
import issueResetCron from "./cron/issueResetCron";

yearlyEmailCron();
journalSuspensionCron();
invitationExpiryCron();
issueResetCron();

app.listen(env.PORT, () => {
  console.log(`Server is running on port: ${env.PORT}`);
});
