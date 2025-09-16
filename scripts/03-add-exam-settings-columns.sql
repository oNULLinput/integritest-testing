-- Add exam settings columns to the exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS show_timer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_submit BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false;

-- Update existing exams to have default values
UPDATE exams 
SET 
  show_timer = true,
  auto_submit = true,
  shuffle_questions = false
WHERE show_timer IS NULL OR auto_submit IS NULL OR shuffle_questions IS NULL;
