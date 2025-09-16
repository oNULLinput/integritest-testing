-- Adding database indexes for performance optimization
-- Create indexes for frequently queried columns

-- Index for exam code lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_exams_exam_code ON exams(exam_code);
CREATE INDEX IF NOT EXISTS idx_exams_exam_code_lower ON exams(LOWER(exam_code));

-- Index for instructor authentication
CREATE INDEX IF NOT EXISTS idx_instructors_username ON instructors(username);
CREATE INDEX IF NOT EXISTS idx_instructors_username_password ON instructors(username, password);

-- Index for exam sessions by exam_id
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_name ON exam_sessions(student_name);

-- Index for exam sessions by status and timestamps
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_created_at ON exam_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_submitted_at ON exam_sessions(submitted_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_exams_instructor_created ON exams(instructor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_status ON exam_sessions(exam_id, status);

-- Index for JSON fields (violations)
CREATE INDEX IF NOT EXISTS idx_exam_sessions_violations_gin ON exam_sessions USING GIN (violations);

-- Partial indexes for active sessions
CREATE INDEX IF NOT EXISTS idx_exam_sessions_active ON exam_sessions(exam_id, student_name) 
WHERE status = 'in_progress';

-- Add table statistics update
ANALYZE instructors;
ANALYZE exams;
ANALYZE exam_sessions;
