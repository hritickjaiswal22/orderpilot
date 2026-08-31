/*
  Warnings:

  - You are about to drop the column `transaction_id` on the `refunds` table. All the data in the column will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_fkey";

-- DropIndex
DROP INDEX "refunds_transaction_id_idx";

-- AlterTable
ALTER TABLE "refunds" DROP COLUMN "transaction_id";

-- DropTable
DROP TABLE "transactions";

-- DropEnum
DROP TYPE "transaction_status";
