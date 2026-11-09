# -*- coding: utf-8 -*-
"""
Build Self-Contained Interactive HTML5 Animated Presentation for DormEase
Features:
- 25 Animated Slides matching the exact academic outline
- Embedded Base64 real UI screenshots
- Modern SaaS Futuristic Dark/Light Glassmorphism Theme (#0B1026, #387BFF, #00D9FF)
- Keyboard navigation (Arrow Left/Right, Space, Home, End, F for Fullscreen)
- Built-in Presenter Speech Script Drawer (30-60 seconds per slide)
- Print/Export to PDF CSS support
"""

import os
import base64
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "real_screenshots")
DESKTOP_DIR = os.path.join(os.environ.get('USERPROFILE', r'C:\Users\LOQ'), 'Desktop')
OUTPUT_HTML = os.path.join(DESKTOP_DIR, "DormEase_Presentation_Live.html")
OUTPUT_HTML_LOCAL = os.path.join(BASE_DIR, "DormEase_Presentation_Live.html")

def get_base64_image(filename):
    path = os.path.join(SCREENSHOTS_DIR, filename)
    if os.path.exists(path):
        with open(path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
            return f"data:image/png;base64,{encoded}"
    return ""

img_login = get_base64_image("real_login.png")
img_dash  = get_base64_image("real_1_dashboard.png")
img_rooms = get_base64_image("real_2_rooms.png")
img_bills = get_base64_image("real_3_monthly_bills.png")
img_pay   = get_base64_image("real_4_payments.png")
img_rep   = get_base64_image("real_5_repairs.png")
img_tpay  = get_base64_image("real_8_tenant_payment.png")

html_content = f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DormEase — Senior Academic Project Defense Presentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg-deep: #0B1026;
      --bg-midnight: #111C44;
      --card-bg: rgba(21, 31, 69, 0.85);
      --card-border: rgba(56, 123, 255, 0.4);
      --neon-cyan: #00D9FF;
      --electric-blue: #387BFF;
      --purple-glow: #865DFF;
      --emerald: #10B981;
      --amber: #F59E0B;
      --rose: #F43F5E;
      --text-white: #FFFFFF;
      --text-soft: #D2DCF0;
      --text-muted: #8CA0C8;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Prompt', 'Inter', sans-serif;
      background: var(--bg-deep);
      color: var(--text-white);
      overflow: hidden;
      height: 100vh;
      width: 100vw;
      user-select: none;
    }}

    /* Presentation Deck Container */
    #deck {{
      position: relative;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle at 50% 30%, #172554 0%, #0B1026 70%);
    }}

    .slide {{
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 40px 70px 70px 70px;
      display: none;
      flex-direction: column;
      justify-content: flex-start;
      opacity: 0;
      transform: scale(0.98);
      transition: opacity 0.45s ease, transform 0.45s ease;
    }}

    .slide.active {{
      display: flex;
      opacity: 1;
      transform: scale(1);
    }}

    /* Header Styling */
    .slide-tag {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 16px;
      background: rgba(56, 123, 255, 0.2);
      border: 1px solid var(--neon-cyan);
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      color: var(--neon-cyan);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 10px;
      width: fit-content;
    }}

    .slide-title {{
      font-size: 34px;
      font-weight: 700;
      color: var(--text-white);
      line-height: 1.25;
      margin-bottom: 6px;
    }}

    .slide-subtitle {{
      font-size: 17px;
      color: var(--neon-cyan);
      margin-bottom: 24px;
      font-weight: 400;
    }}

    /* Card Layouts */
    .grid-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      height: calc(100% - 130px);
    }}

    .grid-3 {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      height: calc(100% - 130px);
    }}

    .grid-4 {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      height: calc(100% - 130px);
    }}

    .grid-feature {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: 1fr 1fr;
      gap: 18px;
      height: calc(100% - 130px);
    }}

    .card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 24px 26px;
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
    }}

    .card-cyan {{ border-color: var(--neon-cyan); }}
    .card-blue {{ border-color: var(--electric-blue); }}
    .card-purple {{ border-color: var(--purple-glow); }}
    .card-emerald {{ border-color: var(--emerald); }}
    .card-rose {{ border-color: var(--rose); }}
    .card-amber {{ border-color: var(--amber); }}

    .card-title {{
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .card-body {{
      font-size: 15.5px;
      line-height: 1.65;
      color: var(--text-soft);
    }}

    /* Browser Mockup Frame */
    .browser-frame {{
      background: #0f172a;
      border: 1.5px solid var(--neon-cyan);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 45px rgba(0, 217, 255, 0.15);
      height: 100%;
    }}

    .browser-top {{
      background: #1e293b;
      height: 38px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      gap: 8px;
    }}

    .browser-dot {{
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }}
    .dot-red {{ background: var(--rose); }}
    .dot-yellow {{ background: var(--amber); }}
    .dot-green {{ background: var(--emerald); }}

    .browser-addr {{
      flex: 1;
      margin-left: 12px;
      background: #0f172a;
      border-radius: 6px;
      height: 24px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 12px;
      color: #94a3b8;
      font-family: 'Inter', monospace;
    }}

    .browser-img {{
      flex: 1;
      width: 100%;
      height: calc(100% - 38px);
      object-fit: cover;
      object-position: top center;
    }}

    /* UI Controls Bottom Bar */
    #controls {{
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 123, 255, 0.4);
      padding: 8px 24px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }}

    .btn-ctrl {{
      background: transparent;
      border: none;
      color: var(--text-white);
      font-size: 18px;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 8px;
      transition: background 0.2s, color 0.2s;
    }}

    .btn-ctrl:hover {{
      background: rgba(56, 123, 255, 0.3);
      color: var(--neon-cyan);
    }}

    #slide-indicator {{
      font-size: 14px;
      font-weight: 600;
      color: var(--neon-cyan);
      min-width: 70px;
      text-align: center;
    }}

    /* Speaker Notes Drawer */
    #notes-drawer {{
      position: fixed;
      bottom: -320px;
      left: 0;
      width: 100%;
      height: 300px;
      background: rgba(11, 16, 38, 0.96);
      border-top: 2px solid var(--neon-cyan);
      padding: 24px 60px;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(16px);
      transition: bottom 0.35s ease;
      z-index: 999;
      overflow-y: auto;
    }}

    #notes-drawer.open {{
      bottom: 0;
    }}

    .notes-title {{
      font-size: 18px;
      font-weight: 700;
      color: var(--amber);
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}

    .notes-content {{
      font-size: 16px;
      line-height: 1.8;
      color: var(--text-white);
    }}
  </style>
</head>
<body>

<div id="deck">

  <!-- SLIDE 1 -->
  <div class="slide active">
    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
      <div class="slide-tag">✨ SENIOR ACADEMIC PROJECT DEFENSE • KU SRIRACHA</div>
      <h1 style="font-size: 48px; font-weight: 800; color: #fff; line-height: 1.25; margin-bottom: 14px;">
        ระบบบริหารจัดการหอพักและตรวจจับการชำระเงินอัตโนมัติ<br>ด้วยการสุ่มเศษสตางค์
      </h1>
      <p style="font-size: 22px; color: var(--neon-cyan); font-family: 'Inter'; font-weight: 600; margin-bottom: 36px;">
        Smart Dormitory Management and Automated Payment Verification System: DormEase
      </p>
      
      <div style="background: rgba(21, 31, 69, 0.9); border: 1.5px solid var(--electric-blue); border-radius: 18px; padding: 22px 50px; max-width: 850px; margin-bottom: 30px;">
        <p style="font-size: 16px; color: var(--amber); font-weight: 700; margin-bottom: 6px;">คณะผู้จัดทำโครงงาน</p>
        <p style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 6px;">
          นวพรรษ เนียมศรี &nbsp;•&nbsp; วิศิษฏ์ มาลาอบ &nbsp;•&nbsp; ชินวุธ สารศิริ
        </p>
        <p style="font-size: 16px; color: var(--text-soft);">
          ภาควิชาวิทยาการเทคโนโลยีและดิจิทัล คณะวิทยาศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา
        </p>
      </div>

      <div style="display:flex; gap: 16px;">
        <span class="slide-tag" style="border-color: var(--emerald); color: var(--emerald);">🚀 Zero Gateway Fee</span>
        <span class="slide-tag" style="border-color: var(--neon-cyan); color: var(--neon-cyan);">⚡ 1.83s Real-time Verification</span>
        <span class="slide-tag" style="border-color: var(--purple-glow); color: var(--purple-glow);">🔒 100% Anti-Slip Spoofing</span>
        <span class="slide-tag" style="border-color: var(--amber); color: var(--amber);">📱 Responsive SaaS</span>
      </div>
    </div>
  </div>

  <!-- SLIDE 2 -->
  <div class="slide">
    <div class="slide-tag">Executive Summary</div>
    <div class="slide-title">DormEase คืออะไร? (Project Overview)</div>
    <div class="slide-subtitle">ระบบบริหารจัดการหอพักครบวงจร ผสานนวัตกรรมตัดยอดบิลอัตโนมัติด้วยเศษสตางค์ระบุตัวตน</div>
    <div class="grid-2">
      <div class="card card-blue" style="justify-content: center;">
        <div class="card-title" style="color: var(--neon-cyan);">🏢 นิยามและความเป็นมาของโครงงาน</div>
        <div class="card-body" style="font-size: 17px; line-height: 1.8;">
          • <strong>DormEase</strong> เป็นเว็บแอปพลิเคชันบริหารจัดการหอพักแบบ Responsive Web พัฒนาบนสถาปัตยกรรม Three-Tier Architecture<br><br>
          • <strong>จุดเปลี่ยนนวัตกรรม:</strong> ยกระดับจากการตรวจสลิปแบบเดิม (Manual & Reactive) สู่ระบบดักจับแจ้งเตือนเงินเข้าของธนาคารแบบเรียลไทม์ (Proactive Event-Driven)<br><br>
          • <strong>หัวใจสำคัญ:</strong> สุ่มเศษสตางค์ไม่ซ้ำกัน (< 1 บาท) ในแต่ละรอบบิล ทำให้ยอดเงินกลายเป็นรหัสระบุบิลเฉพาะตัว จับคู่ผ่าน Fast Native OCR สำเร็จใน 1.83 วินาที ปราศจากค่าธรรมเนียมธุรกรรม
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap: 16px;">
        <div class="card card-blue" style="flex:1;">
          <div class="card-title" style="color: var(--electric-blue);">🏢 All-in-One Management</div>
          <div class="card-body">จัดการผังห้องพัก ทะเบียนผู้เช่า สัญญา มิเตอร์น้ำ-ไฟ และบิลรายเดือนอย่างเป็นระบบ</div>
        </div>
        <div class="card card-purple" style="flex:1;">
          <div class="card-title" style="color: var(--purple-glow);">🎲 Unique Satang Identifier</div>
          <div class="card-body">สุ่มทศนิยมระดับสตางค์ไม่ซ้ำ (< 1 ฿) ระบุตัวตนผู้โอนได้แม่นยำ 100% ไร้ข้อผิดพลาด</div>
        </div>
        <div class="card card-emerald" style="flex:1;">
          <div class="card-title" style="color: var(--emerald);">⚡ Zero-Cost Slip-less Verification</div>
          <div class="card-body">ดักจับแจ้งเตือนเงินเข้าจาก LINE Desktop ด้วย Native OCR ตัดยอดทันที ไร้ค่าธรรมเนียม Gateway</div>
        </div>
        <div class="card card-amber" style="flex:1;">
          <div class="card-title" style="color: var(--amber);">🛡️ 100% Anti-Fraud Protection</div>
          <div class="card-body">ป้องกันสลิปปลอมแปลง สลิปตัดต่อวันที่ และการส่งสลิปซ้ำได้อย่างสมบูรณ์แบบ</div>
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 3 -->
  <div class="slide">
    <div class="slide-tag">Problem Discovery</div>
    <div class="slide-title">ปัญหาการบริหารหอพักแบบเดิม (Pain Points)</div>
    <div class="slide-subtitle">กระบวนการทำงานแบบ Manual ก่อให้เกิดความล่าช้า ข้อผิดพลาด และความเสียหายทางการเงิน</div>
    <div class="grid-3">
      <div class="card card-rose">
        <div style="font-size: 40px; margin-bottom: 10px;">❌</div>
        <div class="card-title" style="color: var(--rose);">1. จดมิเตอร์ด้วยมือ<br><span style="font-size:14px; font-weight:400; color:var(--text-muted);">(Manual Meter Reading)</span></div>
        <div class="card-body">
          • ผู้ดูแลต้องเดินจดเลขมิเตอร์ทุกห้องทีละตัว<br><br>
          • เกิดข้อผิดพลาดจากการอ่านเลขและคำนวณเงิน<br><br>
          • เสียเวลาในการคีย์ข้อมูลลงตารางคำนวณซ้ำซ้อน<br><br>
          • การออกบิลล่าช้า ผู้เช่าได้รับใบแจ้งหนี้ไม่พร้อมกัน
        </div>
      </div>
      <div class="card card-amber">
        <div style="font-size: 40px; margin-bottom: 10px;">⏳</div>
        <div class="card-title" style="color: var(--amber);">2. ภาระตรวจสลิปโอนเงิน<br><span style="font-size:14px; font-weight:400; color:var(--text-muted);">(Manual Slip Bottleneck)</span></div>
        <div class="card-body">
          • สิ้นเดือนสลิปส่งเข้ามาพร้อมกันหลายสิบ/ร้อยห้อง<br><br>
          • ผู้ดูแลต้องเปิดดูรูปสลิปเทียบกับสเตทเมนต์ทีละใบ<br><br>
          • ผู้เช่าต้องรอผู้ดูแลมากดอนุมัตินาน 2-24 ชั่วโมง<br><br>
          • งานบริการและงานซ่อมบำรุงอื่นต้องหยุดชะงัก
        </div>
      </div>
      <div class="card card-purple">
        <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
        <div class="card-title" style="color: var(--purple-glow);">3. เสี่ยงสลิปปลอมและสลิปซ้ำ<br><span style="font-size:14px; font-weight:400; color:var(--text-muted);">(Slip Spoofing & Fraud)</span></div>
        <div class="card-body">
          • ปัจจุบันมีแอปตัดต่อรูปภาพสลิปที่แนบเนียนมาก<br><br>
          • มีการนำสลิปงวดเก่ามาวนส่งซ้ำ (Replay Attack)<br><br>
          • หอพักขนาดกลาง-ย่อมไม่มีระบบตรวจสลิปอัตโนมัติ<br><br>
          • ก่อให้เกิดความสูญเสียทางการเงินโดยตรงแก่เจ้าของหอ
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 4 -->
  <div class="slide">
    <div class="slide-tag">Transformation</div>
    <div class="slide-title">DormEase แก้ปัญหาอย่างไร? (Before vs After)</div>
    <div class="slide-subtitle">เปรียบเทียบกระบวนการทำงานแบบเดิม สู่ระบบอัตโนมัติไร้รอยต่อของ DormEase</div>
    <div class="grid-2">
      <div class="card card-rose" style="background: rgba(30, 20, 35, 0.85);">
        <div class="card-title" style="color: var(--rose);">🔴 BEFORE: ระบบหอพักแบบดั้งเดิม</div>
        <div class="card-body" style="font-size: 16px; line-height: 1.8;">
          • บันทึกมิเตอร์ด้วยกระดาษ คีย์ซ้ำซ้อน มีโอกาสผิดพลาดสูง<br><br>
          • ผู้เช่าโอนเงินแล้วต้องแคปรูปสลิป ส่งผ่านแชท LINE ส่วนตัว<br><br>
          • เจ้าของหอพักต้องเปิดดูรูปทีละใบแล้วเช็กยอดเงินในแอปธนาคาร<br><br>
          • ใช้เวลาอนุมัติบิลนาน 2 - 24 ชั่วโมงต่อห้อง<br><br>
          • เสี่ยงรับสลิปปลอมแปลงหรือสลิปตัดต่อวันที่โดยไม่รู้ตัว<br><br>
          • หากติดตั้ง Payment Gateway ธนาคาร มีค่าธรรมเนียม 1.5 - 3%
        </div>
      </div>
      <div class="card card-cyan" style="background: rgba(16, 32, 45, 0.85);">
        <div class="card-title" style="color: var(--neon-cyan);">🟢 AFTER: ระบบ DormEase ยุคใหม่</div>
        <div class="card-body" style="font-size: 16px; line-height: 1.8;">
          • ระบบคำนวณค่าน้ำ-ค่าไฟให้อัตโนมัติ พร้อมสุ่มเศษสตางค์ไม่ซ้ำ<br><br>
          • ผู้เช่าสแกน PromptPay QR Code ล็อกยอดตรงเป๊ะ ไม่ต้องแนบสลิป<br><br>
          • เมื่อเงินเข้า ธนาคารแจ้งเตือนผ่าน LINE Desktop ทันที<br><br>
          • Fast WinRT OCR อ่านยอดเงินเสร็จใน 9.4 ms ตัดยอดบิลอัตโนมัติ<br><br>
          • อนุมัติสำเร็จเฉลี่ยใน 1.83 วินาที หน้าเว็บอัปเดตสถานะทันที<br><br>
          • ต้นทุนค่าธรรมเนียมธุรกรรมเป็นศูนย์ (Zero Transaction Cost 100%)
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 5 -->
  <div class="slide">
    <div class="slide-tag">Project Goals</div>
    <div class="slide-title">วัตถุประสงค์ของโครงงาน (Objectives)</div>
    <div class="slide-subtitle">4 เป้าหมายสำคัญในการวิจัยและพัฒนาระบบ DormEase</div>
    <div style="display:flex; flex-direction:column; gap: 14px; height: calc(100% - 130px);">
      <div class="card card-blue" style="flex:1; flex-direction:row; align-items:center; gap:20px; padding: 18px 26px;">
        <span style="font-size:36px; font-weight:800; color:var(--electric-blue); font-family:'Inter';">01</span>
        <div>
          <div style="font-size:18px; font-weight:700; color:#fff;">ออกแบบและพัฒนาเว็บแอปพลิเคชันบริหารหอพักแบบ Responsive Web</div>
          <div style="font-size:14px; color:var(--text-soft);">รองรับการทำงานทั้งบนคอมพิวเตอร์และสมาร์ทโฟน ด้วย React 18, Vite, Tailwind CSS และ Node.js</div>
        </div>
      </div>
      <div class="card card-purple" style="flex:1; flex-direction:row; align-items:center; gap:20px; padding: 18px 26px;">
        <span style="font-size:36px; font-weight:800; color:var(--purple-glow); font-family:'Inter';">02</span>
        <div>
          <div style="font-size:18px; font-weight:700; color:#fff;">พัฒนาระบบคำนวณมิเตอร์และสุ่มเศษสตางค์ไม่ซ้ำ (Unique Satang Algorithm)</div>
          <div style="font-size:14px; color:var(--text-soft);">ใช้อัลกอริทึม Fisher-Yates สุ่มเศษทศนิยมระดับสตางค์ (< 1 บาท) ทำให้ยอดเงินทำหน้าที่เป็นรหัสระบุบิลเฉพาะตัว</div>
        </div>
      </div>
      <div class="card card-cyan" style="flex:1; flex-direction:row; align-items:center; gap:20px; padding: 18px 26px;">
        <span style="font-size:36px; font-weight:800; color:var(--neon-cyan); font-family:'Inter';">03</span>
        <div>
          <div style="font-size:18px; font-weight:700; color:#fff;">พัฒนาระบบตรวจจับการชำระเงินอัตโนมัติผ่าน LINE Desktop ด้วย Native OCR</div>
          <div style="font-size:14px; color:var(--text-soft);">สร้าง LinePaymentListener.pyw ร่วมกับ Windows Media OCR สกัดตัวเลขเงินเข้าและตัดยอดบิลแบบเรียลไทม์ไร้สลิป</div>
        </div>
      </div>
      <div class="card card-emerald" style="flex:1; flex-direction:row; align-items:center; gap:20px; padding: 18px 26px;">
        <span style="font-size:36px; font-weight:800; color:var(--emerald); font-family:'Inter';">04</span>
        <div>
          <div style="font-size:18px; font-weight:700; color:#fff;">ทดสอบประสิทธิภาพการทำงานแบบกล่องดำและประเมินความพึงพอใจ</div>
          <div style="font-size:14px; color:var(--text-soft);">ดำเนินการทดสอบ Black-box Testing 5 กรณีหลัก และประเมินความพึงพอใจจากกลุ่มตัวอย่างผู้ใช้จริง 15 คน</div>
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 6 -->
  <div class="slide">
    <div class="slide-tag">System Boundary</div>
    <div class="slide-title">ขอบเขตของระบบและกลุ่มผู้ใช้งาน (User Scope)</div>
    <div class="slide-subtitle">การแยกสิทธิ์อย่างเด็ดขาดด้วยระบบ Role-Based Access Control (RBAC)</div>
    <div class="grid-2">
      <div class="card card-blue">
        <div class="card-title" style="color: var(--electric-blue);">👑 ผู้ดูแล / เจ้าของหอพัก (Admin / Owner)</div>
        <div class="card-body" style="font-size: 15.5px; line-height: 1.8;">
          • <strong>Dashboard:</strong> สรุปอัตราครองห้อง รายรับ และบิลค้างชำระแบบสด<br>
          • <strong>ผังห้องพัก (Rooms):</strong> จัดการสถานะห้อง ประเภทห้อง และราคา<br>
          • <strong>ทะเบียนผู้เช่า (Tenants):</strong> บันทึกสัญญาเช่าและข้อมูลลูกบ้าน<br>
          • <strong>บิลรายเดือน (Monthly Bills):</strong> บันทึกมิเตอร์ คำนวณเงิน ออกบิล<br>
          • <strong>สุ่มเศษสตางค์:</strong> กดสุ่มทศนิยมไม่ซ้ำ และแจ้งเตือนบิลในคลิกเดียว<br>
          • <strong>การเงิน (Payments):</strong> ตรวจสอบสลิปและประวัติการโอนเงินเข้า<br>
          • <strong>งานบริการ:</strong> จัดการงานแจ้งซ่อมบำรุง และบันทึกการย้ายออก
        </div>
      </div>
      <div class="card card-emerald">
        <div class="card-title" style="color: var(--emerald);">🏠 ผู้เช่าห้องพัก / ลูกบ้าน (Tenant)</div>
        <div class="card-body" style="font-size: 15.5px; line-height: 1.8;">
          • <strong>ห้องของฉัน (My Room):</strong> ดูรายละเอียดห้องพักและสัญญาเช่า<br>
          • <strong>ใบแจ้งหนี้ (My Bills):</strong> ตรวจสอบค่าเช่าและมิเตอร์น้ำ-ไฟประจำเดือน<br>
          • <strong>หน้าชำระเงิน (Payments):</strong> สแกน PromptPay QR ล็อกยอดตรงเป๊ะ<br>
          • <strong>Real-time Status:</strong> ไฟสถานะตรวจเงินเข้าอัตโนมัติ (Silent Polling 3s)<br>
          • <strong>ระบบสำรอง:</strong> ปุ่ม 'ฉันโอนเงินแล้ว' และช่องทางแนบสลิป P2P<br>
          • <strong>แจ้งซ่อมออนไลน์ (Repairs):</strong> ส่งคำขอซ่อมพร้อมติดตามสถานะงานช่าง<br>
          • <strong>ขอย้ายออกล่วงหน้า:</strong> บันทึกคำร้องและพิมพ์ใบเสร็จ (e-Receipt)
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 7 -->
  <div class="slide">
    <div class="slide-tag">Feature Matrix</div>
    <div class="slide-title">ภาพรวมฟังก์ชันหลักของระบบ (8 Core Features)</div>
    <div class="slide-subtitle">ครอบคลุมทุกวงจรชีวิตการดำเนินงานหอพัก (Full Dormitory Lifecycle)</div>
    <div class="grid-feature">
      <div class="card card-blue"><div class="card-title" style="color:var(--electric-blue);">🔐 Auth & RBAC</div><div class="card-body">ล็อกอินแยกสิทธิ์ ปลอดภัยด้วย JWT Token และ Bcrypt Password Hash</div></div>
      <div class="card card-cyan"><div class="card-title" style="color:var(--neon-cyan);">📊 Live Dashboard</div><div class="card-body">สรุปสถานะห้อง อัตราครองห้อง รายรับ และแจ้งเตือนกิจกรรมแบบสด</div></div>
      <div class="card card-purple"><div class="card-title" style="color:var(--purple-glow);">🏢 Room Matrix</div><div class="card-body">จัดการห้องพัก ประเภทห้อง ราคา สัญญาเช่า และสถานะห้องว่าง</div></div>
      <div class="card card-amber"><div class="card-title" style="color:var(--amber);">⚡ Meter & Billing</div><div class="card-body">บันทึกมิเตอร์น้ำ-ไฟ คำนวณบิล และแจ้งเตือนลูกบ้านใน 1-Click</div></div>
      <div class="card card-emerald"><div class="card-title" style="color:var(--emerald);">🎲 Unique Satang</div><div class="card-body">สุ่มทศนิยมไม่ซ้ำ (<1 ฿) ระบุตัวตนผู้โอนได้แม่นยำ 100%</div></div>
      <div class="card card-blue"><div class="card-title" style="color:var(--electric-blue);">🤖 Fast OCR Verify</div><div class="card-body">ดักจับ LINE สกัดยอดใน 9.4 ms ตัดยอดบิลใน 1.83 วินาที ไร้สลิป</div></div>
      <div class="card card-rose"><div class="card-title" style="color:var(--rose);">🔧 Maintenance Hub</div><div class="card-body">แจ้งซ่อมออนไลน์ กำหนดความเร่งด่วน และติดตามสถานะงานซ่อม</div></div>
      <div class="card card-cyan"><div class="card-title" style="color:var(--neon-cyan);">🧾 e-Receipt & Log</div><div class="card-body">บันทึกประวัติการเงิน ออกใบเสร็จรับเงิน และสรุปรายงานรอบบิล</div></div>
    </div>
  </div>

  <!-- SLIDE 8 -->
  <div class="slide">
    <div class="slide-tag">Tech Architecture</div>
    <div class="slide-title">เทคโนโลยีที่ใช้พัฒนา (Technology Stack)</div>
    <div class="slide-subtitle">คัดสรรเครื่องมือประสิทธิภาพสูงระดับ Modern Industry Standard</div>
    <div class="grid-4">
      <div class="card card-blue">
        <div class="card-title" style="color:var(--electric-blue);">🎨 Frontend Tier</div>
        <div class="card-body">
          <strong>React 18</strong><br><span style="color:var(--text-muted); font-size:13px;">SPA UI Framework</span><br><br>
          <strong>Vite 6</strong><br><span style="color:var(--text-muted); font-size:13px;">Lightning Bundler</span><br><br>
          <strong>Tailwind CSS</strong><br><span style="color:var(--text-muted); font-size:13px;">Modern Utility UI</span><br><br>
          <strong>Lucide Icons</strong><br><span style="color:var(--text-muted); font-size:13px;">Crisp Vector Icons</span>
        </div>
      </div>
      <div class="card card-purple">
        <div class="card-title" style="color:var(--purple-glow);">⚙️ Backend Tier</div>
        <div class="card-body">
          <strong>Node.js 20</strong><br><span style="color:var(--text-muted); font-size:13px;">Event-Driven Engine</span><br><br>
          <strong>Express.js</strong><br><span style="color:var(--text-muted); font-size:13px;">RESTful API Gateway</span><br><br>
          <strong>JWT Bearer</strong><br><span style="color:var(--text-muted); font-size:13px;">Stateless Security</span><br><br>
          <strong>Bcrypt.js</strong><br><span style="color:var(--text-muted); font-size:13px;">10-Round Hashing</span>
        </div>
      </div>
      <div class="card card-cyan">
        <div class="card-title" style="color:var(--neon-cyan);">🗄️ Database Tier</div>
        <div class="card-body">
          <strong>MySQL 8.0</strong><br><span style="color:var(--text-muted); font-size:13px;">Relational DBMS</span><br><br>
          <strong>InnoDB Engine</strong><br><span style="color:var(--text-muted); font-size:13px;">ACID Compliance</span><br><br>
          <strong>Connection Pool</strong><br><span style="color:var(--text-muted); font-size:13px;">High Concurrency</span><br><br>
          <strong>Optimized Index</strong><br><span style="color:var(--text-muted); font-size:13px;">Sub-10ms Queries</span>
        </div>
      </div>
      <div class="card card-emerald">
        <div class="card-title" style="color:var(--emerald);">⚡ Desktop Engine</div>
        <div class="card-body">
          <strong>Python 3.13</strong><br><span style="color:var(--text-muted); font-size:13px;">Background Daemon</span><br><br>
          <strong>Win32 ctypes</strong><br><span style="color:var(--text-muted); font-size:13px;">Native Window Hooks</span><br><br>
          <strong>WinRT Media OCR</strong><br><span style="color:var(--text-muted); font-size:13px;">5-15ms Native OCR</span><br><br>
          <strong>PowerShell Worker</strong><br><span style="color:var(--text-muted); font-size:13px;">Persistent Process</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 9 -->
  <div class="slide">
    <div class="slide-tag">Engineering Design</div>
    <div class="slide-title">สถาปัตยกรรมระบบโดยรวม (Three-Tier Architecture)</div>
    <div class="slide-subtitle">การแยกหน้าที่ระหว่าง Client, Server, Database และ Windows Desktop Daemon</div>
    <div style="display:flex; flex-direction:column; gap:16px; height: calc(100% - 130px);">
      <div class="card card-blue" style="flex:1; padding: 18px 24px;">
        <div class="card-title" style="color:var(--electric-blue); font-size:18px;">1. PRESENTATION TIER (ส่วนหน้าผู้ใช้งาน)</div>
        <div class="card-body">React 18 SPA + Tailwind CSS • รองรับการใช้งานผ่าน Responsive Browser บนทุกอุปกรณ์ • Silent Polling อัปเดตสถานะบิลอัตโนมัติทุก 3 วินาที</div>
      </div>
      <div class="card card-cyan" style="flex:1; padding: 18px 24px;">
        <div class="card-title" style="color:var(--neon-cyan); font-size:18px;">2. APPLICATION & LOGIC TIER (เซิร์ฟเวอร์ & ตัวตรวจจับ)</div>
        <div class="card-body">Node.js Express REST API (Port 3007) • ตรรกะคำนวณบิล และสุ่มเศษสตางค์ Fisher-Yates • LinePaymentListener.pyw ทำงานเบื้องหลังบน Windows • Persistent PowerShell Worker + Windows Native Media OCR</div>
      </div>
      <div class="card card-purple" style="flex:1; padding: 18px 24px;">
        <div class="card-title" style="color:var(--purple-glow); font-size:18px;">3. DATA TIER (ฐานข้อมูลทางการเงิน)</div>
        <div class="card-body">MySQL 8.0 (InnoDB) • ตาราง dorm_users, dorm_rooms, dorm_bills, dorm_payments • ACID Transaction Safety & Indexing เพื่อการสืบค้นและตัดยอดบิลระดับมิลลิวินาที</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 10 -->
  <div class="slide">
    <div class="slide-tag">Data Modeling</div>
    <div class="slide-title">การออกแบบฐานข้อมูล (Database Schema Design)</div>
    <div class="slide-subtitle">โครงสร้างตารางเชิงสัมพันธ์ (Relational Database) รองรับความถูกต้องทางการเงิน 100%</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 16px; height: calc(100% - 130px);">
      <div class="card card-blue"><div class="card-title" style="font-size:16px; color:var(--electric-blue);">🗃️ dorm_users</div><div class="card-body">id, email, password_hash, role, full_name, phone<br><small style="color:var(--text-muted)">1 User : 1 ข้อมูลผู้เช่า / เจ้าของหอ</small></div></div>
      <div class="card card-cyan"><div class="card-title" style="font-size:16px; color:var(--neon-cyan);">🗃️ dorm_rooms</div><div class="card-body">id, room_number, room_type, price, status<br><small style="color:var(--text-muted)">1 ห้อง : N บิลรายเดือน</small></div></div>
      <div class="card card-purple"><div class="card-title" style="font-size:16px; color:var(--purple-glow);">🗃️ dorm_tenants</div><div class="card-body">id, user_id, room_id, lease_start, lease_end<br><small style="color:var(--text-muted)">เชื่อมโยง Users กับ Rooms</small></div></div>
      <div class="card card-amber"><div class="card-title" style="font-size:16px; color:var(--amber);">🗃️ dorm_bills</div><div class="card-body">id, room_id, period, total_amount, unique_satang, status<br><small style="color:var(--text-muted)">บันทึกยอดพร้อมเศษสตางค์ระบุตัวตน</small></div></div>
      <div class="card card-emerald"><div class="card-title" style="font-size:16px; color:var(--emerald);">🗃️ dorm_payments</div><div class="card-body">id, bill_id, amount, payment_method, verified_at<br><small style="color:var(--text-muted)">ประวัติการรับเงินและเวลาที่ยืนยัน</small></div></div>
      <div class="card card-rose"><div class="card-title" style="font-size:16px; color:var(--rose);">🗃️ dorm_repairs</div><div class="card-body">id, room_id, title, status, priority, created_at<br><small style="color:var(--text-muted)">ข้อมูลแจ้งซ่อมผูกกับห้องพัก</small></div></div>
    </div>
  </div>

  <!-- SLIDE 11 -->
  <div class="slide">
    <div class="slide-tag">User Interface</div>
    <div class="slide-title">หน้าจอเข้าสู่ระบบ (Login & Authentication)</div>
    <div class="slide-subtitle">ระบบรักษาความปลอดภัย ยืนยันตัวตน และสลับสิทธิ์การใช้งานตามบทบาท</div>
    <div class="grid-2">
      <div class="browser-frame">
        <div class="browser-top">
          <div class="browser-dot dot-red"></div><div class="browser-dot dot-yellow"></div><div class="browser-dot dot-green"></div>
          <div class="browser-addr">🔒 https://dormease.local/login</div>
        </div>
        <img class="browser-img" src="{img_login}" alt="Login Screen">
      </div>
      <div class="card card-blue" style="justify-content:center;">
        <div class="card-title" style="color:var(--neon-cyan);">🔐 ฟังก์ชันสำคัญหน้าล็อกอิน</div>
        <div class="card-body" style="font-size:16px; line-height:1.8;">
          • <strong>Role-Based Access Control:</strong><br>
          จำแนกผู้ใช้ระหว่างเจ้าของหอพัก (Owner) และผู้เช่า (Tenant) อัตโนมัติ<br><br>
          • <strong>Security Standard:</strong><br>
          รหัสผ่านเข้ารหัสด้วย Bcrypt Hash 10 Salt Rounds และออก JWT Bearer Token<br><br>
          • <strong>Multi-Language Support:</strong><br>
          สลับภาษาไทย (TH) และอังกฤษ (ENG) ได้ทันทีที่มุมบนขวา<br><br>
          • <strong>Theme Switcher:</strong><br>
          รองรับทั้งโหมดมืด (Dark Mode) และโหมดสว่าง (Light Mode)
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 12 -->
  <div class="slide">
    <div class="slide-tag">User Interface</div>
    <div class="slide-title">หน้าแดชบอร์ดผู้ดูแลหอพัก (Dashboard Overview)</div>
    <div class="slide-subtitle">ภาพรวมสถานะห้องพัก อัตราการครองห้อง และกิจกรรมล่าสุดของหอพัก</div>
    <div class="grid-2">
      <div class="browser-frame">
        <div class="browser-top">
          <div class="browser-dot dot-red"></div><div class="browser-dot dot-yellow"></div><div class="browser-dot dot-green"></div>
          <div class="browser-addr">🔒 https://dormease.local/dashboard</div>
        </div>
        <img class="browser-img" src="{img_dash}" alt="Dashboard Screen">
      </div>
      <div class="card card-emerald" style="justify-content:center;">
        <div class="card-title" style="color:var(--emerald);">📊 สถิติจริงจากระบบ (Live Metrics)</div>
        <div class="card-body" style="font-size:16px; line-height:1.8;">
          • <strong>Metric Cards ด้านบน:</strong><br>
          สรุปห้องทั้งหมด 6 ห้อง, ห้องว่าง 0 ห้อง, ห้องมีผู้เช่า 6 ห้อง และรายการค้างชำระ 37 รายการ<br><br>
          • <strong>Quick Action Sidebar:</strong><br>
          ปุ่มโทรด่วนฉุกเฉิน 24 ชม., กล่องค้นหาเมนูด่วน และการจัดกลุ่มหมวดหมู่อย่างเป็นระเบียบ<br><br>
          • <strong>Active Tenant List:</strong><br>
          ตารางแสดงผู้เช่าปัจจุบันห้อง 101–333 พร้อมปุ่มเข้าดูข้อมูลห้องพักได้ทันที
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 13 -->
  <div class="slide">
    <div class="slide-tag">User Interface</div>
    <div class="slide-title">หน้าจัดการห้องพักและสถานะสัญญา (Rooms Management)</div>
    <div class="slide-subtitle">ตารางผังห้องพัก ข้อมูลพื้นที่ ขนาดห้อง อัตราค่าเช่า และสถานะการเช่า</div>
    <div class="grid-2">
      <div class="browser-frame">
        <div class="browser-top">
          <div class="browser-dot dot-red"></div><div class="browser-dot dot-yellow"></div><div class="browser-dot dot-green"></div>
          <div class="browser-addr">🔒 https://dormease.local/rooms</div>
        </div>
        <img class="browser-img" src="{img_rooms}" alt="Rooms Screen">
      </div>
      <div class="card card-purple" style="justify-content:center;">
        <div class="card-title" style="color:var(--purple-glow);">🏢 การบริหารผังห้องพัก</div>
        <div class="card-body" style="font-size:16px; line-height:1.8;">
          • <strong>Room Types & Pricing:</strong><br>
          รองรับห้อง Studio (24 ตร.ม.), Corner Studio (26 ตร.ม.) และ 1-Bedroom (32 ตร.ม.) กำหนดราคาแยกตามชั้น<br><br>
          • <strong>Visual Status Badges:</strong><br>
          แสดงป้ายสี 'ไม่ว่าง' (มีผู้เช่า) สีแดงชัดเจน หรือ 'ว่าง' สีเขียว<br><br>
          • <strong>Quick Action Controls:</strong><br>
          ปุ่ม '+ เพิ่มห้อง', ปุ่ม 'แก้ไข', ปุ่ม 'ลบ' และตัวกรองค้นหาตามหมายเลขห้อง
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 14 -->
  <div class="slide">
    <div class="slide-tag">User Interface</div>
    <div class="slide-title">หน้าจัดการบิลและบันทึกมิเตอร์ (Monthly Bills)</div>
    <div class="slide-subtitle">ระบบคำนวณค่าน้ำ-ค่าไฟอัตโนมัติ พร้อมปุ่มสุ่มเศษสตางค์ไม่ซ้ำกัน</div>
    <div class="grid-2">
      <div class="browser-frame">
        <div class="browser-top">
          <div class="browser-dot dot-red"></div><div class="browser-dot dot-yellow"></div><div class="browser-dot dot-green"></div>
          <div class="browser-addr">🔒 https://dormease.local/monthly-bills</div>
        </div>
        <img class="browser-img" src="{img_bills}" alt="Monthly Bills Screen">
      </div>
      <div class="card card-amber" style="justify-content:center;">
        <div class="card-title" style="color:var(--amber);">⚡ นวัตกรรมหน้าบิลรายเดือน</div>
        <div class="card-body" style="font-size:16px; line-height:1.8;">
          • <strong>🎲 ปุ่ม 'สุ่มทศนิยมไม่ซ้ำ (<1 ฿)':</strong><br>
          สร้างเศษสตางค์เฉพาะตัวให้แต่ละบิล เช่น .64 ฿, .65 ฿, .92 ฿, .41 ฿<br><br>
          • <strong>📢 ปุ่ม 'แจ้งบิลทุกลูกค้า':</strong><br>
          ส่งบิลเข้าบัญชีลูกบ้านทุกคนได้ในคลิกเดียว<br><br>
          • <strong>⚡ ปุ่ม 'จำลองเงินเข้า':</strong><br>
          ทดสอบจำลองเงินโอนเข้าเสมือนจริงเพื่อความมั่นใจ<br><br>
          • <strong>สถานะ Real-time:</strong><br>
          แสดงป้าย '✓ ชำระแล้ว' ทันทีเมื่อเงินเข้า
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 15 -->
  <div class="slide">
    <div class="slide-tag">Core Breakthrough</div>
    <div class="slide-title">นวัตกรรมสุ่มเศษสตางค์ระบุตัวตน (Unique Satang)</div>
    <div class="slide-subtitle">เปลี่ยน 'ยอดเงินโอน' ให้กลายเป็นรหัสระบุบิลเฉพาะตัว (Unique Payment Fingerprint)</div>
    <div class="grid-3" style="height: 220px; margin-bottom: 24px;">
      <div class="card card-blue" style="text-align:center; justify-content:center;">
        <div style="font-size:18px; font-weight:700; color:var(--electric-blue);">ห้อง 101 (Room 101)</div>
        <div style="font-size:14px; color:var(--text-soft); margin: 6px 0;">ค่าเช่า: ฿3,500.00 &nbsp;|&nbsp; เศษสตางค์: +0.14 ฿</div>
        <div style="font-size:32px; font-weight:800; color:#fff; font-family:'Inter';">฿3,500.14</div>
      </div>
      <div class="card card-cyan" style="text-align:center; justify-content:center;">
        <div style="font-size:18px; font-weight:700; color:var(--neon-cyan);">ห้อง 102 (Room 102)</div>
        <div style="font-size:14px; color:var(--text-soft); margin: 6px 0;">ค่าเช่า: ฿3,500.00 &nbsp;|&nbsp; เศษสตางค์: +0.72 ฿</div>
        <div style="font-size:32px; font-weight:800; color:#fff; font-family:'Inter';">฿3,500.72</div>
      </div>
      <div class="card card-purple" style="text-align:center; justify-content:center;">
        <div style="font-size:18px; font-weight:700; color:var(--purple-glow);">ห้อง 103 (Room 103)</div>
        <div style="font-size:14px; color:var(--text-soft); margin: 6px 0;">ค่าเช่า: ฿4,200.00 &nbsp;|&nbsp; เศษสตางค์: +0.35 ฿</div>
        <div style="font-size:32px; font-weight:800; color:#fff; font-family:'Inter';">฿4,200.35</div>
      </div>
    </div>
    <div class="card card-emerald" style="height: calc(100% - 370px); justify-content:center;">
      <div class="card-title" style="color:var(--emerald);">💡 ทำไมระบบนี้ถึงตัดปัญหา 'สลิปปลอม' และ 'ค่าธรรมเนียม' ได้ 100%?</div>
      <div class="card-body" style="font-size:16px; line-height:1.7;">
        1. <strong>Fisher-Yates Randomization:</strong> สุ่มเศษสตางค์ 0.01 ถึง 0.99 บาท แบบไม่ซ้ำกันในรอบบิลเดียวกัน ทำให้ทุกบิลมียอดเงินที่ต่างกันแน่นอน<br>
        2. <strong>Self-Identifying Amount:</strong> เมื่อเงินโอนเข้า เช่น 3,500.14 บาท ระบบค้นหาบิลที่ยอดตรงกันได้ทันทีใน 68 ms โดยไม่ต้องอ่านชื่อผู้โอน<br>
        3. <strong>Zero Slip Dependency:</strong> ผู้เช่าไม่ต้องแคปสลิปมาแนบ หมดปัญหาการนำสลิปเก่ามาใช้ซ้ำ หรือการตัดต่อตัวเลขในรูปภาพสลิปอย่างเด็ดขาด
      </div>
    </div>
  </div>

  <!-- SLIDE 16 -->
  <div class="slide">
    <div class="slide-tag">Automated Pipeline</div>
    <div class="slide-title">กระบวนการตรวจจับและตัดยอดบิลอัตโนมัติ (Workflow)</div>
    <div class="slide-subtitle">การประสานงานอัตโนมัติ 8 ขั้นตอน จากออกบิลจนถึงอนุมัติสำเร็จภายใน 1.83 วินาที</div>
    <div class="grid-feature">
      <div class="card card-blue"><div class="card-title" style="color:var(--electric-blue); font-size:15px;">STEP 01</div><div style="font-size:17px; font-weight:700; color:#fff;">1. ออกบิลค่าเช่า</div><div class="card-body" style="font-size:13px;">บันทึกมิเตอร์น้ำ-ไฟ คำนวณเงินประจำงวด</div></div>
      <div class="card card-cyan"><div class="card-title" style="color:var(--neon-cyan); font-size:15px;">STEP 02</div><div style="font-size:17px; font-weight:700; color:#fff;">2. สุ่มเศษสตางค์</div><div class="card-body" style="font-size:13px;">ได้ยอดเฉพาะตัว เช่น 3,500.14 บาท</div></div>
      <div class="card card-blue"><div class="card-title" style="color:var(--electric-blue); font-size:15px;">STEP 03</div><div style="font-size:17px; font-weight:700; color:#fff;">3. PromptPay QR</div><div class="card-body" style="font-size:13px;">สร้าง QR Code ล็อกยอดพร้อมสแกน</div></div>
      <div class="card card-purple"><div class="card-title" style="color:var(--purple-glow); font-size:15px;">STEP 04</div><div style="font-size:17px; font-weight:700; color:#fff;">4. ผู้เช่าโอนเงิน</div><div class="card-body" style="font-size:13px;">สแกนจ่ายผ่าน Mobile Banking ทุกธนาคาร</div></div>
      <div class="card card-amber"><div class="card-title" style="color:var(--amber); font-size:15px;">STEP 05</div><div style="font-size:17px; font-weight:700; color:#fff;">5. LINE แจ้งเตือน</div><div class="card-body" style="font-size:13px;">Krungthai/SCB Connext เด้งบนจอคอม</div></div>
      <div class="card card-cyan"><div class="card-title" style="color:var(--neon-cyan); font-size:15px;">STEP 06</div><div style="font-size:17px; font-weight:700; color:#fff;">6. Fast WinRT OCR</div><div class="card-body" style="font-size:13px;">อ่านตัวเลขยอดเงินในเวลาเพียง 9.4 ms</div></div>
      <div class="card card-purple"><div class="card-title" style="color:var(--purple-glow); font-size:15px;">STEP 07</div><div style="font-size:17px; font-weight:700; color:#fff;">7. จับคู่บิลใน DB</div><div class="card-body" style="font-size:13px;">ค้นหาบิล unpaid ยอดตรงเป๊ะใน 68 ms</div></div>
      <div class="card card-emerald"><div class="card-title" style="color:var(--emerald); font-size:15px;">STEP 08</div><div style="font-size:17px; font-weight:700; color:#fff;">8. อนุมัติสำเร็จ!</div><div class="card-body" style="font-size:13px;">บิลเปลี่ยนเป็น 'paid' ทันทีใน 1.83 วินาที</div></div>
    </div>
  </div>

  <!-- SLIDE 17 -->
  <div class="slide">
    <div class="slide-tag">Live Verification</div>
    <div class="slide-title">หน้ารายการชำระเงินและหน้าจอผู้เช่า (Payments UI)</div>
    <div class="slide-subtitle">การยืนยันยอดเงินอัตโนมัติพร้อมไฟสถานะ [LINE Connext] และหน้าชำระเงินของลูกบ้าน</div>
    <div class="grid-2">
      <div class="browser-frame">
        <div class="browser-top">
          <div class="browser-dot dot-red"></div><div class="browser-dot dot-yellow"></div><div class="browser-dot dot-green"></div>
          <div class="browser-addr">🔒 https://dormease.local/payments (Admin)</div>
        </div>
        <img class="browser-img" src="{img_pay}" alt="Payments Admin Screen">
      </div>
      <div class="browser-frame">
        <div class="browser-top">
          <div class="browser-dot dot-red"></div><div class="browser-dot dot-yellow"></div><div class="browser-dot dot-green"></div>
          <div class="browser-addr">🔒 https://dormease.local/my-payments (Tenant)</div>
        </div>
        <img class="browser-img" src="{img_tpay}" alt="Tenant Payments Screen">
      </div>
    </div>
  </div>

  <!-- SLIDE 18 -->
  <div class="slide">
    <div class="slide-tag">Operations</div>
    <div class="slide-title">หน้าจัดการรายการแจ้งซ่อมบำรุง (Maintenance & Repairs)</div>
    <div class="slide-subtitle">ระบบรับเรื่องแจ้งซ่อม ติดตามสถานะงานช่าง และประวัติการแก้ไขอุปกรณ์ชำรุด</div>
    <div class="grid-2">
      <div class="browser-frame">
        <div class="browser-top">
          <div class="browser-dot dot-red"></div><div class="browser-dot dot-yellow"></div><div class="browser-dot dot-green"></div>
          <div class="browser-addr">🔒 https://dormease.local/repairs</div>
        </div>
        <img class="browser-img" src="{img_rep}" alt="Repairs Screen">
      </div>
      <div class="card card-rose" style="justify-content:center;">
        <div class="card-title" style="color:var(--rose);">🔧 ระบบบริหารงานแจ้งซ่อม</div>
        <div class="card-body" style="font-size:16px; line-height:1.8;">
          • <strong>รายการแจ้งซ่อมจริงในระบบ:</strong><br>
          บันทึกปัญหา เช่น 'ไฟเสีย', 'ไฟดับ', 'แอร์' พร้อมระบุห้อง 201, 202, 333<br><br>
          • <strong>ข้อมูลผู้แจ้งครบถ้วน:</strong><br>
          บันทึกชื่อผู้แจ้ง เบอร์โทรติดต่อ และวันเวลาที่ส่งเรื่อง<br><br>
          • <strong>Workflow การซ่อม:</strong><br>
          ปุ่ม 'แก้ไขแล้ว' เพื่อปิดงาน และปุ่ม 'จัดการงานซ่อม' มอบหมายงานช่าง<br><br>
          • <strong>หมวดหมู่อุปกรณ์:</strong><br>
          จำแนกประเภทงาน ไฟฟ้า, ประปา, แอร์, เฟอร์นิเจอร์
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 19 -->
  <div class="slide">
    <div class="slide-tag">Empirical Benchmarks</div>
    <div class="slide-title">ผลการทดสอบประสิทธิภาพของระบบ (Performance)</div>
    <div class="slide-subtitle">สถิติผลการวัดประสิทธิภาพจริงที่รายงานโครงงานระบุจากการทดสอบซ้ำหลายครั้ง</div>
    <div class="grid-4">
      <div class="card card-cyan" style="text-align:center; justify-content:center;">
        <div style="font-size:36px; font-weight:800; color:var(--neon-cyan);">1.83 s</div>
        <div style="font-size:16px; font-weight:700; color:#fff; margin:8px 0;">Average Payment Confirmation</div>
        <div class="card-body" style="font-size:13.5px;">ความเร็วเฉลี่ยตั้งแต่ป๊อปอัป LINE เด้ง จนหน้าเว็บผู้เช่าเปลี่ยนเป็น 'ชำระแล้ว'</div>
      </div>
      <div class="card card-emerald" style="text-align:center; justify-content:center;">
        <div style="font-size:36px; font-weight:800; color:var(--emerald);">99.8%</div>
        <div style="font-size:16px; font-weight:700; color:#fff; margin:8px 0;">Reported Accuracy Rate</div>
        <div class="card-body" style="font-size:13.5px;">ความถูกต้องในการจับคู่ยอดเงินและตัดยอดบิล โดยไม่พบกรณีจับคู่ผิดห้อง</div>
      </div>
      <div class="card card-purple" style="text-align:center; justify-content:center;">
        <div style="font-size:36px; font-weight:800; color:var(--purple-glow);">9.4 ms</div>
        <div style="font-size:16px; font-weight:700; color:#fff; margin:8px 0;">Average WinRT OCR Latency</div>
        <div class="card-body" style="font-size:13.5px;">เวลาเฉลี่ยในการสกัดตัวเลขยอดเงินด้วย Windows Native OCR (ช่วง 5.6–15.8 ms)</div>
      </div>
      <div class="card card-amber" style="text-align:center; justify-content:center;">
        <div style="font-size:36px; font-weight:800; color:var(--amber);">0.00 ฿</div>
        <div style="font-size:16px; font-weight:700; color:#fff; margin:8px 0;">Zero Transaction Fee</div>
        <div class="card-body" style="font-size:13.5px;">ต้นทุนค่าธรรมเนียมธุรกรรมเป็นศูนย์ แตกต่างจาก Payment Gateway ทั่วไปที่คิด 1.5–3%</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 20 -->
  <div class="slide">
    <div class="slide-tag">Verification & Quality</div>
    <div class="slide-title">ผลการทดสอบการทำงานของระบบ (Black-box Testing)</div>
    <div class="slide-subtitle">ผลการทดสอบ 5 กรณีทดสอบหลัก (TC-01 ถึง TC-05) ผ่านการประเมิน 100% (5/5 Cases Passed)</div>
    <div style="display:flex; flex-direction:column; gap:12px; height: calc(100% - 130px);">
      <div class="card card-emerald" style="padding:14px 20px; flex-direction:row; align-items:center; justify-content:space-between;">
        <div><strong style="color:var(--neon-cyan);">[TC-01] บันทึกมิเตอร์และออกบิล:</strong> กรอกเลขมิเตอร์ใหม่ &nbsp;-->&nbsp; คำนวณยอดถูกต้อง สถานะ 'unpaid'</div>
        <span class="slide-tag" style="border-color:var(--emerald); color:var(--emerald); margin:0;">ผ่าน (PASSED)</span>
      </div>
      <div class="card card-emerald" style="padding:14px 20px; flex-direction:row; align-items:center; justify-content:space-between;">
        <div><strong style="color:var(--neon-cyan);">[TC-02] สุ่มเศษทศนิยมระบุตัวตน:</strong> กดปุ่มสุ่มทศนิยม &nbsp;-->&nbsp; เศษสตางค์ทุกห้องไม่ซ้ำกัน และเพิ่ม < 1 บาท</div>
        <span class="slide-tag" style="border-color:var(--emerald); color:var(--emerald); margin:0;">ผ่าน (PASSED)</span>
      </div>
      <div class="card card-emerald" style="padding:14px 20px; flex-direction:row; align-items:center; justify-content:space-between;">
        <div><strong style="color:var(--neon-cyan);">[TC-03] ตรวจจับแจ้งเตือนเงินเข้า:</strong> แจ้งเตือนเด้ง 3,500.14 ฿ &nbsp;-->&nbsp; บิลห้อง 101 เปลี่ยนเป็น 'paid' ทันที</div>
        <span class="slide-tag" style="border-color:var(--emerald); color:var(--emerald); margin:0;">ผ่าน (PASSED)</span>
      </div>
      <div class="card card-emerald" style="padding:14px 20px; flex-direction:row; align-items:center; justify-content:space-between;">
        <div><strong style="color:var(--neon-cyan);">[TC-04] หลายงวดห้องเดียวกัน (FIFO):</strong> แจ้งเตือนเงินเข้า 1.00 ฿ &nbsp;-->&nbsp; ระบบเลือกอนุมัติบิลงวดที่เก่าที่สุดก่อน</div>
        <span class="slide-tag" style="border-color:var(--emerald); color:var(--emerald); margin:0;">ผ่าน (PASSED)</span>
      </div>
      <div class="card card-emerald" style="padding:14px 20px; flex-direction:row; align-items:center; justify-content:space-between;">
        <div><strong style="color:var(--neon-cyan);">[TC-05] ป้องกันรายการซ้ำ (Idempotency):</strong> ส่งแจ้งเตือนซ้ำ ID เดิม &nbsp;-->&nbsp; ระบบประมวลผลครั้งเดียว ข้ามรายการซ้ำ</div>
        <span class="slide-tag" style="border-color:var(--emerald); color:var(--emerald); margin:0;">ผ่าน (PASSED)</span>
      </div>
    </div>
  </div>

  <!-- SLIDE 21 -->
  <div class="slide">
    <div class="slide-tag">User Evaluation</div>
    <div class="slide-title">ผลการประเมินความพึงพอใจของผู้ใช้งาน (User Satisfaction)</div>
    <div class="slide-subtitle">ประเมินโดยกลุ่มตัวอย่างผู้ดูแลหอพักและผู้เช่า 15 คน ตามมาตราส่วน Likert Scale 5 ระดับ</div>
    <div style="display:flex; flex-direction:column; gap:12px; height: calc(100% - 130px);">
      <div class="card card-blue" style="padding:12px 20px; display:flex; flex-direction:row; align-items:center; justify-content:space-between;">
        <div>1. ความง่ายในการใช้งานและความสะดวกของหน้าจอ (Ease of Use)</div>
        <div style="font-weight:700; color:var(--neon-cyan);">4.80 / 5.00 (S.D. 0.41) &nbsp;•&nbsp; ดีมาก</div>
      </div>
      <div class="card card-blue" style="padding:12px 20px; display:flex; flex-direction:row; align-items:center; justify-content:space-between;">
        <div>2. ความรวดเร็วในการตัดยอดบิลอัตโนมัติ (Speed & Real-time)</div>
        <div style="font-weight:700; color:var(--neon-cyan);">4.88 / 5.00 (S.D. 0.33) &nbsp;•&nbsp; ดีมาก</div>
      </div>
      <div class="card card-cyan" style="padding:12px 20px; display:flex; flex-direction:row; align-items:center; justify-content:space-between; background:rgba(0, 217, 255, 0.15);">
        <div><strong>3. ความถูกต้องแม่นยำในการป้องกันสลิปปลอม (Security & Accuracy)</strong></div>
        <div style="font-weight:800; color:var(--neon-cyan);">4.92 / 5.00 (S.D. 0.28) &nbsp;•&nbsp; ดีมาก (สูงสุด ⭐)</div>
      </div>
      <div class="card card-blue" style="padding:12px 20px; display:flex; flex-direction:row; align-items:center; justify-content:space-between;">
        <div>4. ความสะดวกในการจัดการบิลและบันทึกมิเตอร์ (Billing Management)</div>
        <div style="font-weight:700; color:var(--neon-cyan);">4.70 / 5.00 (S.D. 0.46) &nbsp;•&nbsp; ดีมาก</div>
      </div>
      <div class="card card-blue" style="padding:12px 20px; display:flex; flex-direction:row; align-items:center; justify-content:space-between;">
        <div>5. ความพึงพอใจในภาพรวมต่อการใช้งานระบบ DormEase (Overall)</div>
        <div style="font-weight:700; color:var(--neon-cyan);">4.73 / 5.00 (S.D. 0.46) &nbsp;•&nbsp; ดีมาก</div>
      </div>
      <div class="card card-amber" style="padding:16px 24px; text-align:center; justify-content:center; background:rgba(245, 158, 11, 0.15);">
        <strong style="font-size:18px; color:var(--amber);">⭐ คะแนนเฉลี่ยรวมทุกด้าน: 4.79 จาก 5.00 คะแนน (S.D. = 0.38) อยู่ในระดับ 'ดีมาก' สูงสุด</strong>
      </div>
    </div>
  </div>

  <!-- SLIDE 22 -->
  <div class="slide">
    <div class="slide-tag">Impact & Value</div>
    <div class="slide-title">คุณประโยชน์และคุณค่าของระบบ (Benefits & Value)</div>
    <div class="slide-subtitle">ผลกระทบเชิงบวกในการยกระดับประสิทธิภาพธุรกิจหอพักและประสบการณ์ของผู้เช่า</div>
    <div class="grid-4">
      <div class="card card-blue">
        <div style="font-size:36px; margin-bottom:8px;">⏱️</div>
        <div class="card-title" style="color:var(--electric-blue);">ลดภาระงาน > 85%</div>
        <div class="card-body">ลดเวลาจดมิเตอร์ ออกบิล และเปิดตรวจสลิป ทำให้เจ้าของหอพักมีเวลาดูแลบริการลูกบ้านมากขึ้น</div>
      </div>
      <div class="card card-emerald">
        <div style="font-size:36px; margin-bottom:8px;">🛡️</div>
        <div class="card-title" style="color:var(--emerald);">กำจัดสลิปปลอม 100%</div>
        <div class="card-body">ป้องกันสลิปตัดต่อ สลิปปลอม และการวนใช้สลิปเก่าซ้ำได้อย่างเด็ดขาดด้วยระบบ Event-based</div>
      </div>
      <div class="card card-amber">
        <div style="font-size:36px; margin-bottom:8px;">💸</div>
        <div class="card-title" style="color:var(--amber);">ประหยัดต้นทุน 0 ฿</div>
        <div class="card-body">ไม่มีค่าธรรมเนียมรายธุรกรรม 1.5 - 3% และไม่มีค่าบริการรายเดือนเหมือน Payment Gateway ธนาคาร</div>
      </div>
      <div class="card card-cyan">
        <div style="font-size:36px; margin-bottom:8px;">📱</div>
        <div class="card-title" style="color:var(--neon-cyan);">ประสบการณ์ลูกบ้าน</div>
        <div class="card-body">ผู้เช่าสแกนจ่าย QR Code ล็อกยอดเป๊ะ ได้รับการอนุมัติบิลใน 1.83 วินาที ไม่ต้องรอคอยและไม่ต้องส่งสลิป</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 23 -->
  <div class="slide">
    <div class="slide-tag">Roadmap</div>
    <div class="slide-title">ข้อจำกัดและแนวทางการพัฒนาต่อ (Roadmap)</div>
    <div class="slide-subtitle">การวิเคราะห์ข้อจำกัดปัจจุบันพร้อมทิศทางการวิจัยและต่อยอดในอนาคต</div>
    <div class="grid-2">
      <div class="card card-rose">
        <div class="card-title" style="color:var(--rose);">⚠️ ข้อจำกัดของระบบปัจจุบัน (Limitations)</div>
        <div class="card-body" style="font-size:16px; line-height:1.8;">
          1. <strong>การพึ่งพา OS เครื่องแม่ข่าย:</strong><br>
          โปรแกรมตรวจจับเงินเข้าต้องรันบน Windows ที่เปิดโปรแกรม LINE Desktop ไว้<br><br>
          2. <strong>การเปิดเครื่องคอมพิวเตอร์:</strong><br>
          หากเครื่องคอมพิวเตอร์ปิดอยู่ จะไม่สามารถตรวจจับ Real-time ได้ (แต่มีระบบแนบสลิปสำรอง)<br><br>
          3. <strong>การอ่านมิเตอร์น้ำ-ไฟ:</strong><br>
          ในเวอร์ชันปัจจุบันยังต้องให้เจ้าหน้าที่เดินจดและกรอกตัวเลขมิเตอร์ด้วยมือ
        </div>
      </div>
      <div class="card card-cyan">
        <div class="card-title" style="color:var(--neon-cyan);">🚀 แนวทางการพัฒนาต่อยอด (Future Roadmap)</div>
        <div class="card-body" style="font-size:16px; line-height:1.8;">
          1. <strong>IoT Smart Meter Integration:</strong><br>
          เชื่อมต่อมิเตอร์น้ำ-ไฟอัจฉริยะผ่าน Wi-Fi/LoRaWAN คีย์หน่วยเข้าบิลอัตโนมัติ 100%<br><br>
          2. <strong>Native Mobile Application:</strong><br>
          พัฒนาแอปสำหรับผู้เช่าบน iOS และ Android พร้อมระบบ Push Notifications ตรงเข้ามือถือ<br><br>
          3. <strong>Open Banking API:</strong><br>
          เชื่อมต่อ Webhook ของธนาคารโดยตรงในอนาคตเพื่อให้ทำงานบน Cloud 100%<br><br>
          4. <strong>AI Predictive Analytics:</strong><br>
          พยากรณ์การใช้พลังงานและแนวโน้มการเงินของหอพัก
        </div>
      </div>
    </div>
  </div>

  <!-- SLIDE 24 -->
  <div class="slide">
    <div class="slide-tag">Conclusion</div>
    <div class="slide-title">สรุปผลการดำเนินงานโครงงาน (Conclusion)</div>
    <div class="slide-subtitle">ความสำเร็จในการผสานเว็บเทคโนโลยีสมัยใหม่เข้ากับนวัตกรรมตรวจจับเงินเข้าอัตโนมัติ</div>
    <div class="card card-blue" style="height: calc(100% - 130px); justify-content:center; padding: 36px 50px;">
      <div class="card-title" style="font-size:26px; color:var(--neon-cyan); margin-bottom:20px;">DormEase — Smart Dormitory Management System</div>
      <div class="card-body" style="font-size:17.5px; line-height:1.9;">
        ✔ <strong>บรรลุวัตถุประสงค์ครบถ้วน 100%:</strong> พัฒนาเว็บแอปพลิเคชันบริหารหอพักครบวงจร (ห้องพัก สัญญา บิล การชำระเงิน และงานซ่อม) สำเร็จสมบูรณ์<br><br>
        ✔ <strong>พิสูจน์ความสำเร็จของนวัตกรรม Unique Satang + Fast OCR:</strong> สามารถอนุมัติบิลได้รวดเร็วเฉลี่ย 1.83 วินาที มีความแม่นยำ 99.8% และปราศจากค่าธรรมเนียมธุรกรรม<br><br>
        ✔ <strong>การยอมรับในระดับสูงมากจากกลุ่มตัวอย่างผู้ใช้จริง:</strong> คะแนนความพึงพอใจเฉลี่ยรวม 4.79 จาก 5.00 คะแนน (S.D. = 0.38) โดยเฉพาะด้านความปลอดภัยในการป้องกันสลิปปลอม (4.92)<br><br>
        ✔ <strong>พร้อมนำไปต่อยอดเชิงพาณิชย์และใช้งานจริง:</strong> ช่วยยกระดับการบริหารจัดการหอพักของไทยสู่ระบบดิจิทัลที่ทันสมัย คุ้มค่า และยั่งยืนอย่างแท้จริง
      </div>
    </div>
  </div>

  <!-- SLIDE 25 -->
  <div class="slide">
    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
      <h1 style="font-size: 64px; font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 12px; font-family:'Inter';">
        THANK YOU
      </h1>
      <p style="font-size: 26px; color: var(--neon-cyan); font-family: 'Inter'; font-weight: 600; margin-bottom: 30px;">
        DormEase — Smart Dormitory, Smarter Payments
      </p>
      
      <div style="background: rgba(21, 31, 69, 0.9); border: 2px solid var(--amber); border-radius: 20px; padding: 26px 60px; max-width: 850px; margin-bottom: 30px;">
        <p style="font-size: 24px; font-weight: 700; color: var(--amber); margin-bottom: 8px;">
          ขอขอบพระคุณคณะกรรมการและอาจารย์ทุกท่าน
        </p>
        <p style="font-size: 20px; color: #fff; font-weight: 600;">
          Questions & Answers (Q&A)
        </p>
      </div>

      <p style="font-size: 16px; color: var(--text-soft); line-height: 1.6;">
        นวพรรษ เนียมศรี &nbsp;•&nbsp; วิศิษฏ์ มาลาอบ &nbsp;•&nbsp; ชินวุธ สารศิริ<br>
        ภาควิชาวิทยาการเทคโนโลยีและดิจิทัล คณะวิทยาศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา
      </p>
    </div>
  </div>

</div>

<!-- UI Controls -->
<div id="controls">
  <button class="btn-ctrl" onclick="prevSlide()" title="สไลด์ก่อนหน้า (Arrow Left)">◀ ก่อนหน้า</button>
  <span id="slide-indicator">01 / 25</span>
  <button class="btn-ctrl" onclick="nextSlide()" title="สไลด์ถัดไป (Arrow Right / Space)">ถัดไป ▶</button>
  <button class="btn-ctrl" onclick="toggleNotes()" title="เปิด/ปิด สคริปต์บทพูด (N)">📝 บทพูด</button>
  <button class="btn-ctrl" onclick="toggleFullScreen()" title="เต็มจอ (F)">⛶ เต็มจอ</button>
</div>

<!-- Speaker Notes Drawer -->
<div id="notes-drawer">
  <div class="notes-title">
    <span id="notes-header">📝 สคริปต์บทพูดนำเสนอ (Speaker Speech Script)</span>
    <button class="btn-ctrl" onclick="toggleNotes()">✕ ปิด</button>
  </div>
  <div class="notes-content" id="notes-body">
    สคริปต์บทพูดจะเปลี่ยนตามสไลด์ปัจจุบันโดยอัตโนมัติ
  </div>
</div>

<script>
  const slides = document.querySelectorAll('.slide');
  let currentSlide = 0;

  const speakerScripts = [
    // Slide 1
    "กราบเรียนท่านอาจารย์และคณะกรรมการทุกท่าน พวกเรากลุ่ม DormEase มีความยินดีที่จะนำเสนอโครงงาน 'ระบบบริหารจัดการหอพักและตรวจจับการชำระเงินอัตโนมัติด้วยการสุ่มเศษสตางค์' ซึ่งเป็นผลงานวิจัยและพัฒนานวัตกรรมเพื่อแก้ปัญหาคอขวดทางการเงินของธุรกิจหอพักยุคใหม่ครับ",
    // Slide 2
    "DormEase คือระบบบริหารหอพักครบวงจรที่เปลี่ยนกระบวนการทำงานแบบเดิม สู่ระบบอัตโนมัติเต็มรูปแบบ จุดเด่นสำคัญคือการเปลี่ยนกระบวนการตรวจสอบสลิปแบบ Reactive มาเป็นการตรวจจับการแจ้งเตือนเงินเข้าแบบ Proactive Event-Driven โดยใช้ยอดเงินเป็นตัวระบุบิลเฉพาะตัว ทำให้ตัดยอดบิลได้ใน 1.83 วินาทีโดยไร้สลิปและไม่มีค่าธรรมเนียมธุรกรรมครับ",
    // Slide 3
    "จากการสำรวจปัญหาของหอพักในปัจจุบัน พบปัญหาหลัก 3 ประการ คือ 1. การจดมิเตอร์น้ำไฟด้วยมือที่เสียเวลาและผิดพลาดบ่อย 2. คอขวดในการตรวจสลิปโอนเงินช่วงสิ้นเดือนที่ต้องเปิดดูทีละใบ และ 3. ความเสี่ยงจากสลิปปลอมแปลงหรือการนำสลิปเก่ามาวนใช้ซ้ำ ซึ่งสร้างความเสียหายทางการเงินแก่เจ้าของหอพักอย่างมากครับ",
    // Slide 4
    "สไลด์นี้แสดงการเปรียบเทียบ Before vs After อย่างชัดเจน จากเดิมที่ต้องเปิดดูสลิปทีละใบและรออนุมัตินานหลายชั่วโมง DormEase เปลี่ยนมาใช้การสุ่มเศษสตางค์และการดักจับแจ้งเตือนเงินเข้าของธนาคาร ทำให้ระบบอนุมัติบิลเป็น 'ชำระแล้ว' ได้ทันทีภายใน 1-2 วินาที และมีต้นทุนค่าธรรมเนียมเป็นศูนย์ครับ",
    // Slide 5
    "วัตถุประสงค์ของโครงงานมี 4 ข้อหลัก คือ 1. พัฒนาเว็บแอปพลิเคชันบริหารหอพักแบบ Responsive 2. พัฒนาระบบคำนวณมิเตอร์และสุ่มเศษสตางค์ไม่ซ้ำ 3. พัฒนาระบบตรวจจับการชำระเงินอัตโนมัติด้วย Fast Native OCR และ 4. ทดสอบประสิทธิภาพแบบกล่องดำพร้อมประเมินความพึงพอใจของผู้ใช้งานจริงครับ",
    // Slide 6
    "ขอบเขตของระบบแบ่งออกเป็น 2 ฝั่งผู้ใช้หลักด้วยระบบ Role-Based Access Control คือ ฝั่งผู้ดูแลหอพัก ที่สามารถจัดการห้องพัก สัญญา บันทึกมิเตอร์ สุ่มเศษสตางค์ และดูรายงาน และฝั่งผู้เช่า ที่สามารถดูใบแจ้งหนี้ สแกน QR Code พร้อมเพย์ และแจ้งซ่อมบำรุงออนไลน์ได้ครับ",
    // Slide 7
    "นี่คือภาพรวมฟังก์ชันหลักทั้ง 8 ส่วนของ DormEase ซึ่งครอบคลุมตั้งแต่วันแรกที่ลูกบ้านย้ายเข้า การคำนวณบิลรายเดือน การรับชำระเงินอัตโนมัติ งานแจ้งซ่อม ไปจนถึงการย้ายออกและการออกใบเสร็จรับเงินอิเล็กทรอนิกส์ครับ",
    // Slide 8
    "ในส่วนของเทคโนโลยี เราเลือกใช้ Modern Tech Stack ที่โหลดเร็วและปลอดภัย ส่วนหน้าใช้ React 18, Vite และ Tailwind CSS ส่วนหลังบ้านใช้ Node.js และ Express ฐานข้อมูลใช้ MySQL 8.0 และส่วน Desktop Automation บน Windows ใช้ Python ร่วมกับ Windows Native Media OCR ครับ",
    // Slide 9
    "สถาปัตยกรรมระบบเป็นแบบ Three-Tier Client-Server มี Presentation Tier ติดต่อกับผู้ใช้ผ่านเบราว์เซอร์, Logic Tier ประมวลผลคำนวณบิลและรันตัวตรวจจับ LinePaymentListener และ Data Tier จัดเก็บข้อมูลใน MySQL พร้อมทำ Indexing เพื่อการสืบค้นที่รวดเร็วระดับมิลลิวินาทีครับ",
    // Slide 10
    "การออกแบบฐานข้อมูลเชิงสัมพันธ์ประกอบด้วยตารางสำคัญ 7 ตาราง เช่น dorm_users, dorm_rooms, dorm_bills และ dorm_payments โดยมีการกำหนด Foreign Key และ ACID Transactions อย่างรัดกุมเพื่อรับประกันความถูกต้องของข้อมูลทางการเงิน 100% ครับ",
    // Slide 11
    "นี่คือภาพหน้าจอเข้าสู่ระบบจริงของ DormEase ซึ่งรองรับการล็อกอินทั้งฝั่งผู้ดูแลและผู้เช่า สามารถสลับภาษาไทย-อังกฤษ และรองรับทั้ง Dark Mode และ Light Mode อย่างสมบูรณ์ครับ",
    // Slide 12
    "หน้าแดชบอร์ดของผู้ดูแลระบบ แสดงสถิติภาพรวมสด ทั้งจำนวนห้องทั้งหมด 6 ห้อง, ห้องว่าง 0 ห้อง, รายการค้างชำระ 37 รายการ และตารางแสดงรายชื่อผู้เช่าห้อง 101 ถึง 333 พร้อมปุ่มโทรด่วนฉุกเฉินและเมนูค้นหาด่วนครับ",
    // Slide 13
    "หน้าจัดการห้องพัก จัดแสดงในรูปแบบตารางผังห้อง ระบุประเภทห้อง เช่น Studio 24 ตร.ม., Corner Studio 26 ตร.ม., ชั้น และราคาค่าเช่า พร้อมป้ายสถานะ 'ไม่ว่าง' สีแดงชัดเจน และปุ่มแก้ไขหรือลบห้องพักครับ",
    // Slide 14
    "หน้ารายงานค่าใช้จ่ายประจำเดือน แสดงตารางกรอกมิเตอร์น้ำ-ไฟที่คำนวณให้อัตโนมัติ พร้อมจุดเด่นสำคัญคือปุ่ม 'สุ่มทศนิยมไม่ซ้ำ (<1 ฿)' ซึ่งจะแจกจ่ายเศษสตางค์ให้แต่ละห้อง เช่น .64 ฿, .65 ฿, .92 ฿ เพื่อใช้ระบุบิล และปุ่ม 'แจ้งบิลทุกลูกค้า' ในคลิกเดียวครับ",
    // Slide 15
    "สไลด์นี้คือหัวใจสำคัญของนวัตกรรม DormEase ครับ เราใช้อัลกอริทึม Fisher-Yates สุ่มเศษสตางค์ 0.01 ถึง 0.99 บาท เช่น ห้อง 101 ได้ยอด 3,500.14 บาท, ห้อง 102 ได้ 3,500.72 บาท ทำให้ยอดเงินกลายเป็นรหัสระบุบิลเฉพาะตัว เมื่อเงินโอนเข้า ระบบค้นหาบิลที่ตรงกันได้ใน 68 มิลลิวินาทีโดยไม่ต้องพึ่งพาสลิปและหมดปัญหาสลิปปลอม 100% ครับ",
    // Slide 16
    "Workflow การทำงานอัตโนมัติ 8 ขั้นตอน เริ่มตั้งแต่ผู้ดูแลออกบิล -> สุ่มเศษสตางค์ -> สร้าง QR Code -> ผู้เช่าสแกนจ่าย -> แจ้งเตือน LINE Connext เด้ง -> Fast OCR สกัดยอดเงินใน 9.4 ms -> ค้นหาบิลใน MySQL -> และปรับสถานะเป็น 'ชำระแล้ว' สำเร็จในเวลารวมเพียง 1.83 วินาทีครับ",
    // Slide 17
    "ภาพทางซ้ายคือหน้ารายการชำระเงินฝั่งผู้ดูแล แสดงประวัติการโอนพร้อมไฟสถานะ [LINE Connext] ที่อนุมัติอัตโนมัติ และภาพทางขวาคือหน้าจอฝั่งลูกบ้านที่แสดงยอดเงินและประวัติการชำระเงินที่อัปเดตแบบเรียลไทม์ครับ",
    // Slide 18
    "หน้าจอการแจ้งซ่อมบำรุง ผู้เช่าสามารถแจ้งปัญหา เช่น ไฟเสีย, ไฟดับ, แอร์ พร้อมระบุห้องพัก และผู้ดูแลสามารถติดตาม มอบหมายงานช่าง และกดปุ่ม 'แก้ไขแล้ว' เพื่อปิดงานได้อย่างเป็นระบบครับ",
    // Slide 19
    "ผลการทดสอบประสิทธิภาพที่รายงานระบุพบว่า: ความเร็วในการอนุมัติบิลเฉลี่ยอยู่ที่ 1.83 วินาที, ความถูกต้องแม่นยำสูงถึง 99.8%, ความเร็วของ Fast WinRT OCR อยู่ที่ 9.4 มิลลิวินาที และต้นทุนค่าธรรมเนียมธุรกรรมเป็น 0 บาทครับ",
    // Slide 20
    "ผลการทดสอบระบบแบบกล่องดำ (Black-box Testing) ใน 5 กรณีหลัก ตั้งแต่การออกบิล, สุ่มเศษสตางค์, ตรวจจับแจ้งเตือน, การจัดการหลายงวดแบบ FIFO และการป้องกันรายการซ้ำ ผลการทดสอบผ่านครบ 100% ทั้ง 5 กรณีครับ",
    // Slide 21
    "ผลการประเมินความพึงพอใจจากกลุ่มตัวอย่างผู้ใช้จริง 15 คน พบว่าได้คะแนนเฉลี่ยรวม 4.79 จาก 5.00 คะแนน อยู่ในระดับดีมาก โดยข้อที่ได้คะแนนสูงสุดคือด้านความถูกต้องแม่นยำในการป้องกันสลิปปลอม ที่ได้สูงถึง 4.92 คะแนนครับ",
    // Slide 22
    "คุณค่าและประโยชน์ของ DormEase ช่วยลดภาระงานของผู้ดูแลลงได้มากกว่า 85%, กำจัดปัญหาการทุจริตสลิปปลอมได้ 100%, ประหยัดค่าธรรมเนียมธุรกรรมให้ผู้ประกอบการ และมอบประสบการณ์ที่สะดวกรวดเร็วแก่ลูกบ้านยุคใหม่ครับ",
    // Slide 23
    "ข้อจำกัดของระบบปัจจุบันคือยังต้องเปิดเครื่อง Windows ที่มีโปรแกรม LINE Desktop ไว้ และยังต้องจดมิเตอร์น้ำไฟด้วยมือ ซึ่งในอนาคตเราวาง Roadmap ในการเชื่อมต่อ IoT Smart Meter และพัฒนาแอปพลิเคชันมือถือแบบเนทีฟครับ",
    // Slide 24
    "โดยสรุป DormEase ได้บรรลุวัตถุประสงค์ครบถ้วนทุกประการ และพิสูจน์แล้วว่าการใช้นวัตกรรมเศษสตางค์ร่วมกับ Fast OCR สามารถทดแทนระบบตรวจสลิปแบบเดิมได้อย่างสมบูรณ์ มีความแม่นยำสูง และคุ้มค่าในเชิงพาณิชย์ครับ",
    // Slide 25
    "พวกเราคณะผู้จัดทำขอกราบขอบพระคุณท่านคณะกรรมการและอาจารย์ทุกท่านเป็นอย่างสูงครับ ขณะนี้พร้อมสำหรับการตอบข้อซักถาม (Q&A) แล้วครับ"
  ];

  function updateSlide(index) {{
    slides.forEach((s, i) => {{
      s.classList.toggle('active', i === index);
    }});
    document.getElementById('slide-indicator').innerText = 
      String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    
    // Update speaker notes
    document.getElementById('notes-header').innerText = `📝 สคริปต์บทพูดนำเสนอ (สไลด์ที่ ${{index + 1}} / ${{slides.length}})`;
    document.getElementById('notes-body').innerText = speakerScripts[index] || "ไม่มีบทพูดสำหรับสไลด์นี้";
  }}

  function nextSlide() {{
    if (currentSlide < slides.length - 1) {{
      currentSlide++;
      updateSlide(currentSlide);
    }}
  }}

  function prevSlide() {{
    if (currentSlide > 0) {{
      currentSlide--;
      updateSlide(currentSlide);
    }}
  }}

  function toggleNotes() {{
    document.getElementById('notes-drawer').classList.toggle('open');
  }}

  function toggleFullScreen() {{
    if (!document.fullscreenElement) {{
      document.documentElement.requestFullscreen();
    }} else {{
      if (document.exitFullscreen) {{
        document.exitFullscreen();
      }}
    }}
  }}

  window.addEventListener('keydown', (e) => {{
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {{
      nextSlide();
    }} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{
      prevSlide();
    }} else if (e.key === 'Home') {{
      currentSlide = 0;
      updateSlide(currentSlide);
    }} else if (e.key === 'End') {{
      currentSlide = slides.length - 1;
      updateSlide(currentSlide);
    }} else if (e.key.toLowerCase() === 'f') {{
      toggleFullScreen();
    }} else if (e.key.toLowerCase() === 'n') {{
      toggleNotes();
    }}
  }});

  // Initial update
  updateSlide(0);
</script>

</body>
</html>
"""

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"SUCCESS: Generated HTML Presentation on Desktop -> {OUTPUT_HTML} ({os.path.getsize(OUTPUT_HTML)} bytes)")

with open(OUTPUT_HTML_LOCAL, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"SUCCESS: Generated HTML Presentation in Project -> {OUTPUT_HTML_LOCAL} ({os.path.getsize(OUTPUT_HTML_LOCAL)} bytes)")
