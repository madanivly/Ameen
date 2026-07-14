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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `admins` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `investments` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `capitalDeployed` float DEFAULT NULL,
  `profitEntries` json DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `stakes` (
  `memberId` varchar(255) NOT NULL,
  `investmentId` varchar(255) NOT NULL,
  `sharePct` float DEFAULT NULL,
  PRIMARY KEY (`memberId`,`investmentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `transfers` (
  `id` varchar(255) NOT NULL,
  `adminId` varchar(255) DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `transferredAt` datetime DEFAULT NULL,
  `batchId` varchar(255) DEFAULT NULL,
  `transactionIds` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `expenses` (
  `id` varchar(255) NOT NULL,
  `description` text,
  `amount` float DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `addedBy` varchar(255) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `pins` (
  `role` varchar(255) NOT NULL,
  `pin` varchar(255) NOT NULL,
  PRIMARY KEY (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
