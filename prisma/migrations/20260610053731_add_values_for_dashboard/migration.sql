-- CreateTable
CREATE TABLE `ComposeApps` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `compose_path` VARCHAR(191) NULL,
    `repo_url` VARCHAR(191) NULL,
    `port` INTEGER NULL,
    `url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `infra_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Infra` (
    `id` VARCHAR(191) NOT NULL,
    `node_name` VARCHAR(191) NOT NULL,
    `node_ip` VARCHAR(191) NOT NULL,
    `node_hostname` VARCHAR(191) NULL,
    `management_url` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `total_storage` VARCHAR(191) NULL,
    `used_storage` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ComposeApps` ADD CONSTRAINT `ComposeApps_infra_id_fkey` FOREIGN KEY (`infra_id`) REFERENCES `Infra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
