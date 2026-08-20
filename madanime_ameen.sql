-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 12, 2026 at 10:29 PM
-- Server version: 10.6.16-MariaDB-cll-lve
-- PHP Version: 8.1.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `madanime_ameen`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `username` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `role`, `mobile`, `whatsapp`, `password`, `username`) VALUES
('ADM001', 'Ismail Kallan', 'admin', NULL, NULL, 'admin', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `addedBy` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investments`
--

CREATE TABLE `investments` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `capitalDeployed` float DEFAULT NULL,
  `profitEntries` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`profitEntries`)),
  `status` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

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
  `shares` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `memberId`, `password`, `name`, `mobile`, `whatsapp`, `collectorName`, `profilePhoto`, `role`, `adminId`, `isCollector`, `registrationFeePaid`, `joinedAt`, `nomineeName`, `nomineeAddress`, `nomineeContact`, `nomineeRelation`, `shares`) VALUES
('ABD002', 'ABD002', '998067', 'Abdul Azeez Poongottil', '+974 33005515', '+974 33005515', 'Abdul Azeez Poongottil', 'data:image/jpeg;base64,/9j/4QMcRXhpZgAATU0AKgAAAAgACwEAAAMAAAABBywAAAEBAAMAAAABDMAAAAEPAAIAAAAFAAAAkgEQAAIAAAARAAAAmAEaAAUAAAABAAAAqgEbAAUAAAABAAAAsgEoAAMAAAABAAIAAAEyAAIAAAAUAAAAugITAAMAAAABAAEAAIdpAAQAAAABAAAAzoglAAQAAAABAAADDgAAAABPUFBPAABPUFBPIFJlbm8x', 'member', 'ABD002', 1, 0, '2026-07-22 00:00:00', 'Jumaila Abdul Azeez ', 'Poongottil, Vendallur, Irimbiliyam ', '+91 8943063207', 'Wife ', 5),
('ABU041', 'ABU041', '178318', 'Abu haneefa', '+974 30979711', '+974 30979711', 'Ismail Kallan', '/uploads/avatars/avatar_ABU041_1785610501.jpg', 'member', 'ADM001', 1, 0, '2026-08-01 00:00:00', 'Ayisha shahadiya', 'Kallayi house malayil , kadampuzha po . Malappuram', '+91 9061061740', 'Wife', 5),
('ADI010', 'ADI010', '916264', 'Adil Abdulla', '+974 70827213', '+91 9539488460', 'Mohamed Madani', NULL, 'member', 'MOH004', 0, 0, '2026-07-22 00:00:00', 'Abdulla kutty', 'Karuvarakattil (h) kumaranellur (po) 679552', '+91 9746233039', 'Father', 1),
('ADM001', NULL, NULL, 'Ismail Kallan', '+974 3320 6997', '+974 3320 6997', 'Ismail Kallan', '/uploads/avatars/avatar_ADM001_1785008616.jpg', NULL, 'ADM001', NULL, NULL, NULL, '', '', '', NULL, 5),
('AJM012', 'AJM012', '572715', 'Ajmal Roshan K', '+91 8943377660', '+91 8943377660', 'Ismail Kallan', '/uploads/avatars/avatar_AJM012_1785042453.jpg', 'member', 'ADM001', 0, 0, '2026-07-22 00:00:00', 'Abdul Kader k', 'Konnakkattil house, vadakkumpuram p.o, Edayoor, valanchery, Malappuram,Kerala ,676552', '+91 8139887660', 'Father', 1),
('ALI024', 'ALI024', '592779', 'Mohammed Rahamth Ali', '+974 31025099', '+91 9020414999', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-23 00:00:00', 'Wife', 'Chalakkudi, Thrissur', '+91 9020414999', 'Wife', 1),
('ANS033', 'ANS033', '126146', 'Ansar', '+974 70488237', '+974 70488237', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-25 00:00:00', 'Wife', 'Perinthalmanna, Vengoor', '+91 9946095042', 'Wife', 2),
('AYY042', 'AYY042', '404889', 'ayyoob parakuth', '+974 70685358', '+91 7736838964', 'Abu haneefa', NULL, 'member', '', 0, 0, '2026-08-01 00:00:00', 'Rahna', 'Parakkuth house Kondotty po', '+91 8129208029', 'Wife ', 2),
('BAS029', 'BAS029', '346215', 'Basheer Ottakath', '+91 9645711113', '+91 9645711113', '', NULL, 'member', '', 0, 0, '2026-07-25 00:00:00', 'Wifw', 'Marakkara PO, Malappuram', '+91 9645711113', 'Wife', 10),
('E. 039', 'E. 039', '575735', 'Rasheed. E. P Eratta Parambil', '+974 70982484', '+974 70982484', 'SHAMEER', NULL, 'member', '', 0, 0, '2026-07-31 00:00:00', 'Maimoona', 'Vengad P. O, Malapoueam Dt., Kerala ', '+91 9946647416', 'Wife', 1),
('FAI025', 'FAI025', '164243', 'Faizal puthuparambil', '+974 33834765', '+974 33834765', '', NULL, 'member', '', 0, 0, '2026-07-24 00:00:00', 'Sarfeena mol P', 'Puthuparambil house, Karathur', '+91 9526989998', 'Wife', 1),
('FAI040', 'FAI040', '204337', 'FAISEL PAYYILOT PUTHIYA PURAYIL', '+974 30600171', '+974 30600171', 'SHAMEER', '/uploads/avatars/avatar_FAI040_1785611207.jpg', 'member', 'SHA019', 0, 0, '2026-08-01 00:00:00', 'RAFNA SOOPI MOOPANTAKATH', 'Zahra’s  Near thannada UP School  Chala East  Pin. 670621, Kannur , Kerala ', '+974 71066883', 'Wife', 5),
('FAW032', 'FAW032', '228073', 'Fawas KP', '+974 31247101', '+974 31247101', '', NULL, 'member', '', 0, 0, '2026-07-25 00:00:00', 'Sanoobiya', 'Perinthalmanna, Vengoor', '+91 8888888888', 'Wife', 2),
('HAB028', 'HAB028', '577463', 'HABEEB RAHAMAN', '+974 55508538', '+91 9544930000', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-25 00:00:00', 'RUKIYA MOL PARUTHIKUNNAN', 'NEDUVANCHERY, KALPAKANCHERY', '+974 77708538', 'WIFE', 10),
('HAF022', 'HAF022', '434328', 'Hafsath Konna', '+974 66155719', '+974 66155719', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-23 00:00:00', 'Kids', 'Address', '+91 8888888888', 'Kid', 5),
('HAR030', 'HAR030', '676909', 'Haris KP', '+974 55342869', '+974 55342869', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-25 00:00:00', 'Shareefa', 'Perinthalmanna, Vengoor', '+91 9895589833', 'Wife', 5),
('HIJ017', 'HIJ017', '861537', 'Hijas.vp', '+974 77522600', '+974 77522600', 'Musthafa Ks', NULL, 'member', 'MUS008', 0, 0, '2026-07-23 00:00:00', 'Moidu mp', 'Thiruvalluvar', '+974 77522600', 'Father', 1),
('IBR011', 'IBR011', '242203', 'Ibrahim Kallingal', '+974 55928442', '+974 55928442', 'Mohamed Madani', NULL, 'member', '', 0, 0, '2026-07-22 00:00:00', 'Kadheeja Kallingal', 'Kallingal House , Naduvattam po, kuttippuram', '+91 9745303841', 'Mother', 1),
('MOH004', 'MOH004', '615064', 'Mohamed Madani', '+974 77441991', '+974 77441991', 'Mohamed Madani', '/uploads/avatars/avatar_MOH004_1784791078.png', 'member', 'MOH004', 1, 0, '2026-07-22 00:00:00', 'Faseela', 'Thayam Palli House, Painkannur Po, Malappuram Dt, 679571', '+91 9539992918', 'Wife', 1),
('MOH005', 'MOH005', '595565', 'MOHAMMED FAWAS THARAKKAL', '+974 66204220', '+974 66204220', 'Abdul Azeez Poongottil', NULL, 'member', 'ABD002', 0, 0, '2026-07-22 00:00:00', 'Abdul rahim', 'PUTHANATHANI, KALPAKANCHERY P.O,', '+974 77121711', 'Friend', 1),
('MOH006', 'MOH006', '618275', 'Mohamed Shakkeer Kallidumbil', '+974 31233662', '+974 31233662', 'Mohamed Shakkeer Kallidumbil', '/uploads/avatars/avatar_MOH006_1784985422.png', 'member', 'MOH006', 1, 0, '2026-07-22 00:00:00', 'Nasila VN', 'Kodungallur, Thrissur', '+91 8891638042', 'Wife', 2),
('MOH015', 'MOH015', '775137', 'mohammed sajid', '+974 77315866', '+974 77315866', 'Abdul Azeez Poongottil', '/uploads/avatars/avatar_MOH015_1784836405.jpg', 'member', 'ABD002', 0, 0, '2026-07-23 00:00:00', 'Ayshath lubaba ka', 'Rahmath manzil.po muttathody', '+974 50372450', 'Wife', 1),
('MOH018', 'MOH018', '616632', 'Mohamed Hafeez PADICHAKARA PARAMBIL', '+974 39995355', '+974 70415639', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-23 00:00:00', 'Raseena Mohamed Hafeez PADINCHAKARA PARAMBIL ', 'Padichakara PARAMBIL Kondoorkara (p.o) Parappuram Pattambi Palakkad  ', '+974 39995399', 'Wife ', 5),
('MOH020', 'MOH020', '532945', 'MOHAMMED BASHEER VP', '+974 55079659', '+974 55079659', 'Mohamed Madani', '/uploads/avatars/avatar_MOH020_1784875408.jpg', 'member', 'MOH004', 0, 0, '2026-07-23 00:00:00', 'ASNATH KP', 'Vadakkepeediyekkal (h),Karekkad(p.o),kadampuzha (via)', '+91 9995600729', 'Wife', 1),
('MUH027', 'MUH027', '686584', 'Muhammad Riyas Paarakkal', '+974 77999864', '+974 77999864', 'SHAMEER', NULL, 'member', 'SHA019', 0, 0, '2026-07-24 00:00:00', 'Abidha', 'Parakkal House, Kottappuram, Palakkad', '+91 7306617994', 'Wife', 1),
('MUH035', 'MUH035', '441412', 'MUHAMMED UNAIS.T', '+974 77641512', '+974 77641512', 'Abdul Azeez Poongottil', '/uploads/avatars/avatar_MUH035_1785095707.jpg', 'member', 'ABD002', 0, 0, '2026-07-25 00:00:00', 'Safiya p', 'Thurumbath house, pookkattiri, edayur post,malappuram, kerala', '+91 7907437411', 'Mother', 2),
('MUJ015', 'MUJ015', '637564', 'Mujeeb kadavath Parambil', '+974 33140513', '+974 33140513', 'SHAMEER', NULL, 'member', 'SHA019', 0, 0, '2026-07-23 00:00:00', 'Fousiya kadavath parambil', 'Irumbiliyam. Vendalloor', '+974 33140513', 'Fousia. Kadavath parambil ', 2),
('MUS008', 'MUS008', '481981', 'Musthafa Ks', '+974 55863223', '+974 55863223', 'Musthafa Ks', '/uploads/avatars/avatar_MUS008_1784873272.jpg', 'member', 'MUS008', 1, 0, '2026-07-22 00:00:00', 'Basariya Mohamed Mustafa', 'Kattayan house, ongallur via pattambi, dist - palakkad, 679313', '+91 8113932359', 'Wife', 4),
('NIH037', 'NIH037', '300352', 'Nihad Mullantakam', '+974 33458464', '+974 33458464', 'Abdul Azeez Poongottil', NULL, 'member', 'ABD002', 0, 0, '2026-07-27 00:00:00', 'Hida Fathima', 'Doha, Qatar', '+974 33379493', 'Wife', 2),
('NIZ043', 'NIZ043', '109095', 'NIZAR MAMPATTA', '+974 55495645', '+974 31132144', 'SHAMEER', '/uploads/avatars/avatar_NIZ043_1785874791.jpg', 'member', 'SHA019', 0, 0, '2026-08-04 00:00:00', 'SALEENA NISAR', 'MAMPATTA HOUSE, VENDALLUR, PO. IRIMBILIYAM, MALAPPURAMDT, PIN CODE :679572', '+91 6238859538', 'WIFE', 5),
('NOU013', 'NOU013', '651028', 'Noushad Pullattil', '+974 70244707', '+91 9745555516', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-23 00:00:00', 'SANEERA Pulikkathody ', 'Near Police Station Kadampuzha', '+91 8138875274', 'Wife', 5),
('RIY031', 'RIY031', '690876', 'Riyas KP', '+974 77382764', '+974 77382764', '', NULL, 'member', '', 0, 0, '2026-07-25 00:00:00', 'Jasmin', 'Perinthalmanna, Vengoor', '+91 9605327500', 'Wife', 5),
('RIY043', 'RIY043', '944124', 'RIYAS ABDUL KADER', '+974 70149431', '+974 70149431', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-08-04 00:00:00', 'Anseeera Valiyakath', 'KANDAMKULAM HOUSE ENGINEER ROAD', '+974 70315656', 'Wife', 5),
('SAB014', 'SAB014', '113367', 'Sabeel vadakkan', '+974 50477453', '+974 50477453', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-23 00:00:00', 'Muhsina sabeel ', 'Vadakkan house , Kooriyad, Indianoor po, Malappuram DT, 676503-pin', '+974 50621187', 'Wife', 5),
('SAL038', 'SAL038', '151989', 'Saleem karimban kandathil', '+974 77887738', '+974 77887738', 'Mohamed Madani', '/uploads/avatars/avatar_SAL038_1785442677.webp', 'member', 'MOH004', 0, 0, '2026-07-30 00:00:00', 'Asmabi k', 'Kodasseri (h) thalkkadathoor', '+91 8606590520', 'Wife', 1),
('SAW034', 'SAW034', '636958', 'SAVADH KODAKKATTU VALAPPIL', '+974 71240433', '+974 71240433', '', '/uploads/avatars/avatar_SAW034_1785004874.jpg', 'member', '', 0, 0, '2026-07-25 00:00:00', 'Shabnam Konnakattil', 'Konnakkattil house,Vadakkumpuram PO,Valanchery,676552', '+918943617517,9995900586', 'Wife', 1),
('SHA009', 'SHA009', '799193', 'Shafi Chalil Arudi Parambil', '+974 70411342', '+974 70411342', '', NULL, 'member', '', 0, 0, '2026-07-22 00:00:00', 'Sahla', 'Chalil House Po . Palapetty Malappuram.Pin:679579', '+91 8075899314', 'Wife ', 1),
('SHA019', 'SHA019', '383926', 'SHAMEER', '+974 77221200', '+974 66645566', 'SHAMEER', NULL, 'member', 'SHA019', 1, 0, '2026-07-23 00:00:00', 'KHADEEJA', 'KOLAMBAN', '+91 7510640126', 'WIFE', 2),
('SHA021', 'SHA021', '297509', 'Shaji KP', '+974 55197308', '+974 55197308', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-23 00:00:00', 'Wife', 'Address', '+91 7034508936', 'Wife', 5),
('SHA026', 'SHA026', '454320', 'Shamnadu KP', '+974 55182235', '+974 55182235', 'Ismail Kallan', '/uploads/avatars/avatar_SHA026_1786050637.jpg', 'member', 'ADM001', 0, 0, '2026-07-24 00:00:00', 'Umaira PP', 'Puthan Peediyakkal', '+91 9744721241', 'Wife', 1),
('SHO003', 'SHO003', '217126', 'SHOUKKATHALI PARAYULLATHIL', '+974 50435847', '+974 50435847', 'Abdul Azeez Poongottil', '/uploads/avatars/avatar_SHO003_1784844061.jpg', 'member', 'ABD002', 0, 0, '2026-07-22 00:00:00', 'ASMA SHOUKKATHALI ', 'PERAMBRA, CALICUT', '+91 8075858366', 'WIFE ', 5),
('SUL036', 'SUL036', '980721', 'Sulaiman', '+974 55295016', '+974 55295016', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-26 00:00:00', 'Sa', 'Kasar kerala ', '+974 55295016', 'Waif ', 1),
('UMU023', 'UMU023', '437418', 'Umul Affai Co.', '+974 30040807', '+974 30040807', 'Ismail Kallan', NULL, 'member', 'ADM001', 0, 0, '2026-07-23 00:00:00', 'Ismail Kallan', 'Kallan House, PO Marakkara, AC Nirapp, Malappauram', '+91 8547001775', 'Prtner', 5);

-- --------------------------------------------------------

--
-- Table structure for table `pins`
--

CREATE TABLE `pins` (
  `role` varchar(255) NOT NULL,
  `pin` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stakes`
--

CREATE TABLE `stakes` (
  `memberId` varchar(255) NOT NULL,
  `investmentId` varchar(255) NOT NULL,
  `sharePct` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `key` varchar(50) NOT NULL,
  `value` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`key`, `value`) VALUES
('terms_and_conditions', 'Welcome to the GRT Portal. Please review our terms and conditions here. Edit this text directly from your Admin Dashboard.');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

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
  `collectorId` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `memberId`, `adminId`, `type`, `amount`, `monthKey`, `paidAt`, `receiptNo`, `status`, `transferredToTreasurer`, `transferBatchId`, `approved`, `collectorName`, `collectorId`) VALUES
('tx_1gjmbujx', 'FAI040', 'SHA019', 'monthly', 500, '2026-07', '2026-08-01 19:08:22', 'R-2026-07-2845-0', 'completed', 1, NULL, 1, 'SHAMEER', 'SHA019'),
('tx_2ibs8jc4', 'IBR011', 'MOH004', 'monthly', 100, '2026-07', '2026-08-07 13:31:47', 'R-2026-07-7495-0', 'completed', 1, NULL, 1, 'Mohamed Madani', ''),
('tx_2n4t6wh4', 'MOH006', 'MOH006', 'monthly', 200, '2026-07', '2026-07-24 07:57:12', 'R-2026-07-2717-0', 'completed', 1, NULL, 1, 'Mohamed Shakkeer Kallidumbil', 'MOH006'),
('tx_2umx1vay', 'MOH004', 'MOH004', 'monthly', 100, '2026-07', '2026-07-22 18:44:40', 'R-2026-07-0603-0', 'completed', 1, NULL, 1, 'Mohamed Madani', 'MOH004'),
('tx_2z2woav5', 'E. 039', 'SHA019', 'monthly', 100, '2026-08', '2026-07-31 17:16:54', 'R-2026-08-4017-0', 'completed', 1, NULL, 1, 'SHAMEER', ''),
('tx_2zijkbna', 'ADI010', 'MOH004', 'monthly', 100, '2026-07', '2026-07-23 03:52:28', 'R-2026-07-8510-0', 'completed', 1, NULL, 1, 'Mohamed Madani', 'MOH004'),
('tx_3housc1q', 'NIZ043', 'SHA019', 'monthly', 500, '2026-06', '2026-08-10 17:06:33', 'R-2026-06-3020-0', 'Held by Collector (SHAMEER)', 0, NULL, 0, NULL, NULL),
('tx_3jhdito0', 'MOH004', 'MOH004', 'monthly', 100, '2026-08', '2026-08-07 13:32:55', 'R-2026-08-5499-0', 'completed', 1, NULL, 1, 'Mohamed Madani', 'MOH004'),
('tx_3kpd24gf', 'MUJ015', 'SHA019', 'monthly', 200, '2026-08', '2026-08-01 18:19:12', 'R-2026-08-2096-0', 'completed', 1, NULL, 1, 'SHAMEER', 'SHA019'),
('tx_42ctxdcb', 'NIH037', 'ABD002', 'monthly', 200, '2026-07', '2026-07-29 06:33:21', 'R-2026-07-1109-0', 'completed', 1, NULL, 1, 'Abdul Azeez Poongottil', 'ABD002'),
('tx_45rtfawr', 'HAB028', 'ADM001', 'monthly', 1000, '2026-08', '2026-08-05 16:48:25', 'R-2026-08-5522-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_4m8eiucv', 'SHA019', 'SHA019', 'monthly', 200, '2026-08', '2026-08-07 11:01:22', 'R-2026-08-2504-0', 'completed', 1, NULL, 1, 'SHAMEER', 'SHA019'),
('tx_5e21netx', 'IBR011', 'MOH004', 'monthly', 100, '2026-08', '2026-08-07 13:31:40', 'R-2026-08-0813-0', 'completed', 1, NULL, 1, 'Mohamed Madani', ''),
('tx_602da7mv', 'MOH006', 'MOH006', 'monthly', 200, '2026-08', '2026-08-05 08:14:01', 'R-2026-08-1581-0', 'completed', 1, NULL, 1, 'Mohamed Shakkeer Kallidumbil', 'MOH006'),
('tx_6ha3doww', 'ADM001', 'ADM001', 'monthly', 500, '2026-07', '2026-07-23 20:19:26', 'R-2026-07-6084-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_77kv55m2', 'ABU041', 'ADM001', 'monthly', 500, '2026-07', '2026-08-05 16:43:31', 'R-2026-07-1414-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_7fdjga64', 'SUL036', 'ADM001', 'monthly', 100, '2026-07', '2026-07-31 11:24:06', 'R-2026-07-6080-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_8glulu0i', 'AJM012', 'ADM001', 'monthly', 100, '2026-08', '2026-08-04 18:09:59', 'R-2026-08-9403-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_8mbamtjv', 'SAB014', 'ADM001', 'monthly', 500, '2026-07', '2026-07-23 20:15:45', 'R-2026-07-5039-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_9g3aylfw', 'RIY043', 'ADM001', 'monthly', 500, '2026-07', '2026-08-04 20:12:09', 'R-2026-07-9935-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_9q2oyta6', 'MOH005', 'ABD002', 'monthly', 500, '2026-07', '2026-07-24 09:39:02', 'R-2026-07-2982-0', 'completed', 1, NULL, 1, 'Abdul Azeez Poongottil', 'ABD002'),
('tx_a7e3yl7v', 'ABU041', 'ADM001', 'monthly', 500, '2026-08', '2026-08-01 18:51:23', 'R-2026-08-3838-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_bu1j6ezy', 'HAF022', 'ADM001', 'monthly', 500, '2026-07', '2026-07-23 20:13:57', 'R-2026-07-7090-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_dr2szlvo', 'MUH027', 'SHA019', 'monthly', 100, '2026-08', '2026-08-07 10:58:57', 'R-2026-08-7552-0', 'completed', 1, NULL, 1, 'SHAMEER', 'SHA019'),
('tx_dwecfa8b', 'MUS008', 'MUS008', 'monthly', 400, '2026-07', '2026-07-24 09:52:02', 'R-2026-07-2922-0', 'completed', 1, NULL, 1, 'Musthafa Ks', 'MUS008'),
('tx_eeylno4l', 'MOH018', 'ADM001', 'monthly', 500, '2026-08', '2026-08-07 12:57:18', 'R-2026-08-8297-0', 'Held by Collector (Ismail Kallan)', 0, NULL, 0, NULL, NULL),
('tx_i17wte2y', 'NOU013', 'ADM001', 'monthly', 500, '2026-07', '2026-07-23 19:51:09', 'R-2026-07-9198-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_j9rkogi5', 'SHA026', 'ADM001', 'monthly', 100, '2026-07', '2026-07-24 14:05:05', 'R-2026-07-5458-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_k44irmuu', 'SHA021', 'ADM001', 'monthly', 500, '2026-08', '2026-07-23 20:17:03', 'R-2026-08-3424-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_ku65aoh0', 'HAR030', 'ADM001', 'monthly', 500, '2026-07', '2026-07-31 16:35:47', 'R-2026-07-7309-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_ll8q3bek', 'SHO003', 'ABD002', 'monthly', 500, '2026-07', '2026-07-24 07:06:42', 'R-2026-07-2486-0', 'completed', 1, NULL, 1, 'Abdul Azeez Poongottil', 'ABD002'),
('tx_lxo8j1ac', 'AJM012', 'ADM001', 'monthly', 100, '2026-07', '2026-07-23 20:41:50', 'R-2026-07-0451-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_n6rlo7gt', 'MUH035', 'ABD002', 'monthly', 200, '2026-08', '2026-08-05 07:41:20', 'R-2026-08-0950-0', 'Held by Collector (Abdul Azeez Poongottil)', 0, NULL, 0, NULL, NULL),
('tx_nj0o23tx', 'RIY043', 'ADM001', 'monthly', 500, '2026-08', '2026-08-04 20:13:13', 'R-2026-08-3650-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_ntzsr824', 'NIZ043', 'SHA019', 'monthly', 500, '2026-08', '2026-08-10 16:09:15', 'R-2026-08-5964-0', 'Held by Collector (SHAMEER)', 0, NULL, 0, NULL, NULL),
('tx_oggtombx', 'HAR030', 'ADM001', 'monthly', 500, '2026-08', '2026-07-31 16:38:16', 'R-2026-08-6216-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_or2ubz3l', 'ABD002', 'ABD002', 'monthly', 500, '2026-07', '2026-07-23 00:23:38', 'R-2026-07-8588-0', 'completed', 1, NULL, 1, 'Abdul Azeez Poongottil', 'ABD002'),
('tx_ovohoqk5', 'MUH027', 'SHA019', 'monthly', 100, '2026-07', '2026-07-24 20:55:54', 'R-2026-07-4256-0', 'completed', 1, NULL, 1, 'SHAMEER', 'SHA019'),
('tx_p76l48gq', 'HIJ017', 'MUS008', 'monthly', 100, '2026-07', '2026-07-24 10:28:47', 'R-2026-07-7367-0', 'completed', 1, NULL, 1, 'Musthafa Ks', 'MUS008'),
('tx_qretwayd', 'SAB014', 'ADM001', 'monthly', 500, '2026-08', '2026-08-04 18:10:29', 'R-2026-08-9418-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_qxll9q63', 'HAF022', 'ADM001', 'monthly', 500, '2026-08', '2026-08-04 18:10:09', 'R-2026-08-9586-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_rf1lr5pc', 'SHO003', 'ABD002', 'monthly', 500, '2026-08', '2026-08-02 17:42:42', 'R-2026-08-2939-0', 'completed', 1, NULL, 1, 'Abdul Azeez Poongottil', 'ABD002'),
('tx_rgqjvkp4', 'NIZ043', 'SHA019', 'monthly', 500, '2026-07', '2026-08-10 16:07:42', 'R-2026-07-2024-0', 'Held by Collector (SHAMEER)', 0, NULL, 0, NULL, NULL),
('tx_rsgywbqd', 'UMU023', 'ADM001', 'monthly', 500, '2026-07', '2026-07-23 20:28:05', 'R-2026-07-5260-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_sgda1y36', 'SHA021', 'ADM001', 'monthly', 500, '2026-07', '2026-07-23 20:07:38', 'R-2026-07-8579-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_sjvjml7d', 'MOH015', 'ABD002', 'monthly', 100, '2026-07', '2026-07-24 09:12:35', 'R-2026-07-5511-0', 'completed', 1, NULL, 1, 'Abdul Azeez Poongottil', 'ABD002'),
('tx_t1e6fmxj', 'SHA019', 'SHA019', 'monthly', 200, '2026-07', '2026-07-23 16:35:53', 'R-2026-07-3704-0', 'completed', 1, NULL, 1, 'SHAMEER', 'SHA019'),
('tx_taedq82g', 'E. 039', 'SHA019', 'monthly', 100, '2026-07', '2026-07-31 12:01:56', 'R-2026-07-6790-0', 'completed', 1, NULL, 1, 'SHAMEER', ''),
('tx_uixds37m', 'SHA026', 'ADM001', 'monthly', 100, '2026-08', '2026-08-05 16:44:21', 'R-2026-08-1448-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_uzpdgsb2', 'ADI010', 'MOH004', 'monthly', 100, '2026-08', '2026-08-01 15:41:30', 'R-2026-08-0967-0', 'completed', 1, NULL, 1, 'Mohamed Madani', 'MOH004'),
('tx_v85tcb0w', 'MOH020', 'MOH004', 'monthly', 100, '2026-07', '2026-08-03 07:39:20', 'R-2026-07-0769-0', 'completed', 1, NULL, 1, 'Mohamed Madani', 'MOH004'),
('tx_w1bwbsdr', 'MOH018', 'ADM001', 'monthly', 500, '2026-07', '2026-08-04 19:04:27', 'R-2026-07-7768-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_wmh7tkpd', 'ALI024', 'ADM001', 'monthly', 100, '2026-07', '2026-07-23 20:39:40', 'R-2026-07-0418-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_x9s2z59m', 'HAB028', 'ADM001', 'monthly', 1000, '2026-07', '2026-08-05 16:48:34', 'R-2026-07-4404-0', 'completed', 1, NULL, 1, 'Ismail Kallan', 'ADM001'),
('tx_yel1jfow', 'NIZ043', 'SHA019', 'monthly', 500, '2026-10', '2026-08-10 16:09:20', 'R-2026-10-0094-0', 'Held by Collector (SHAMEER)', 0, NULL, 0, NULL, NULL),
('tx_yp1kb710', 'MUH035', 'ABD002', 'monthly', 200, '2026-07', '2026-08-04 10:51:18', 'R-2026-07-8509-0', 'completed', 1, NULL, 1, 'Abdul Azeez Poongottil', 'ABD002'),
('tx_zqmcw4kq', 'SAL038', 'MOH004', 'monthly', 100, '2026-07', '2026-08-03 07:39:31', 'R-2026-07-1982-0', 'completed', 1, NULL, 1, 'Mohamed Madani', 'MOH004');

-- --------------------------------------------------------

--
-- Table structure for table `transfers`
--

CREATE TABLE `transfers` (
  `id` varchar(255) NOT NULL,
  `adminId` varchar(255) DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `transferredAt` datetime DEFAULT NULL,
  `batchId` varchar(255) DEFAULT NULL,
  `transactionIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`transactionIds`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `investments`
--
ALTER TABLE `investments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pins`
--
ALTER TABLE `pins`
  ADD PRIMARY KEY (`role`);

--
-- Indexes for table `stakes`
--
ALTER TABLE `stakes`
  ADD PRIMARY KEY (`memberId`,`investmentId`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transfers`
--
ALTER TABLE `transfers`
  ADD PRIMARY KEY (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
