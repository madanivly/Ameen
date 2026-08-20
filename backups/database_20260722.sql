

CREATE TABLE `admins` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `admins` VALUES ('ADM001', 'Ismail Kallan', 'admin', NULL, NULL, 'admin', 'admin');


CREATE TABLE `expenses` (
  `id` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `addedBy` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `investments` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `capitalDeployed` float DEFAULT NULL,
  `profitEntries` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`profitEntries`)),
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `members` (
  `id` varchar(255) NOT NULL,
  `memberId` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `collectorName` varchar(255) DEFAULT NULL,
  `profilePhoto` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `adminId` varchar(255) DEFAULT NULL,
  `isCollector` tinyint(1) DEFAULT NULL,
  `registrationFeePaid` tinyint(1) DEFAULT NULL,
  `joinedAt` datetime DEFAULT NULL,
  `nomineeName` varchar(255) DEFAULT NULL,
  `nomineeAddress` varchar(255) DEFAULT NULL,
  `nomineeContact` varchar(255) DEFAULT NULL,
  `nomineeRelation` varchar(255) DEFAULT NULL,
  `shares` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `members` VALUES ('ABD002', 'ABD002', '998067', 'Abdul Azeez Poongottil', '+974 33005515', '+974 33005515', '', NULL, 'member', '', '0', '0', '2026-07-22 00:00:00', 'Jumaila Abdul Azeez ', 'Poongottil, Vendallur, Irimbiliyam ', '+91 8943063207', 'Wife ', '5'), ('ADM001', NULL, NULL, 'Ismail Kallan', '+974 3320 6997', '+974 3320 6997', 'Ismail Kallan', NULL, NULL, 'ADM001', NULL, NULL, NULL, '', '', '', NULL, '1');


CREATE TABLE `pins` (
  `role` varchar(255) NOT NULL,
  `pin` varchar(255) NOT NULL,
  PRIMARY KEY (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `stakes` (
  `memberId` varchar(255) NOT NULL,
  `investmentId` varchar(255) NOT NULL,
  `sharePct` float DEFAULT NULL,
  PRIMARY KEY (`memberId`,`investmentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `system_settings` (
  `key` varchar(50) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

INSERT INTO `system_settings` VALUES ('terms_and_conditions', 'Welcome to the GRT Portal. Please review our terms and conditions here. Edit this text directly from your Admin Dashboard.');


CREATE TABLE `transactions` (
  `id` varchar(255) NOT NULL,
  `memberId` varchar(255) DEFAULT NULL,
  `adminId` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `monthKey` varchar(255) DEFAULT NULL,
  `paidAt` datetime DEFAULT NULL,
  `receiptNo` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `transferredToTreasurer` tinyint(1) DEFAULT NULL,
  `transferBatchId` varchar(255) DEFAULT NULL,
  `approved` tinyint(1) DEFAULT NULL,
  `collectorName` varchar(255) DEFAULT NULL,
  `collectorId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `transfers` (
  `id` varchar(255) NOT NULL,
  `adminId` varchar(255) DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `transferredAt` datetime DEFAULT NULL,
  `batchId` varchar(255) DEFAULT NULL,
  `transactionIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`transactionIds`)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

