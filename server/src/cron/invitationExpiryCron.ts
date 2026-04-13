import cron from "node-cron";
import { expirePendingInvitations } from "../Api/invitation/invitation.repository";

const invitationExpiryCron = () => {
  // Run every hour to expire pending invitations past their expiry date
  cron.schedule("0 * * * *", async () => {
    try {
      const expired = await expirePendingInvitations();
      if (expired.length > 0) {
        console.log(`⏰ Invitation expiry cron: expired ${expired.length} invitation(s)`);
      }
    } catch (error) {
      console.error("❌ Invitation expiry cron error:", error);
    }
  });
};

export default invitationExpiryCron;
