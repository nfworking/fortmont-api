-- CreateTable
CREATE TABLE `OAuthClient` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `clientSecret` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `redirectUris` JSON NOT NULL,
    `scopes` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OAuthClient_clientId_key`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OAuthCode` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `redirectUri` VARCHAR(191) NOT NULL,
    `codeChallenge` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `OAuthCode_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OAuthToken` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('ACCESS', 'REFRESH') NOT NULL DEFAULT 'ACCESS',
    `scopes` JSON NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `OAuthToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OAuthCode` ADD CONSTRAINT `OAuthCode_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `OAuthClient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthCode` ADD CONSTRAINT `OAuthCode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUsers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthToken` ADD CONSTRAINT `OAuthToken_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `OAuthClient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthToken` ADD CONSTRAINT `OAuthToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUsers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
