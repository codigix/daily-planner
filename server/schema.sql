-- CODIGIX Executive OS MySQL Workbench Database Schema
CREATE DATABASE IF NOT EXISTS codigix_executive_os CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE codigix_executive_os;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Planner Tasks Table
CREATE TABLE IF NOT EXISTS planner_tasks (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  time VARCHAR(50),
  date VARCHAR(100),
  targetDay VARCHAR(50),
  recurring VARCHAR(50) DEFAULT 'None',
  notes TEXT,
  checkpoints JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Schedule Timeline Table
CREATE TABLE IF NOT EXISTS schedule_timeline (
  id VARCHAR(50) PRIMARY KEY,
  time VARCHAR(50) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  color VARCHAR(50) DEFAULT 'blue',
  date VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Domain Tasks Table
CREATE TABLE IF NOT EXISTS domain_tasks (
  id VARCHAR(50) PRIMARY KEY,
  domain_id INT NOT NULL,
  domain_title VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'NOT DONE',
  note TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
  id VARCHAR(50) PRIMARY KEY,
  time VARCHAR(50) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  client VARCHAR(100),
  type VARCHAR(50) NOT NULL DEFAULT 'Client',
  status VARCHAR(50) NOT NULL DEFAULT 'Upcoming',
  members JSON,
  agenda JSON,
  action_items JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Client Follow-ups Table
CREATE TABLE IF NOT EXISTS client_followups (
  id VARCHAR(50) PRIMARY KEY,
  company VARCHAR(100) NOT NULL,
  tagline VARCHAR(255),
  last_contact VARCHAR(100),
  last_contact_type VARCHAR(50),
  next_followup VARCHAR(100),
  next_followup_type VARCHAR(50),
  priority VARCHAR(50) NOT NULL DEFAULT 'High',
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  owner VARCHAR(100),
  owner_avatar VARCHAR(255),
  probability INT DEFAULT 50,
  expected_value VARCHAR(100),
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(50),
  industry VARCHAR(100),
  source VARCHAR(100),
  notes TEXT,
  starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Telemetry & Overview Tables
CREATE TABLE IF NOT EXISTS telemetry_overview (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_key VARCHAR(100) UNIQUE NOT NULL,
  metric_value JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
