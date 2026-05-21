-- =============================================================================
-- Schéma PostgreSQL (Supabase) pour le site Convention Baptiste du Togo
-- Idempotent : peut être ré-exécuté sans erreur.
-- =============================================================================

-- Types ENUM
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_category AS ENUM ('Événement', 'Recherche', 'Autre');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_status AS ENUM ('Publiée', 'Désactivée');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('À venir', 'En cours', 'Terminé');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('nouveau', 'lu', 'répondu');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_request_status AS ENUM ('en_attente', 'traitée');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Utilisateurs et sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'USER',
  is_principal  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS sessions (
  id         CHAR(64) PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

-- -----------------------------------------------------------------------------
-- Annonces
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id            VARCHAR(40) PRIMARY KEY,
  category      announcement_category NOT NULL DEFAULT 'Autre',
  status        announcement_status NOT NULL DEFAULT 'Publiée',
  title         VARCHAR(255) NOT NULL,
  body          TEXT NOT NULL,
  city          VARCHAR(120) DEFAULT NULL,
  start_at      VARCHAR(20) DEFAULT NULL,
  end_at        VARCHAR(20) DEFAULT NULL,
  contact_email VARCHAR(190) DEFAULT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements (status);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements (category);

CREATE TABLE IF NOT EXISTS announcement_images (
  id              BIGSERIAL PRIMARY KEY,
  announcement_id VARCHAR(40) NOT NULL REFERENCES announcements (id) ON DELETE CASCADE,
  path            VARCHAR(500) NOT NULL,
  position        INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ann_img_ann ON announcement_images (announcement_id, position);

-- -----------------------------------------------------------------------------
-- Cours
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id          VARCHAR(40) PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  content     TEXT DEFAULT NULL,
  status      course_status NOT NULL DEFAULT 'À venir',
  start_at    VARCHAR(20) NOT NULL,
  end_at      VARCHAR(20) NOT NULL,
  time        VARCHAR(10) NOT NULL DEFAULT '00:00',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN courses.content IS 'JSON : [{heading, body}]';

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status);

CREATE TABLE IF NOT EXISTS course_tags (
  course_id VARCHAR(40) NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  tag       VARCHAR(80) NOT NULL,
  PRIMARY KEY (course_id, tag)
);

CREATE TABLE IF NOT EXISTS course_sections (
  id           VARCHAR(40) PRIMARY KEY,
  course_id    VARCHAR(40) NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  duration_min INT NOT NULL DEFAULT 0,
  position     INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sections_course ON course_sections (course_id, position);

CREATE TABLE IF NOT EXISTS course_pdfs (
  id         VARCHAR(40) PRIMARY KEY,
  course_id  VARCHAR(40) NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  path       VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdfs_course ON course_pdfs (course_id);

-- -----------------------------------------------------------------------------
-- QCM
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qcm (
  id             VARCHAR(40) PRIMARY KEY,
  course_id      VARCHAR(40) NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  question_count INT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qcm_course ON qcm (course_id);

CREATE TABLE IF NOT EXISTS qcm_questions (
  id            BIGSERIAL PRIMARY KEY,
  qcm_id        VARCHAR(40) NOT NULL REFERENCES qcm (id) ON DELETE CASCADE,
  prompt        TEXT NOT NULL,
  choices       JSONB NOT NULL,
  correct_index INT NOT NULL DEFAULT 0,
  position      INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_qq_qcm ON qcm_questions (qcm_id, position);

-- -----------------------------------------------------------------------------
-- Messages (boîte de réception admin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id         VARCHAR(40) PRIMARY KEY,
  from_email VARCHAR(190) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  status     message_status NOT NULL DEFAULT 'nouveau',
  course_ref VARCHAR(40) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);

-- -----------------------------------------------------------------------------
-- Activité & notifications admin
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity (
  id    BIGSERIAL PRIMARY KEY,
  type  VARCHAR(60) NOT NULL,
  label VARCHAR(255) NOT NULL,
  ts    BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity (ts);

CREATE TABLE IF NOT EXISTS notifications (
  id      BIGSERIAL PRIMARY KEY,
  text    VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ts      BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_ts ON notifications (ts);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications (is_read);

-- -----------------------------------------------------------------------------
-- Paramètres globaux (clé/valeur) : logo, email principal, etc.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key   VARCHAR(80) PRIMARY KEY,
  value TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- Présence en ligne
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presence (
  email     VARCHAR(190) PRIMARY KEY,
  role      user_role NOT NULL DEFAULT 'USER',
  last_seen BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence (last_seen);

-- -----------------------------------------------------------------------------
-- Demandes d'annonces (soumission publique, modération admin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcement_requests (
  id            VARCHAR(40) PRIMARY KEY,
  category      announcement_category NOT NULL DEFAULT 'Autre',
  title         VARCHAR(255) NOT NULL,
  body          TEXT NOT NULL,
  city          VARCHAR(120) NOT NULL,
  start_at      VARCHAR(20) DEFAULT NULL,
  end_at        VARCHAR(20) DEFAULT NULL,
  contact_email VARCHAR(190) DEFAULT NULL,
  contact_phone VARCHAR(20) DEFAULT NULL,
  status        announcement_request_status NOT NULL DEFAULT 'en_attente',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ann_req_status ON announcement_requests (status);
CREATE INDEX IF NOT EXISTS idx_ann_req_created ON announcement_requests (created_at);

-- -----------------------------------------------------------------------------
-- Notes personnelles par utilisateur et cours
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_notes (
  user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id  VARCHAR(40) NOT NULL,
  body       TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- -----------------------------------------------------------------------------
-- Tentatives QCM (performances utilisateur)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qcm_attempts (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  qcm_id     VARCHAR(40) NOT NULL REFERENCES qcm (id) ON DELETE CASCADE,
  score      INT NOT NULL,
  total      INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qcm_attempts_user ON qcm_attempts (user_id, created_at);

-- -----------------------------------------------------------------------------
-- Triggers : updated_at automatique (équivalent ON UPDATE CURRENT_TIMESTAMP)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qcm_updated_at ON qcm;
CREATE TRIGGER trg_qcm_updated_at
  BEFORE UPDATE ON qcm
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_notes_updated_at ON user_notes;
CREATE TRIGGER trg_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
