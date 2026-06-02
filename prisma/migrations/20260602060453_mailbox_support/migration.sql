-- CreateTable
CREATE TABLE `UserMailbox` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `encryptedPassword` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `provider` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserMailbox_userId_email_key`(`userId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserMailbox` ADD CONSTRAINT `UserMailbox_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUsers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
