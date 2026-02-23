import app from "./app";
import { env } from "./configs/envs";
import yearlyEmailCron from "./cron/yearlyEmailCron";

yearlyEmailCron();

app.listen(env.PORT, () => {
  console.log(`Server is running on port: ${env.PORT}`);
});
