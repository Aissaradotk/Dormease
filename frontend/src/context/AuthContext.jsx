/**
 * =================================================================================================
 * Authentication Context & State Provider (src/context/AuthContext.jsx)
 * =================================================================================================
 * ให้บริการ Global Authentication State สำหรับทุก Component ในแอปพลิเคชัน
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. ตรวจสอบสถานะการล็อกอินอัตโนมัติเมื่อเปิดเว็บ (loadProfile ผ่าน GET /api/auth/me)
 * 2. จัดเก็บ Token ใน localStorage เมื่อล็อกอินสำเร็จ (POST /api/auth/login)
 * 3. จัดการการสมัครสมาชิก (POST /api/auth/register)
 * 4. เคลียร์เซสชันและ Token เมื่อออกจากระบบ (logout)
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - เรียกใช้งาน: `src/lib/api.js` (api.get, api.post)
 * - ส่งข้อมูลให้: `components/ProtectedRoute.jsx` (ตรวจ role), `components/Layout.jsx` (แสดงชื่อผู้ใช้/ปุ่มออกจากระบบ)
 * =================================================================================================
 */

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // ข้อมูลผู้ใช้ { id, email, full_name, role }
  const [profile, setProfile] = useState(null); // ข้อมูลโปรไฟล์
  const [loading, setLoading] = useState(true); // สถานะกำลังโหลด Token ครั้งแรก

  /**
   * loadProfile: ตรวจสอบ Token ที่บันทึกไว้ใน Browser
   * หาก Token ถูกต้อง จะดึงข้อมูลผู้ใช้จาก /api/auth/me มาเก็บใน State
   */
  async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const p = await api.get("/auth/me");
      setUser(p);
      setProfile(p);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function login(email, password) {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    setProfile(data.user);
    return data.user;
  }

  async function register({ full_name, email, password, role, phone }) {
    const data = await api.post("/auth/register", { full_name, email, password, role, phone });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    setProfile(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        reloadProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
