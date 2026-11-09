/**
 * =================================================================================================
 * Frontend Main Application & Route Definition (src/App.jsx)
 * =================================================================================================
 * จุดศูนย์กลางระบบ Routing ของ React SPA (Single Page Application)
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. กำหนด Context Providers หลัก:
 *    - LanguageProvider : สลับภาษา ไทย (TH) / อังกฤษ (ENG)
 *    - ThemeProvider    : สลับโหมดสี Light / Dark Mode
 *    - AuthProvider     : จัดการเซสชันล็อกอิน สิทธิ์ และข้อมูลผู้ใช้
 * 2. จัดการหน้า IntroScreen (หน้าแนะนำระบบเมื่อเปิดเว็บครั้งแรก)
 * 3. กำหนดโครงสร้างเส้นทางหน้าเว็บ (Routes) และแบ่งแยกสิทธิ์อย่างเด็ดขาดด้วย `ProtectedRoute`:
 *    - Owner Routes  : Dashboard, Rooms, Tenants, MonthlyBills, Bookings, Repairs, MoveOuts, Notifications, etc.
 *    - Tenant Routes : TenantHome (My Room), TenantBills, TenantPayments, BookRoom, TenantRepairs, etc.
 * 4. หน้าจอเปิดสาธารณะ / พิเศษ : Login, P2P Mobile Upload
 * =================================================================================================
 */

import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import ChatbotWidget from "./components/ChatbotWidget";
import "./chatbot.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import IntroScreen from "./components/IntroScreen";

// -------------------------------------------------------------------------------------------------
// นำเข้าหน้าจอฝั่งเจ้าของหอพัก (Owner / Admin Pages)
// -------------------------------------------------------------------------------------------------
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Payments from "./pages/Payments";
import MonthlyBills from "./pages/MonthlyBills";
import Bookings from "./pages/Bookings";
import Repairs from "./pages/Repairs";
import MoveOuts from "./pages/MoveOuts";
import Notifications from "./pages/Notifications";
import AdminInitialFees from "./pages/AdminInitialFees";
import AdminMoveInPayments from "./pages/AdminMoveInPayments";
import AdminResidentVerifications from "./pages/AdminResidentVerifications";
import AdminResidenceCertificates from "./pages/AdminResidenceCertificates";

// -------------------------------------------------------------------------------------------------
// นำเข้าหน้าจอฝั่งผู้เช่า (Tenant Pages)
// -------------------------------------------------------------------------------------------------
import TenantHome from "./pages/TenantHome";
import TenantPayments from "./pages/TenantPayments";
import TenantBills from "./pages/TenantBills";
import BookRoom from "./pages/BookRoom";
import TenantRepairs from "./pages/TenantRepairs";
import TenantMoveOut from "./pages/TenantMoveOut";
import TenantNotifications from "./pages/TenantNotifications";
import P2PMobileUpload from "./pages/P2PMobileUpload";
import ResidenceCertificate from "./pages/ResidenceCertificate";
import MoveInFlow from "./pages/MoveInFlow";
import MoveInPayment from "./pages/MoveInPayment";
import ResidentVerificationPage from "./pages/ResidentVerificationPage";

/**
 * NotFoundRedirect: จัดการกรณี URL ไม่ถูกต้อง
 * ส่งผู้ใช้ไปยังหน้าเริ่มต้นตามบทบาท (Owner ไป Dashboard, Tenant ไป My Room)
 */
function NotFoundRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "owner" ? "/dashboard" : "/my-room"} replace />;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  function handleFinishIntro() {
    setShowIntro(false);
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
        {showIntro && <IntroScreen onFinish={handleFinishIntro} />}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/p2p-upload" element={<P2PMobileUpload />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Owner Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="owner">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms"
            element={
              <ProtectedRoute role="owner">
                <Rooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants"
            element={
              <ProtectedRoute role="owner">
                <Tenants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute role="owner">
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-bills"
            element={
              <ProtectedRoute role="owner">
                <MonthlyBills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute role="owner">
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repairs"
            element={
              <ProtectedRoute role="owner">
                <Repairs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/move-outs"
            element={
              <ProtectedRoute role="owner">
                <MoveOuts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute role="owner">
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Tenant Routes */}
          <Route
            path="/my-room"
            element={
              <ProtectedRoute role="tenant">
                <TenantHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book-room"
            element={
              <ProtectedRoute role="tenant">
                <BookRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bills"
            element={
              <ProtectedRoute role="tenant">
                <TenantBills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-payments"
            element={
              <ProtectedRoute role="tenant">
                <TenantPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-repairs"
            element={
              <ProtectedRoute role="tenant">
                <TenantRepairs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-move-out"
            element={
              <ProtectedRoute role="tenant">
                <TenantMoveOut />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-notifications"
            element={
              <ProtectedRoute role="tenant">
                <TenantNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/residence-certificate"
            element={
              <ProtectedRoute role="tenant">
                <ResidenceCertificate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/residence-certificates"
            element={
              <ProtectedRoute role="owner">
                <AdminResidenceCertificates />
              </ProtectedRoute>
            }
          />
          {/* Move-in System */}
          <Route
            path="/move-in"
            element={
              <ProtectedRoute role="tenant">
                <MoveInFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/move-in/payment"
            element={
              <ProtectedRoute role="tenant">
                <MoveInPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deposit-payment"
            element={
              <ProtectedRoute role="tenant">
                <MoveInPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pay-deposit"
            element={
              <ProtectedRoute role="tenant">
                <MoveInPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/move-in/verification"
            element={
              <ProtectedRoute role="tenant">
                <ResidentVerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/initial-fees"
            element={
              <ProtectedRoute role="owner">
                <AdminInitialFees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/move-in-payments"
            element={
              <ProtectedRoute role="owner">
                <AdminMoveInPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/resident-verifications"
            element={
              <ProtectedRoute role="owner">
                <AdminResidentVerifications />
              </ProtectedRoute>
            }
          />

          {/* Route Aliases */}
          <Route path="/tenant-home" element={<Navigate to="/my-room" replace />} />
          <Route path="/bills" element={<Navigate to="/my-bills" replace />} />
        </Route>

        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>

      <ChatbotWidget />
      </AuthProvider>
    </ThemeProvider>
    </LanguageProvider>
  );
}
