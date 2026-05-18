-- Initial database setup
-- Runs once when the Docker Postgres container is first created

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- GIN index support

-- Grant all on the cinema database to cinema user
GRANT ALL PRIVILEGES ON DATABASE cinema TO cinema;
