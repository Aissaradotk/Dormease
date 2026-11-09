import { useState } from "react";

/* แชทบอทตอบคำถามพื้นฐานแบบ keyword matching — ไม่ต้องใช้ AI API key
   หากต้องการต่อ AI จริง (OpenAI/Claude) ในอนาคต ให้เปลี่ยนฟังก์ชัน getBotReply
   ให้เรียก backend endpoint ใหม่ เช่น POST /api/chatbot แทน */
const FAQ = [
  { keys: ["ห้องว่าง", "ห้องเหลือ"], a: "ดูจำนวนห้องว่างได้ที่หน้า Dashboard หรือหน้า Rooms ครับ/ค่ะ" },
  { keys: ["เพิ่มห้อง", "สร้างห้อง"], a: 'ไปที่เมนู Rooms แล้วกดปุ่ม "+ เพิ่มห้อง" กรอกข้อมูลแล้วบันทึกได้เลยครับ/ค่ะ' },
  { keys: ["เพิ่มผู้เช่า", "ผู้เช่าใหม่"], a: 'ไปที่เมนู Tenants กดปุ่ม "+ เพิ่มผู้เช่า" แล้วเลือกห้องที่จะจับคู่ได้เลยครับ/ค่ะ' },
  { keys: ["ค่าเช่า", "ชำระเงิน", "จ่ายเงิน", "payment"], a: 'บันทึกค่าเช่าได้ที่เมนู Payments กดปุ่ม "+ บันทึกค่าเช่า" และกดที่ป้ายสถานะเพื่อสลับ ชำระแล้ว/ยังไม่ชำระ ได้เลยครับ/ค่ะ' },
  { keys: ["จับคู่", "ห้องพัก"], a: 'ตอนเพิ่มหรือแก้ไขผู้เช่า จะมีช่อง "จับคู่ห้องพัก" ให้เลือกห้องได้เลยครับ/ค่ะ' },
  { keys: ["ห้องของฉัน", "ห้องพักของฉัน"], a: 'ผู้เช่าดูข้อมูลห้องพักของตัวเองได้ที่เมนู "ห้องของฉัน" ครับ/ค่ะ' },
  { keys: ["ลบห้อง"], a: "ลบห้องได้ที่หน้า Rooms แต่ระบบจะไม่ให้ลบถ้าห้องนั้นยังมีผู้เช่าอยู่ครับ/ค่ะ" },
  { keys: ["ติดต่อ", "เบอร์โทร"], a: "ติดต่อฝ่ายดูแลหอพักได้ตามช่องทางที่แจ้งไว้ หรือสอบถามเจ้าของหอพักโดยตรงครับ/ค่ะ" },
];
const QUICK = ["ห้องว่างมีไหม", "เพิ่มผู้เช่ายังไง", "บันทึกค่าเช่ายังไง"];

function getBotReply(text) {
  const lower = text.toLowerCase();
  const matched = FAQ.find((f) => f.keys.some((k) => lower.includes(k.toLowerCase())));
  return matched
    ? matched.a
    : "ขออภัยครับ/ค่ะ ยังไม่มีคำตอบสำหรับคำถามนี้ ลองถามเกี่ยวกับ ห้อง ผู้เช่า หรือค่าเช่า ดูนะครับ/คะ";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { who: "bot", text: "สวัสดีค่ะ/ครับ 👋 ผู้ช่วย DormEase พร้อมตอบคำถามเกี่ยวกับการใช้งานระบบ มีอะไรให้ช่วยไหมคะ/ครับ?" },
  ]);
  const [input, setInput] = useState("");

  function send(text) {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages((m) => [...m, { who: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { who: "bot", text: getBotReply(t) }]);
    }, 350);
  }

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen((o) => !o)}>
        💬
      </button>
      {open && (
        <div className="chat-window">
          <div className="chat-head">
            <span className="dot" />
            <div>
              <b>DormEase Assistant</b>
              <span>ตอบคำถามที่พบบ่อยอัตโนมัติ</span>
            </div>
          </div>
          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.who}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-quick">
            {QUICK.map((q) => (
              <button key={q} className="chip" onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="พิมพ์คำถาม..."
            />
            <button onClick={() => send()}>ส่ง</button>
          </div>
        </div>
      )}
    </>
  );
}
