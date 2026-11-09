-- =========================================================
-- DormEase — MySQL Setup Script (Complete with New Features)
-- Database: ip_std6730202041 (จัดการผ่าน phpMyAdmin: http://119.59.102.161/nindamdb/)
-- =========================================================

-- 1) dorm_users: ข้อมูลผู้ใช้ รหัสผ่าน (แฮช bcrypt) และ role
CREATE TABLE IF NOT EXISTS dorm_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  role ENUM('owner', 'tenant') NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) dorm_rooms: ข้อมูลห้องพัก
CREATE TABLE IF NOT EXISTS dorm_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(50) NOT NULL UNIQUE,
  room_type VARCHAR(100) DEFAULT NULL,
  price DECIMAL(10,2) DEFAULT NULL,
  floor INT DEFAULT NULL,
  size VARCHAR(50) DEFAULT NULL,
  status ENUM('available', 'occupied') NOT NULL DEFAULT 'available',
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) dorm_tenants: ข้อมูลผู้เช่า
CREATE TABLE IF NOT EXISTS dorm_tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  email VARCHAR(150) DEFAULT NULL,
  room_id INT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('active', 'moved_out') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenants_user (user_id),
  INDEX idx_tenants_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) dorm_payments: ข้อมูลค่าเช่ารายงวด
CREATE TABLE IF NOT EXISTS dorm_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period VARCHAR(50) NOT NULL,
  status ENUM('paid', 'unpaid') NOT NULL DEFAULT 'unpaid',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) dorm_bookings: การจองห้องพัก
CREATE TABLE IF NOT EXISTS dorm_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  room_id INT NOT NULL,
  check_in_date DATE NOT NULL,
  contact_phone VARCHAR(50) DEFAULT NULL,
  note TEXT DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) dorm_repairs: การแจ้งซ่อม
CREATE TABLE IF NOT EXISTS dorm_repairs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  room_id INT DEFAULT NULL,
  category ENUM('ไฟฟ้า', 'ประปา/ห้องน้ำ', 'เครื่องปรับอากาศ', 'เฟอร์นิเจอร์/ประตูหน้าต่าง', 'อินเทอร์เน็ต', 'อื่นๆ') NOT NULL DEFAULT 'อื่นๆ',
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_repairs_user (user_id),
  INDEX idx_repairs_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) dorm_bills: รายงานและบันทึกค่าใช้จ่ายแต่ละเดือน (ค่าน้ำ ค่าไฟ ค่าห้อง)
CREATE TABLE IF NOT EXISTS dorm_bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  tenant_id INT DEFAULT NULL,
  period VARCHAR(50) NOT NULL, -- เช่น '2026-09'
  room_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  water_units DECIMAL(10,2) DEFAULT 0.00,
  water_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  electric_units DECIMAL(10,2) DEFAULT 0.00,
  electric_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  other_fees DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bills_room (room_id),
  INDEX idx_bills_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8) dorm_move_outs: ระบบแจ้งย้ายออก
CREATE TABLE IF NOT EXISTS dorm_move_outs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tenant_id INT DEFAULT NULL,
  room_id INT NOT NULL,
  move_out_date DATE NOT NULL,
  reason TEXT DEFAULT NULL,
  bank_account VARCHAR(100) DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_moveout_user (user_id),
  INDEX idx_moveout_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9) dorm_notifications: ระบบแจ้งเตือน/ข่าวสาร
CREATE TABLE IF NOT EXISTS dorm_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL, -- NULL = ส่งถึงทุกคน (Broadcast), ระบุตัวเลข = เฉพาะคน
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category ENUM('general', 'bill', 'repair', 'booking', 'move_out') NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- ข้อมูลตัวอย่างห้องพัก 5 ห้อง (Sample Rooms)
-- =========================================================
INSERT INTO dorm_rooms (room_number, room_type, price, floor, size, status, description)
VALUES 
  ('101', 'สตูดิโอ (Studio)', 3500.00, 1, '24 ตร.ม.', 'available', 'แอร์, เตียง 5 ฟุต, ตู้เสื้อผ้า, โต๊ะทำงาน, เครื่องทำน้ำอุ่น, ฟรี Wi-Fi'),
  ('102', 'สตูดิโอ (Studio)', 3500.00, 1, '24 ตร.ม.', 'available', 'แอร์, เตียง 5 ฟุต, ตู้เสื้อผ้าบิวท์อิน, ระเบียงตากผ้า, เครื่องทำน้ำอุ่น'),
  ('103', 'สตูดิโอห้องมุม (Corner Studio)', 3800.00, 1, '26 ตร.ม.', 'available', 'ห้องมุม หน้าต่าง 2 ด้าน ลมพัดสบาย, แอร์, เฟอร์ครบ, ตู้เย็น, ไมโครเวฟ'),
  ('201', '1 ห้องนอน (1-Bedroom Suite)', 4500.00, 2, '32 ตร.ม.', 'available', 'แยกห้องนอนและห้องนั่งเล่น, แอร์ 2 เครื่อง, โซฟา, สมาร์ททีวี, ระเบียงกว้าง'),
  ('202', 'สตูดิโอ วิวสวน (Garden View Studio)', 3600.00, 2, '25 ตร.ม.', 'available', 'ชั้น 2 วิวสวน ร่มรื่นเงียบสงบ, แอร์, โต๊ะอ่านหนังสือ, ตู้เย็น, เครื่องทำน้ำอุ่น')
ON DUPLICATE KEY UPDATE 
  room_type = VALUES(room_type),
  price = VALUES(price),
  floor = VALUES(floor),
  size = VALUES(size),
  description = VALUES(description);
