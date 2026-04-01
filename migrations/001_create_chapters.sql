CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  section VARCHAR(20) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  chapter_number INT NOT NULL,
  chapter_name_bn VARCHAR(200) NOT NULL,
  chapter_name_en VARCHAR(200),
  question_type VARCHAR(20) NOT NULL,
  cq_importance INT NOT NULL DEFAULT 0,
  mcq_importance INT NOT NULL DEFAULT 0,
  math_importance INT NOT NULL DEFAULT 0,
  time_cq_min INT NOT NULL DEFAULT 0,
  time_mcq_min INT NOT NULL DEFAULT 0,
  time_math_min INT NOT NULL DEFAULT 0,
  time_revision_min INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(section, subject, chapter_number)
);
