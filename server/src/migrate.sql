-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------
-- 1. TABLES WITH NO FOREIGN KEY DEPENDENCIES
-----------------------------------------------

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(200) NOT NULL,
  module VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procedure_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  specialization VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'Active',
  user_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_name_unique') THEN
    ALTER TABLE doctors ADD CONSTRAINT doctors_name_unique UNIQUE (first_name, last_name);
  END IF;
END $$;

-----------------------------------------------
-- 2. TABLES WITH FK TO DOCTORS
-----------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  blood_type VARCHAR(5),
  medical_history TEXT,
  allergies TEXT,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'Active',
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------
-- 3. TABLES WITH FK TO PATIENTS
-----------------------------------------------

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(30) DEFAULT 'Scheduled',
  reason TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_procedures (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  procedure_type_id INTEGER NOT NULL REFERENCES procedure_types(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  procedure_date DATE NOT NULL,
  notes TEXT,
  fee DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_doctors (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  UNIQUE(patient_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------
-- 4. TABLES WITH FK TO INVOICES
-----------------------------------------------

CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  description VARCHAR(500) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------
-- 5. SEED DATA
-----------------------------------------------

INSERT INTO settings (key, value) VALUES
  ('clinic_name', 'Alyssa Wellness & Medical Clinic'),
  ('clinic_address', '123 Health Avenue, Manila, Philippines'),
  ('clinic_phone', '+63 2 8123 4567'),
  ('clinic_email', 'info@alyssaclinic.com'),
  ('currency', 'PHP'),
  ('appointment_duration', '30')
ON CONFLICT (key) DO NOTHING;

INSERT INTO procedure_types (name, description, price) VALUES
  ('General Checkup', 'Standard physical examination', 500),
  ('Blood Extraction', 'Venipuncture for lab tests', 150),
  ('ECG', 'Electrocardiogram', 800),
  ('Nebulization', 'Respiratory treatment', 350),
  ('Wound Dressing', 'Wound cleaning and bandaging', 400),
  ('Vaccination', 'Administer vaccine', 200),
  ('Biopsy', 'Tissue sampling', 1500),
  ('Skin Prick Test', 'Allergy testing', 800)
ON CONFLICT (name) DO NOTHING;

INSERT INTO services (name, description, price, category) VALUES
  ('General Consultation', 'Standard medical consultation', 500, 'Consultation'),
  ('Pediatric Checkup', 'Child health assessment', 600, 'Consultation'),
  ('ECG', 'Electrocardiogram', 800, 'Diagnostic'),
  ('Blood Test - CBC', 'Complete Blood Count', 350, 'Laboratory'),
  ('X-Ray - Chest', 'Chest X-Ray', 700, 'Diagnostic'),
  ('Vaccination - Flu Shot', 'Influenza vaccine', 1200, 'Vaccination'),
  ('Skin Check', 'Full skin examination', 1000, 'Consultation'),
  ('Blood Pressure Monitoring', '24-hour ambulatory BP monitoring', 1500, 'Diagnostic'),
  ('Health Certificate', 'Medical clearance certificate', 300, 'Others'),
  ('Teleconsultation', 'Online video consultation', 400, 'Consultation')
ON CONFLICT (name) DO NOTHING;

INSERT INTO doctors (first_name, last_name, specialization, phone, email, status) VALUES
  ('Maria', 'Santos', 'General Medicine', '09171234567', 'maria.santos@clinic.com', 'Active'),
  ('Carlos', 'Lopez', 'Pediatrics', '09172345678', 'carlos.lopez@clinic.com', 'Active'),
  ('Elena', 'Cruz', 'Cardiology', '09173456789', 'elena.cruz@clinic.com', 'Active'),
  ('Roberto', 'Tan', 'Dermatology', '09174567890', 'roberto.tan@clinic.com', 'Inactive')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS medical_certificates (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  rest_from DATE,
  rest_to DATE,
  restrictions TEXT,
  notes TEXT,
  issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) DEFAULT 'Medicine',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'piece',
  reorder_level INTEGER NOT NULL DEFAULT 10,
  unit_price DECIMAL(12,2) DEFAULT 0,
  supplier VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
