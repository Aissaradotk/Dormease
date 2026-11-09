/**
 * =================================================================================================
 * Frontend API Client Service (src/lib/api.js)
 * =================================================================================================
 * โมดูลศูนย์กลางการเชื่อมต่อ Network ฝั่ง Frontend ทำหน้าที่:
 * 1. รับ Base URL จาก Environment Variable `VITE_API_URL` (ดีฟอลต์: http://localhost:4000/api)
 * 2. แนบ JWT Bearer Token จาก localStorage เข้าไปใน HTTP Request Header อัตโนมัติในทุกคำขอ
 * 3. จัดการแปลงข้อมูล Request และ Response เป็น JSON
 * 4. ดักจับข้อผิดพลาด (Error Handling) และโยน Error Message ที่เซิร์ฟเวอร์ตอบกลับมา
 * 
 * แผนผังการเชื่อมโยง (System Connection Architecture):
 * - Frontend Pages (เช่น Dashboard, Rooms, MonthlyBills, TenantBills, etc.) 
 *   ➜ เรียกใช้งานผ่าน api.get(), api.post(), api.put(), api.del()
 *   ➜ ส่งคำขอผ่านเครือข่ายไปยัง Express Server (backend/src/index.js)
 *   ➜ ตรวจสอบสิทธิ์ที่ backend/src/middleware/auth.js (requireAuth)
 * =================================================================================================
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * request: ฟังก์ชันหลักในการยิง HTTP Request ผ่าน Fetch API
 * @param {string} path - URL Endpoint เช่น '/bills/my' หรือ '/rooms'
 * @param {object} options - การกำหนดค่าเพิ่มเติมของ fetch เช่น method, headers, body
 */
async function request(path, options = {}) {
  // 1. ดึง JWT Token ที่บันทึกไว้ใน Browser LocalStorage
  const token = localStorage.getItem("token");

  // 2. เรียกเซิร์ฟเวอร์ Backend พร้อมแนบ Header Content-Type และ Authorization
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // 3. แปลงผลลัพธ์เป็น JSON Object
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
  return body;
}

/**
 * api: Wrapper Object สำหรับเรียกคำขอ RESTful APIs แบบสั้น
 * ตัวอย่างการใช้งาน:
 * - api.get("/rooms")
 * - api.post("/auth/login", { email, password })
 * - api.put("/repairs/1", { status: "completed" })
 * - api.del("/bills/5")
 */
export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  del: (path) => request(path, { method: "DELETE" }),
};
