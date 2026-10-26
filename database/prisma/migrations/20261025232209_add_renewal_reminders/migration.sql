-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "reminderSentFor" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "renewalReminders" BOOLEAN NOT NULL DEFAULT true;
