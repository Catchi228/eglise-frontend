-- =============================================================================
-- Schéma MariaDB pour le site Convention Baptiste du Togo
-- Idempotent : peut être ré-exécuté sans erreur.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `eglise`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `eglise`;

-- -----------------------------------------------------------------------------
-- Utilisateurs et sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  `is_principal`  TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id`         CHAR(64) NOT NULL,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Annonces
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id`            VARCHAR(40) NOT NULL,
  `category`      ENUM('Événement','Recherche','Autre') NOT NULL DEFAULT 'Autre',
  `status`        ENUM('Publiée','Désactivée') NOT NULL DEFAULT 'Publiée',
  `title`         VARCHAR(255) NOT NULL,
  `body`          TEXT NOT NULL,
  `city`          VARCHAR(120) DEFAULT NULL,
  `start_at`      VARCHAR(20) DEFAULT NULL,
  `end_at`        VARCHAR(20) DEFAULT NULL,
  `contact_email` VARCHAR(190) DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_announcements_status` (`status`),
  KEY `idx_announcements_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `announcement_images` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `announcement_id` VARCHAR(40) NOT NULL,
  `path`            VARCHAR(500) NOT NULL,
  `position`        INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ann_img_ann` (`announcement_id`, `position`),
  CONSTRAINT `fk_ann_img_ann`
    FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Cours
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `id`          VARCHAR(40) NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `content`     LONGTEXT DEFAULT NULL COMMENT 'JSON : [{heading, body}]',
  `status`      ENUM('À venir','En cours','Terminé') NOT NULL DEFAULT 'À venir',
  `start_at`    VARCHAR(20) NOT NULL,
  `end_at`      VARCHAR(20) NOT NULL,
  `time`        VARCHAR(10) NOT NULL DEFAULT '00:00',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_courses_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_tags` (
  `course_id` VARCHAR(40) NOT NULL,
  `tag`       VARCHAR(80)  NOT NULL,
  PRIMARY KEY (`course_id`, `tag`),
  CONSTRAINT `fk_course_tags_course`
    FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_sections` (
  `id`           VARCHAR(40) NOT NULL,
  `course_id`    VARCHAR(40) NOT NULL,
  `title`        VARCHAR(255) NOT NULL,
  `duration_min` INT NOT NULL DEFAULT 0,
  `position`     INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_sections_course` (`course_id`, `position`),
  CONSTRAINT `fk_sections_course`
    FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_pdfs` (
  `id`         VARCHAR(40) NOT NULL,
  `course_id`  VARCHAR(40) NOT NULL,
  `name`       VARCHAR(255) NOT NULL,
  `path`       VARCHAR(500) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pdfs_course` (`course_id`),
  CONSTRAINT `fk_pdfs_course`
    FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- QCM
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcm` (
  `id`             VARCHAR(40) NOT NULL,
  `course_id`      VARCHAR(40) NOT NULL,
  `title`          VARCHAR(255) NOT NULL,
  `question_count` INT NOT NULL DEFAULT 0,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qcm_course` (`course_id`),
  CONSTRAINT `fk_qcm_course`
    FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qcm_questions` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `qcm_id`        VARCHAR(40) NOT NULL,
  `prompt`        TEXT NOT NULL,
  `choices`       JSON NOT NULL,
  `correct_index` INT NOT NULL DEFAULT 0,
  `position`      INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_qq_qcm` (`qcm_id`, `position`),
  CONSTRAINT `fk_qq_qcm`
    FOREIGN KEY (`qcm_id`) REFERENCES `qcm` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Messages (boîte de réception admin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id`         VARCHAR(40) NOT NULL,
  `from_email` VARCHAR(190) NOT NULL,
  `subject`    VARCHAR(255) NOT NULL,
  `body`       TEXT NOT NULL,
  `status`     ENUM('nouveau','lu','répondu') NOT NULL DEFAULT 'nouveau',
  `course_ref` VARCHAR(40) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_status` (`status`),
  KEY `idx_messages_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Activité & notifications admin
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity` (
  `id`    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`  VARCHAR(60) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `ts`    BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_activity_ts` (`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `text`    VARCHAR(500) NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `ts`      BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_ts` (`ts`),
  KEY `idx_notif_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Paramètres globaux (clé/valeur) : logo, email principal, etc.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `key`   VARCHAR(80) NOT NULL,
  `value` TEXT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Présence en ligne
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `presence` (
  `email`     VARCHAR(190) NOT NULL,
  `role`      ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  `last_seen` BIGINT NOT NULL,
  PRIMARY KEY (`email`),
  KEY `idx_presence_last_seen` (`last_seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Demandes d'annonces (soumission publique, modération admin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcement_requests` (
  `id`             VARCHAR(40) NOT NULL,
  `category`       ENUM('Événement','Recherche','Autre') NOT NULL DEFAULT 'Autre',
  `title`          VARCHAR(255) NOT NULL,
  `body`           TEXT NOT NULL,
  `city`           VARCHAR(120) NOT NULL,
  `start_at`       VARCHAR(20) DEFAULT NULL,
  `end_at`         VARCHAR(20) DEFAULT NULL,
  `contact_email`  VARCHAR(190) DEFAULT NULL,
  `contact_phone`  VARCHAR(20) DEFAULT NULL,
  `status`         ENUM('en_attente','traitée') NOT NULL DEFAULT 'en_attente',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ann_req_status` (`status`),
  KEY `idx_ann_req_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Notes personnelles par utilisateur et cours
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_notes` (
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `course_id`  VARCHAR(40) NOT NULL,
  `body`       TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `course_id`),
  CONSTRAINT `fk_notes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tentatives QCM (performances utilisateur)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcm_attempts` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `qcm_id`     VARCHAR(40) NOT NULL,
  `score`      INT NOT NULL,
  `total`      INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qcm_attempts_user` (`user_id`, `created_at`),
  CONSTRAINT `fk_attempts_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_attempts_qcm`
    FOREIGN KEY (`qcm_id`) REFERENCES `qcm` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
