import { useState } from "react";
import Modal from "./Modal";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    modal_title: "ข้อมูลหอพัก & เบอร์ติดต่อฉุกเฉิน",
    tab_emergency: "📞 เบอร์ติดต่อฉุกเฉิน",
    tab_rules: "📜 กฎระเบียบหอพัก",
    emergency_intro: "💡 แตะที่ปุ่ม \"โทรทันที\" บนมือถือเพื่อโทรออกหาเจ้าหน้าที่ได้ทันที",
    rules_intro: "📋 ระเบียบการอยู่อาศัยร่วมกันเพื่อความสงบเรียบร้อยและความปลอดภัยของสมาชิกหอพัก DormEase ทุกท่าน",
    btn_call: "📞 โทรทันที",
    call_title: (name) => `โทรหา ${name}`,
    btn_close: "เข้าใจแล้ว / ปิดหน้าต่าง",
    contacts: [
      {
        title: "ผู้จัดการหอพัก (Dorm Manager)",
        desc: "ติดต่อเรื่องทั่วไป, สอบถามสัญญาเช่า, ชำระเงิน, กุญแจสำรอง",
        phone: "099-614-4478",
        tel: "0996144478",
        icon: "🏢",
        badge: "หลัก/พร้อมเพย์",
        badgeClass: "badge-primary"
      },
      {
        title: "ช่างซ่อมบำรุงประจำหอ (Emergency Repair)",
        desc: "ท่อประปาแตก, ไฟฟ้าลัดวงจร, ลิฟต์ค้าง",
        phone: "089-876-5432",
        tel: "0898765432",
        icon: "🔧",
        badge: "24 ชม.",
        badgeClass: "badge-warning"
      },
      {
        title: "ป้อมรักษาความปลอดภัย (Security Guard)",
        desc: "เหตุผิดปกติหน้าหอพัก, ที่จอดรถ, เปิดประตูกลางคืน",
        phone: "02-345-6789",
        tel: "023456789",
        icon: "👮",
        badge: "จุดคัดกรอง",
        badgeClass: "badge-success"
      },
      {
        title: "ศูนย์แจ้งเหตุด่วนเหตุร้าย (Police)",
        desc: "สถานีตำรวจ / เหตุด่วนเหตุร้ายฉุกเฉิน",
        phone: "191",
        tel: "191",
        icon: "🚨",
        badge: "ฉุกเฉิน",
        badgeClass: "badge-danger"
      },
      {
        title: "ศูนย์กู้ชีพการแพทย์ฉุกเฉิน (Ambulance)",
        desc: "เจ็บป่วยฉุกเฉิน, อุบัติเหตุ, เรียกรถพยาบาล",
        phone: "1669",
        tel: "1669",
        icon: "🚑",
        badge: "ฟรี 24 ชม.",
        badgeClass: "badge-danger"
      },
      {
        title: "การไฟฟ้านครหลวง / ส่วนภูมิภาค",
        desc: "เหตุไฟฟ้าดับเป็นบริเวณกว้าง, หม้อแปลงระเบิด",
        phone: "1129",
        tel: "1129",
        icon: "⚡",
        badge: "สาธารณูปโภค",
        badgeClass: "badge-neutral"
      },
      {
        title: "การประปานครหลวง / ส่วนภูมิภาค",
        desc: "แจ้งท่อเมนประปาแตกรั่ว, น้ำประปาไม่ไหล",
        phone: "1125",
        tel: "1125",
        icon: "💧",
        badge: "สาธารณูปโภค",
        badgeClass: "badge-neutral"
      }
    ],
    rules: [
      {
        icon: "🕒",
        title: "เวลาเปิด-ปิดและระบบรักษาความปลอดภัย",
        desc: "ประตูหอพักใช้ระบบสแกนคีย์การ์ด 24 ชั่วโมง โดยจะปิดล็อคประตูทางเข้าหลักตั้งแต่เวลา 23:00 น. ถึง 05:00 น. ห้ามนำบุคคลภายนอกเข้าพักค้างคืนโดยไม่แจ้งเจ้าหน้าที่"
      },
      {
        icon: "🤫",
        title: "ความสงบและการใช้เสียง",
        desc: "ขอความร่วมมืองดส่งเสียงดัง, จัดปาร์ตี้ หรือเปิดโทรทัศน์/เครื่องเสียงดังรบกวนห้องข้างเคียงหลังเวลา 22:00 น. เพื่อสุขอนามัยและความเป็นส่วนตัวของเพื่อนร่วมหอพัก"
      },
      {
        icon: "🗑️",
        title: "การจัดการขยะและสุขอนามัย",
        desc: "กรุณามัดปากถุงขยะให้มิดชิด และนำลงมาทิ้งที่จุดทิ้งขยะรวมชั้น 1 ห้ามวางถุงขยะไว้บริเวณทางเดินหน้าห้องพักโดยเด็ดขาด"
      },
      {
        icon: "🚭",
        title: "ความปลอดภัยจากอัคคีภัย & สารเสพติด",
        desc: "ห้ามสูบบุหรี่ภายในอาคารและระเบียงห้องพัก, ห้ามใช้เตาแก๊สหรือเตาฟืน, ถอดปลั๊กเครื่องใช้ไฟฟ้าทุกครั้งก่อนออกจากห้องพัก"
      },
      {
        icon: "🚗",
        title: "การใช้บริการที่จอดรถ",
        desc: "จอดรถเฉพาะช่องที่กำหนดและติดสติ๊กเกอร์ประจำหอพักที่กระจกหน้ารถ ห้ามจอดขวางทางหนีไฟหรือช่องทางฉุกเฉินเด็ดขาด"
      },
      {
        icon: "🐾",
        title: "ระเบียบเกี่ยวกับสัตว์เลี้ยง",
        desc: "ไม่อนุญาตให้เลี้ยงสัตว์เลี้ยงทุกชนิด (รวมถึงสุนัข, แมว, สัตว์เลื้อยคลาน) ภายในห้องพักและพื้นที่ส่วนกลาง"
      }
    ]
  },
  en: {
    modal_title: "Dormitory Information & Emergency Contacts",
    tab_emergency: "📞 Emergency Contacts",
    tab_rules: "📜 Dormitory Rules",
    emergency_intro: "💡 Tap \"Call Now\" on your mobile phone to directly dial any contact.",
    rules_intro: "📋 Community guidelines for the peaceful living and safety of all DormEase residents.",
    btn_call: "📞 Call Now",
    call_title: (name) => `Call ${name}`,
    btn_close: "Understood / Close",
    contacts: [
      {
        title: "Dormitory Manager",
        desc: "General inquiries, lease contract, payments, spare key requests",
        phone: "099-614-4478",
        tel: "0996144478",
        icon: "🏢",
        badge: "Main / PromptPay",
        badgeClass: "badge-primary"
      },
      {
        title: "Emergency Maintenance",
        desc: "Burst pipe, electrical short circuit, stuck elevator",
        phone: "089-876-5432",
        tel: "0898765432",
        icon: "🔧",
        badge: "24 Hours",
        badgeClass: "badge-warning"
      },
      {
        title: "Security Guard Station",
        desc: "Suspicious activity, parking assistance, late night entrance",
        phone: "02-345-6789",
        tel: "023456789",
        icon: "👮",
        badge: "Security Gate",
        badgeClass: "badge-success"
      },
      {
        title: "Police Emergency Center",
        desc: "Police station / emergency dispatch (191)",
        phone: "191",
        tel: "191",
        icon: "🚨",
        badge: "Emergency",
        badgeClass: "badge-danger"
      },
      {
        title: "Medical Emergency Ambulance",
        desc: "Medical emergencies, accidents, ambulance (1669)",
        phone: "1669",
        tel: "1669",
        icon: "🚑",
        badge: "24h Free",
        badgeClass: "badge-danger"
      },
      {
        title: "Metropolitan / Provincial Electricity",
        desc: "Area-wide power outages, electrical transformer hazards",
        phone: "1129",
        tel: "1129",
        icon: "⚡",
        badge: "Utility",
        badgeClass: "badge-neutral"
      },
      {
        title: "Metropolitan / Provincial Waterworks",
        desc: "Water main burst, supply outage, major water issues",
        phone: "1125",
        tel: "1125",
        icon: "💧",
        badge: "Utility",
        badgeClass: "badge-neutral"
      }
    ],
    rules: [
      {
        icon: "🕒",
        title: "Building Hours & Access Security",
        desc: "24-hour keycard access. Main entrance gates are locked between 23:00 and 05:00. Overnight non-resident guests are strictly prohibited without prior staff registration."
      },
      {
        icon: "🤫",
        title: "Quiet Hours & Noise Consideration",
        desc: "Please refrain from loud noise, parties, or high-volume sound/TV after 22:00 to respect your neighbors' rest and privacy."
      },
      {
        icon: "🗑️",
        title: "Waste Disposal & Sanitation",
        desc: "Please tie garbage bags securely and deposit them in the 1st floor waste disposal zone. Leaving trash bags in hallway corridors is strictly forbidden."
      },
      {
        icon: "🚭",
        title: "Fire Safety & Substance Prohibitions",
        desc: "Smoking is strictly forbidden indoors and on balconies. Open-flame stoves are prohibited. Unplug all major electric appliances before leaving your room."
      },
      {
        icon: "🚗",
        title: "Parking Facilities",
        desc: "Park only in designated parking bays with your valid resident sticker displayed. Blocking fire exit passages or emergency driveways is prohibited."
      },
      {
        icon: "🐾",
        title: "Pet Regulations",
        desc: "Pets of any kind (including dogs, cats, reptiles, and birds) are strictly prohibited inside tenant rooms and common areas."
      }
    ]
  }
};

export default function DormInfoModal({ onClose }) {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const [activeTab, setActiveTab] = useState("emergency"); // emergency | rules

  return (
    <Modal title={t.modal_title} onClose={onClose}>
      <div className="dorm-info-tabs">
        <button
          type="button"
          className={`dorm-info-tab-btn ${activeTab === "emergency" ? "active" : ""}`}
          onClick={() => setActiveTab("emergency")}
        >
          {t.tab_emergency}
        </button>
        <button
          type="button"
          className={`dorm-info-tab-btn ${activeTab === "rules" ? "active" : ""}`}
          onClick={() => setActiveTab("rules")}
        >
          {t.tab_rules}
        </button>
      </div>

      <div className="dorm-info-content">
        {activeTab === "emergency" && (
          <div className="emergency-list">
            <p className="emergency-intro-note">
              {t.emergency_intro}
            </p>
            {t.contacts.map((c, i) => (
              <div key={i} className="emergency-card">
                <div className="emergency-icon-wrap">{c.icon}</div>
                <div className="emergency-details">
                  <div className="emergency-header">
                    <span className="emergency-title">{c.title}</span>
                    <span className={`emergency-badge ${c.badgeClass}`}>{c.badge}</span>
                  </div>
                  <p className="emergency-desc">{c.desc}</p>
                  <div className="emergency-phone-num">{c.phone}</div>
                </div>
                <a href={`tel:${c.tel}`} className="btn-call-action" title={t.call_title(c.title)}>
                  {t.btn_call}
                </a>
              </div>
            ))}
          </div>
        )}

        {activeTab === "rules" && (
          <div className="rules-list">
            <p className="rules-intro-note">
              {t.rules_intro}
            </p>
            {t.rules.map((r, i) => (
              <div key={i} className="rule-card">
                <div className="rule-icon">{r.icon}</div>
                <div className="rule-details">
                  <h4 className="rule-title">{r.title}</h4>
                  <p className="rule-desc">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="modal-actions" style={{ marginTop: 20, justifyContent: "flex-end" }}>
        <button type="button" className="btn-primary" onClick={onClose}>
          {t.btn_close}
        </button>
      </div>
    </Modal>
  );
}
