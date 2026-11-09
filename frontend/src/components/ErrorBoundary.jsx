import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // ดู error เต็มๆ ได้ที่ browser console (F12 > Console)
    console.error("[DormEase] Uncaught error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ maxWidth: 560, margin: "60px auto", padding: 24, fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#c0402e" }}>เกิดข้อผิดพลาดในการโหลดหน้าเว็บ</h2>
          <p>
            เปิด Console ของเบราว์เซอร์ (กด F12 แล้วไปแท็บ Console) เพื่อดูรายละเอียด error ด้านล่างนี้คือข้อความ:
          </p>
          <pre
            style={{
              background: "#f4f6f5",
              padding: 14,
              borderRadius: 8,
              whiteSpace: "pre-wrap",
              fontSize: 13,
              overflowX: "auto",
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <p style={{ color: "#5b6b67", fontSize: 13.5 }}>
            สาเหตุที่พบบ่อยที่สุด: ยังไม่ได้สร้างไฟล์ <code>frontend/.env</code> หรือค่า
            VITE_API_URL ไม่ถูกต้อง — แก้แล้วต้อง restart คำสั่ง <code>npm run dev</code> ใหม่ทุกครั้ง
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
