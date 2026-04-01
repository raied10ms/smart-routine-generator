CREATE TABLE IF NOT EXISTS routine_days (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES submissions(id),
  day_number INT NOT NULL,
  phase INT NOT NULL,
  is_weekend BOOLEAN DEFAULT FALSE,
  entries JSONB NOT NULL,
  total_time_min INT NOT NULL,
  UNIQUE(submission_id, day_number)
);
