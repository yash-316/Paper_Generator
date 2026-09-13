-- ExamPortal initialization SQL
-- This runs automatically when the PostgreSQL container first starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- Indexes will be created by SQLAlchemy models
-- This file is for any DB-level setup needed before the app starts
