import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { api } from "../lib/api";

const LABELS = {
  th: {
    title: "ใบรับรองถิ่นที่อยู่",
    subtitle: "แบบฟอร์มขอใบรับรองถิ่นที่อยู่สำหรับชาวต่างชาติ",
    fullName: "ชื่อ-นามสกุล", passport: "เลขหนังสือเดินทาง",
    nationality: "สัญชาติ", dob: "วันเดือนปีเกิด",
    address: "ที่อยู่", checkin: "วันที่เข้าพัก",
    appDate: "วันที่ยื่นคำร้อง", phone: "เบอร์โทรศัพท์",
    signature: "ลายมือชื่อ / Signature",
    submit: "ส่งคำขอ", submitting: "กำลังส่ง...",
    pending: "รอการอนุมัติ", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ",
    pendingMsg: "คำขอของคุณกำลังรอ Admin ตรวจสอบ",
    approvedMsg: "คำขอได้รับการอนุมัติแล้ว สามารถดาวน์โหลดใบรับรองได้",
    download: "ดาวน์โหลด PDF",
    editResubmit: "แก้ไขและส่งใหม่",
    successMsg: "ส่งคำขอเรียบร้อยแล้ว กรุณารอ Admin ตรวจสอบและอนุมัติ",
    statusTitle: "สถานะคำขอ",
    noRequest: "ยังไม่มีคำขอ กรุณากรอกแบบฟอร์มด้านบน",
    reason: "เหตุผล",
    signatureHint: "พิมพ์ชื่อเพื่อใช้เป็นลายเซ็น",
  },
  en: {
    title: "Certificate of Residence",
    subtitle: "Application Form for Foreign Residents",
    fullName: "Full Name", passport: "Passport No.",
    nationality: "Nationality", dob: "Date of Birth",
    address: "Address", checkin: "Check-in Date",
    appDate: "Application Date", phone: "Phone Number",
    signature: "Signature",
    submit: "Submit Application", submitting: "Submitting...",
    pending: "Pending Approval", approved: "Approved", rejected: "Rejected",
    pendingMsg: "Your application is pending Admin review.",
    approvedMsg: "Your application has been approved. You can now download the certificate.",
    download: "Download PDF",
    editResubmit: "Edit & Resubmit",
    successMsg: "Application submitted! Please wait for Admin approval.",
    statusTitle: "Application Status",
    noRequest: "No application yet. Please fill in the form above.",
    reason: "Reason",
    signatureHint: "Type your name to use as signature",
  },
};

function CertFormField({ label, name, type = "text", required: req, as, value, onChange, error }) {
  return (
    <div className="cert-field">
      <label htmlFor={name} className="cert-label">
        {label}{req && <span className="cert-required"> *</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          className={`cert-input cert-textarea${error ? " cert-input-err" : ""}`}
          value={value ?? ""}
          rows={3}
          onChange={onChange}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          className={`cert-input${error ? " cert-input-err" : ""}`}
          value={value ?? ""}
          onChange={onChange}
        />
      )}
      {error && <span className="cert-err-msg">Required</span>}
    </div>
  );
}

export default function ResidenceCertificate() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.en;
  const API = "http://119.59.102.161:3007";

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    language: "en", full_name: "", passport_no: "", nationality: "",
    date_of_birth: "", address: "", check_in_date: "",
    application_date: today, phone: "", signature: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  useEffect(() => {
    setForm((f) => ({ ...f, language: lang }));
  }, [lang]);

  async function fetchMyRequests() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/residence-certificates/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch {
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    const e = {};
    const required = ["full_name","passport_no","nationality","date_of_birth","address","check_in_date","phone","signature"];
    required.forEach((k) => { if (!form[k]?.trim()) e[k] = true; });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/residence-certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setEditing(false);
        fetchMyRequests();
        setForm({ language: lang, full_name: "", passport_no: "", nationality: "",
          date_of_birth: "", address: "", check_in_date: "", application_date: today,
          phone: "", signature: "" });
      } else {
        alert(data.error || "Error submitting");
      }
    } catch {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(id) {
    setDownloadingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/residence-certificates/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Cannot download");
        return;
      }
      const cert = await res.json();
      // Generate PDF via browser print window
      printCertificate(cert);
    } catch {
      alert("Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  function printCertificate(cert) {
    const isTH = cert.language === "th";
    const L = {
      title: isTH ? "ใบรับรองถิ่นที่อยู่" : "Certificate of Residence",
      subtitle: isTH ? "ระบบจัดการหอพัก DormEase" : "DormEase Dormitory Management System",
      fullName: isTH ? "ชื่อ-นามสกุล" : "Full Name",
      passport: isTH ? "เลขหนังสือเดินทาง" : "Passport No.",
      nationality: isTH ? "สัญชาติ" : "Nationality",
      dob: isTH ? "วันเดือนปีเกิด" : "Date of Birth",
      address: isTH ? "ที่อยู่" : "Address",
      checkin: isTH ? "วันที่เข้าพัก" : "Check-in Date",
      appDate: isTH ? "วันที่ยื่นคำร้อง" : "Application Date",
      phone: isTH ? "เบอร์โทรศัพท์" : "Phone Number",
      signature: isTH ? "ลายมือชื่อ" : "Signature",
      approvedDate: isTH ? "วันที่อนุมัติ" : "Approved Date",
      authorizedBy: isTH ? "อนุมัติโดย" : "Authorized By",
    };

    const fields = [
      [L.fullName, cert.full_name], [L.passport, cert.passport_no],
      [L.nationality, cert.nationality], [L.dob, cert.date_of_birth?.slice(0,10)],
      [L.address, cert.address], [L.checkin, cert.check_in_date?.slice(0,10)],
      [L.appDate, cert.application_date?.slice(0,10)], [L.phone, cert.phone],
      [L.signature, cert.signature],
    ];

    const rows = fields.map(([lbl, val]) => `
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#3d564e;width:180px;border-bottom:1px solid #e5ede9">${lbl}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5ede9">${val || "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>${L.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap');
        body { font-family: 'Prompt', sans-serif; margin: 0; padding: 0; background: #fff; color: #1a1a1a; }
        @page { size: A4; margin: 20mm; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        .header { background: #0f5144; color: #fff; padding: 28px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
        .body { padding: 28px 32px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .divider { border: none; border-top: 2px solid #0f5144; margin: 20px 0; }
        .approval { font-size: 13px; }
        .footer { text-align: center; font-size: 11px; color: #888; margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; }
        .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: #0f5144; color: #fff; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; font-family: 'Prompt', sans-serif; }
        @media print { .print-btn { display: none; } }
      </style>
    </head><body>
      <div class="header">
        <h1>${L.title}</h1>
        <p>${L.subtitle}</p>
      </div>
      <div class="body">
        <table>${rows}</table>
        <hr class="divider">
        <table class="approval">
          <tr>
            <td style="padding:6px 12px;font-weight:600;color:#3d564e;width:180px">${L.approvedDate}</td>
            <td style="padding:6px 12px">${cert.approved_at?.slice(0,10) || "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;font-weight:600;color:#3d564e">${L.authorizedBy}</td>
            <td style="padding:6px 12px">${cert.approved_by || "Admin"}</td>
          </tr>
        </table>
        <div class="footer">
          ${L.subtitle}<br>
          Generated: ${new Date().toISOString().slice(0,10)}
        </div>
      </div>
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </body></html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 800);
  }

  function startEdit(cert) {
    setForm({
      language: cert.language || lang,
      full_name: cert.full_name || "", passport_no: cert.passport_no || "",
      nationality: cert.nationality || "", date_of_birth: cert.date_of_birth?.slice(0,10) || "",
      address: cert.address || "", check_in_date: cert.check_in_date?.slice(0,10) || "",
      application_date: today, phone: cert.phone || "", signature: cert.signature || "",
    });
    setEditing(true);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const latestRequest = myRequests[0];
  const showForm = !latestRequest || latestRequest?.status === "rejected" || editing || submitted === false && !latestRequest;

  return (
    <div className="cert-page">
      {/* Page Header */}
      <div className="page-head">
        <div className="page-head-info">
          <h1 className="page-title">📄 {L.title}</h1>
          <p className="page-subtitle">{L.subtitle}</p>
        </div>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/my-repairs", label: lang === "th" ? "แจ้งซ่อมบำรุง" : "Repair Request", icon: "🔧" },
          { path: "/my-move-out", label: lang === "th" ? "แจ้งย้ายออก" : "Move-Out Request", icon: "📦" },
          { path: "/residence-certificate", label: lang === "th" ? "ขอใบรับรองที่พัก" : "Residence Certificate", icon: "📄" },
          { path: "/book-room", label: lang === "th" ? "จองห้องพักใหม่" : "Book New Room", icon: "🔍" },
        ]}
      />

      {/* Status Card */}
      {!loading && latestRequest && !editing && (
        <div className={`cert-status-card cert-status-${latestRequest.status}`}>
          <div className="cert-status-header">
            <span className="cert-status-icon">
              {latestRequest.status === "pending" ? "🟡" : latestRequest.status === "approved" ? "🟢" : "🔴"}
            </span>
            <div>
              <div className="cert-status-label">
                {latestRequest.status === "pending" ? L.pending
                  : latestRequest.status === "approved" ? L.approved : L.rejected}
              </div>
              <div className="cert-status-msg">
                {latestRequest.status === "pending" ? L.pendingMsg
                  : latestRequest.status === "approved" ? L.approvedMsg
                  : `${L.reason}: ${latestRequest.rejection_reason || "-"}`}
              </div>
            </div>
          </div>
          {latestRequest.status === "approved" && (
            <button
              className="btn-primary cert-download-btn"
              onClick={() => handleDownload(latestRequest.id)}
              disabled={downloadingId === latestRequest.id}
            >
              {downloadingId === latestRequest.id ? "⏳ Generating..." : `⬇️ ${L.download}`}
            </button>
          )}
          {latestRequest.status === "rejected" && (
            <button className="btn-ghost" onClick={() => startEdit(latestRequest)}>✏️ {L.editResubmit}</button>
          )}
        </div>
      )}

      {/* Success banner */}
      {submitted && (
        <div className="cert-success-banner">✅ {L.successMsg}</div>
      )}

      {/* Form */}
      {(!latestRequest || latestRequest?.status === "rejected" || editing) && (
        <div className="card-shadow cert-form-card">
          <form onSubmit={handleSubmit}>
            <div className="cert-form-grid">
              <CertFormField label={L.fullName} name="full_name" required value={form.full_name} onChange={handleInputChange} error={errors.full_name} />
              <CertFormField label={L.passport} name="passport_no" required value={form.passport_no} onChange={handleInputChange} error={errors.passport_no} />
              <CertFormField label={L.nationality} name="nationality" required value={form.nationality} onChange={handleInputChange} error={errors.nationality} />
              <CertFormField label={L.dob} name="date_of_birth" type="date" required value={form.date_of_birth} onChange={handleInputChange} error={errors.date_of_birth} />
              <CertFormField label={L.checkin} name="check_in_date" type="date" required value={form.check_in_date} onChange={handleInputChange} error={errors.check_in_date} />
              <CertFormField label={L.phone} name="phone" type="tel" required value={form.phone} onChange={handleInputChange} error={errors.phone} />
              <CertFormField label={L.appDate} name="application_date" type="date" required value={form.application_date} onChange={handleInputChange} error={errors.application_date} />
              <CertFormField label={`${L.signature} — ${L.signatureHint}`} name="signature" required value={form.signature} onChange={handleInputChange} error={errors.signature} />
            </div>
            <CertFormField label={L.address} name="address" required as="textarea" value={form.address} onChange={handleInputChange} error={errors.address} />
            <div className="cert-form-footer">
              {editing && (
                <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              )}
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? L.submitting : L.submit}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
