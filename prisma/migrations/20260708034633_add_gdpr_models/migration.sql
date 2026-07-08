-- DropForeignKey
ALTER TABLE `Notifications` DROP FOREIGN KEY `Notifications_userId_fkey`;

-- DropIndex
DROP INDEX `Notifications_userId_fkey` ON `Notifications`;

-- AlterTable
ALTER TABLE `Notifications` MODIFY `userId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUsers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
