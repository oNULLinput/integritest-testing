-- Create tables for exam system with proper structure
-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  exam_code VARCHAR(6) UNIQUE NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  instructor_id BIGINT REFERENCES instructors(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id BIGSERIAL PRIMARY KEY,
  exam_id BIGINT REFERENCES exams(id),
  student_name VARCHAR(255) NOT NULL,
  student_number VARCHAR(50) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  violations JSONB DEFAULT '[]',
  answers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exams_code ON exams(exam_code);
CREATE INDEX IF NOT EXISTS idx_exams_instructor ON exams(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON exam_sessions(status);

-- Insert sample exam for testing
INSERT INTO exams (title, description, duration, exam_code, questions, instructor_id) 
VALUES (
  'Sample Mathematics Exam',
  'A demonstration exam for testing the system',
  60,
  'TEST01',
  '[
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correct_answer": "4"
    },
    {
      "id": 2,
      "type": "identification",
      "question": "What is the capital of France?",
      "correct_answer": "Paris"
    }
  ]'::jsonb,
  1
) ON CONFLICT (exam_code) DO NOTHING;
