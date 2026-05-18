/*
  Warnings:

  - You are about to drop the column `profileImageUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `alerts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "profileImageUrl",
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3);

-- DropTable
DROP TABLE "alerts";
