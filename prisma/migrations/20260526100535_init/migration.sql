-- CreateTable
CREATE TABLE `lxc` (
    `lxc_unique_id` VARCHAR(191) NOT NULL,
    `lxc_ip` VARCHAR(191) NOT NULL,
    `lxc_role` VARCHAR(191) NOT NULL,
    `lxc_status` VARCHAR(191) NOT NULL,
    `lxc_compose_status` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`lxc_unique_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
