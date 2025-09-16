-- Create instructors table if it doesn't exist
CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert your test instructor account
INSERT INTO instructors (username, password, email, full_name) 
VALUES ('test1', 'test', 'test1@example.com', 'Test Instructor')
ON CONFLICT (username) DO NOTHING;

-- Verify the data was inserted
SELECT * FROM instructors WHERE username = 'test1';
