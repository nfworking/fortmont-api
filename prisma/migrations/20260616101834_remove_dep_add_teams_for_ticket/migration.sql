/*
  Warnings:

  - You are about to drop the `lxc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `registry` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `Tickets` ADD COLUMN `teamId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `lxc`;

-- DropTable
DROP TABLE `registry`;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AppUsersToTeam` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AppUsersToTeam_AB_unique`(`A`, `B`),
    INDEX `_AppUsersToTeam_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Tickets` ADD CONSTRAINT `Tickets_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AppUsersToTeam` ADD CONSTRAINT `_AppUsersToTeam_A_fkey` FOREIGN KEY (`A`) REFERENCES `AppUsers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AppUsersToTeam` ADD CONSTRAINT `_AppUsersToTeam_B_fkey` FOREIGN KEY (`B`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
