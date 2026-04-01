CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  school VARCHAR(300),
  class_roll VARCHAR(20),
  section VARCHAR(20) NOT NULL,
  device_preference VARCHAR(10) DEFAULT 'mobile',
  duration_days INT NOT NULL,
  assessment JSONB NOT NULL,
  pdf_url VARCHAR(500),
  sms_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
