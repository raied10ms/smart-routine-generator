DROP TABLE IF EXISTS chapters CASCADE;

CREATE TABLE chapters (
  id              SERIAL PRIMARY KEY,
  grade           VARCHAR(10)  NOT NULL,
  subject         VARCHAR(150) NOT NULL,
  chapter_num     INT          NOT NULL,
  chapter_name_bn VARCHAR(250) NOT NULL,
  mcq_importance  INT          NOT NULL DEFAULT 0,
  sq_importance   INT          NOT NULL DEFAULT 0,
  cq_importance   INT          NOT NULL DEFAULT 0,
  time_pari_min   INT          NOT NULL DEFAULT 0,
  time_revise_min INT          NOT NULL DEFAULT 0,
  time_parina_min INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    DEFAULT NOW(),
  UNIQUE(grade, subject, chapter_num)
);
