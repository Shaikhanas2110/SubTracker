import cron from "node-cron";
import User from "../models/User.js";
import transporter from "../config/mailer.js";

const startScheduler = () => {
  // Runs every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("🔔 Running reminder job...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Find users who have reminders enabled
      const users = await User.find({
        "preferences.emailReminders": true,
      });

      for (const user of users) {
        const reminderDays = user.preferences.reminderDays || 2; // Default to 2 if missing

        const upcomingDate = new Date(today);
        upcomingDate.setDate(today.getDate() + reminderDays);

        let reminderSentThisRun = false;

        for (const sub of user.subscriptions) {
          if (!sub.isActive) continue; // Skip inactive subs

          if (
            sub.nextPaymentDate >= today &&
            sub.nextPaymentDate <= upcomingDate
          ) {
            // Send reminder email
            await transporter.sendMail({
              from: `"Subscription Tracker" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: `Upcoming Payment: ${sub.serviceName}`,
              text: `Hi ${user.name},\n\nYour subscription for ${
                sub.serviceName
              } is due on ${sub.nextPaymentDate.toDateString()}.\n\nThank you!`,
            });

            console.log(
              `✅ Reminder sent to ${user.email} for ${sub.serviceName}`
            );
            reminderSentThisRun = true;
          }
        }

        if (reminderSentThisRun) {
          await user.save();
        }
      }

      console.log("🔔 Reminder job finished");
    } catch (err) {
      console.error("❌ Reminder job error:", err.message);
    }
  });
};

export default startScheduler;
