-- AlterTable
ALTER TABLE `AppUsers`
    ADD COLUMN `twoFactorMethod` VARCHAR(191) NOT NULL DEFAULT 'email',
    ADD COLUMN `twoFactorTotpSecret` VARCHAR(191) NULL,
    ADD COLUMN `twoFactorPendingTotpSecret` VARCHAR(191) NULL;
