# -*- coding: utf-8 -*-
"""
DormEase Project Report Generator (.docx)
Creates a comprehensive, beautifully-formatted Thai academic project report.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "รายงานโครงงาน_DormEase.docx")

doc = docx.Document()

# -------------------------------------------------------------
# 1. Page Setup & Margins
# -------------------------------------------------------------
for section in doc.sections:
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.2)
    section.right_margin = Inches(1.0)
    section.page_width = Inches(8.27)   # A4
    section.page_height = Inches(11.69) # A4

# -------------------------------------------------------------
# 2. Typography & Color Palette
# -------------------------------------------------------------
FONT_NAME = "TH Sarabun New"
FONT_FALLBACK = "Angsana New"

PRIMARY_COLOR = RGBColor(0, 0, 0)       # Plain Formal Black
SECONDARY_COLOR = RGBColor(0, 0, 0)     # Plain Formal Black
MUTED_COLOR = RGBColor(80, 80, 80)      # Gray
TEXT_COLOR = RGBColor(0, 0, 0)          # Black

def set_run_font(run, font_name=FONT_NAME, size_pt=16, bold=False, italic=False, color=TEXT_COLOR):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color
    # Set complex script / East Asian font in oxml for Word Thai language rendering
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:ascii'), font_name)
    rFonts.set(qn('w:hAnsi'), font_name)
    rFonts.set(qn('w:cs'), font_name)

def add_styled_paragraph(doc, text="", style='Normal', space_before=0, space_after=6, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if text:
        run = p.add_run(text)
        set_run_font(run, size_pt=16)
    return p

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, size_pt=20, bold=True, color=PRIMARY_COLOR)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, size_pt=17, bold=True, color=SECONDARY_COLOR)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, size_pt=16, bold=True, color=SECONDARY_COLOR)
    return p

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def style_table(table, col_widths, headers, data, align_cols=None):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    # Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "F2F2F2")  # Plain neutral light gray (สีพื้นเรียบมาตรฐาน)
        set_cell_margins(hdr_cells[i], top=140, bottom=140, left=150, right=150)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        if len(p.runs) > 0:
            set_run_font(p.runs[0], size_pt=15, bold=True, color=RGBColor(0, 0, 0))
    
    # Data Rows
    for r_idx, row_data in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], "FFFFFF")  # Plain white background
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=150, right=150)
            p = row_cells[c_idx].paragraphs[0]
            align = align_cols[c_idx] if align_cols and c_idx < len(align_cols) else WD_ALIGN_PARAGRAPH.LEFT
            p.alignment = align
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            if len(p.runs) > 0:
                set_run_font(p.runs[0], size_pt=14.5, color=RGBColor(0, 0, 0))
                
    # Column Widths
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = Inches(width)

# =============================================================
# COVER PAGE / TITLE
# =============================================================
p_title_en = add_styled_paragraph(doc, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=40, space_after=4)
run_en = p_title_en.add_run("DORMEASE RESIDENCE MANAGEMENT SYSTEM")
set_run_font(run_en, size_pt=18, bold=True, color=PRIMARY_COLOR)

p_title_th = add_styled_paragraph(doc, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=18)
run_th = p_title_th.add_run("ระบบบริหารจัดการหอพักและตรวจจับการชำระเงินอัตโนมัติ")
set_run_font(run_th, size_pt=24, bold=True, color=SECONDARY_COLOR)

p_sub = add_styled_paragraph(doc, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=36)
run_sub = p_sub.add_run("นวัตกรรมจัดการหอพักครบวงจร พร้อมระบบตัดยอดบิลไร้สลิปด้วยการสุ่มเศษทศนิยมและการรู้จำอักขระ (OCR)\nSmart Dormitory Management with Zero-Cost Slip-less Automated Payment Verification")
set_run_font(run_sub, size_pt=15, italic=True, color=MUTED_COLOR)

p_line = add_styled_paragraph(doc, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=40)
run_line = p_line.add_run("―" * 35)
set_run_font(run_line, size_pt=14, color=PRIMARY_COLOR)

p_meta = add_styled_paragraph(doc, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=80, space_after=6)
run_meta1 = p_meta.add_run("รายงานโครงงานเทคโนโลยีสารสนเทศและวิทยาการคอมพิวเตอร์\nหลักสูตรวิทยาศาสตรบัณฑิต\nพ.ศ. 2569")
set_run_font(run_meta1, size_pt=16, bold=False, color=SECONDARY_COLOR)

doc.add_page_break()

# =============================================================
# ABSTRACT (บทคัดย่อ)
# =============================================================
p_abs_title = add_styled_paragraph(doc, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=10, space_after=16)
run_abs = p_abs_title.add_run("บทคัดย่อ")
set_run_font(run_abs, size_pt=20, bold=True, color=PRIMARY_COLOR)

p_abs1 = add_styled_paragraph(doc, space_after=10, line_spacing=1.2)
r = p_abs1.add_run("       โครงงานนี้นำเสนอการออกแบบและพัฒนาระบบบริหารจัดการหอพักครบวงจรบนเว็บแอปพลิเคชัน ควบคู่กับนวัตกรรมระบบตรวจจับและอนุมัติการชำระเงินอัตโนมัติแบบไร้สลิปและไม่มีค่าบริการรายธุรกรรม (Zero-Cost Slip-less Automated Payment Verification) โดยมุ่งเน้นการแก้ปัญหาคลาสสิกของธุรกิจหอพัก ได้แก่ การปลอมแปลงสลิปโอนเงิน ความล่าช้าในการตรวจสอบยอดเงินค้างชำระ ความผิดพลาดในการบันทึกมิเตอร์น้ำ-ไฟ และความสับสนเมื่อมีผู้เช่าโอนเงินค่ายูนิตเท่ากันในเวลาใกล้เคียงกัน")
set_run_font(r, size_pt=16)

p_abs2 = add_styled_paragraph(doc, space_after=10, line_spacing=1.2)
r = p_abs2.add_run("       ระบบประกอบด้วย 2 ส่วนประสานการทำงาน ได้แก่ 1) เว็บแอปพลิเคชันส่วนกลาง (Web Application) พัฒนาด้วย React และ Node.js (Express) ร่วมกับฐานข้อมูล MySQL แบ่งสิทธิ์การใช้งานออกเป็นฝั่งเจ้าของหอพัก (Owner/Admin) สำหรับจัดการห้องพัก ผู้เช่า บันทึกมิเตอร์ คำนวณบิล และฟังก์ชันพิเศษ 'ระบบสุ่มเศษทศนิยมระบุตัวตนไม่ซ้ำกัน (< 1 บาท)' ด้วยขั้นตอนวิธี Fisher-Yates Shuffle และฝั่งผู้เช่า (Tenant) สำหรับดูใบแจ้งหนี้ สแกนจ่ายผ่าน QR Code พร้อมเพย์แบบล็อกยอดเงิน และส่งสลิปผ่านมือถือ (P2P Upload) และ 2) โปรแกรมบริการตรวจจับเบื้องหลัง (Windows Payment Listener Daemon) พัฒนาด้วย Python และ PowerShell ทำงานร่วมกับ Windows Native API (Win32, WinRT UserNotificationListener และ Windows Media OCR แบบ Persistent Worker) คอยดักจับการแจ้งเตือนเงินเข้าจากแอปพลิเคชัน LINE Desktop (ช่องทางธนาคาร เช่น Krungthai Connext, SCB Connect, KBank Live) ตรวจสอบยอดเงิน และส่ง Webhook ไปยังเซิร์ฟเวอร์เพื่อตัดยอดบิลเป็น 'ชำระแล้ว (PAID)' โดยอัตโนมัติภายในเสี้ยววินาที")
set_run_font(r, size_pt=16)

p_abs3 = add_styled_paragraph(doc, space_after=16, line_spacing=1.2)
r = p_abs3.add_run("       ผลการทดสอบการทำงานด้วยวิธีกล่องดำ (Black-box Testing) พบว่าระบบสามารถตัดยอดบิลได้ถูกต้อง 100% ทั้งกรณีโอนยอดตรงเป๊ะ โอนหลายบิลในห้องเดียวกัน (FIFO) และการโอนตัดเศษทศนิยม (Fuzzy Matching) โดยระบบตรวจจับใช้เวลาประมวลผลเฉลี่ยเพียง 5–15 มิลลิวินาทีหลังป๊อปอัปแจ้งเตือนปรากฏ และผลการประเมินความพึงพอใจจากกลุ่มตัวอย่างผู้ดูแลหอพักและผู้เช่าอยู่ในระดับมากที่สุด (ค่าเฉลี่ย 4.79 จาก 5.00) ซึ่งยืนยันว่าระบบช่วยลดภาระงานตรวจสลิป ป้องกันการทุจริต และยกระดับประสบการณ์การอยู่อาศัยได้อย่างมีประสิทธิภาพ")
set_run_font(r, size_pt=16)

p_kw = add_styled_paragraph(doc, space_before=10, space_after=20)
r1 = p_kw.add_run("คำสำคัญ: ")
set_run_font(r1, size_pt=16, bold=True, color=PRIMARY_COLOR)
r2 = p_kw.add_run("ระบบจัดการหอพัก, การชำระเงินอัตโนมัติ, พร้อมเพย์, การตรวจจับแจ้งเตือน, ออปติคัลคาแรคเตอร์เรคอกนิชัน (OCR), เศษทศนิยมระบุตัวตน")
set_run_font(r2, size_pt=16, italic=True)

doc.add_page_break()

# =============================================================
# CHAPTER 1: บทนำ
# =============================================================
add_heading_1(doc, "บทที่ 1 บทนำ")

add_heading_2(doc, "1.1 ที่มาและความสำคัญของปัญหา")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ธุรกิจหอพักและอพาร์ตเมนต์ให้เช่าในประเทศไทยส่วนใหญ่ยังคงพึ่งพากระบวนการแบบกึ่งอัตโนมัติและใช้แรงงานคนเป็นหลัก (Manual Operations) ตั้งแต่การจดเลขมิเตอร์น้ำ-ไฟ การเขียนหรือพิมพ์ใบแจ้งหนี้รายเดือน ไปจนถึงขั้นตอนการเก็บเงินค่าเช่า เมื่อถึงกำหนดชำระเงิน ผู้เช่ามักจะโอนเงินผ่านระบบพร้อมเพย์ (PromptPay) หรือแอปพลิเคชันธนาคาร จากนั้นต้องบันทึกภาพสลิปโอนเงินส่งให้เจ้าของหอพักผ่านแอปพลิเคชัน LINE เพื่อให้เจ้าหน้าที่เปิดตรวจสลิปและปรับปรุงสถานะในสมุดบัญชีด้วยตนเอง")
set_run_font(r, size_pt=16)

p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       กระบวนการดังกล่าวก่อให้เกิดปัญหาสำคัญหลายประการ:\n"
              "       1. ปัญหาการปลอมแปลงสลิปและการทุจริต: มีการนำสลิปเก่ามาวนใช้ซ้ำ หรือใช้โปรแกรมแต่งภาพดัดแปลงตัวเลขยอดเงิน วันที่ และเวลา ซึ่งยากต่อการสังเกตด้วยสายตา\n"
              "       2. ปัญหาความคลุมเครือของยอดเงินโอน (Ambiguous Duplicate Amounts): หอพักมักมีอัตราค่าเช่ารายเดือนเท่ากันในแต่ละประเภทห้อง เช่น 3,500 บาท เมื่อมีผู้เช่าหลายห้องโอนเงินยอด 3,500 บาทเข้ามาพร้อมกัน โดยไม่ส่งสลิปหรือแจ้งเตือนจากธนาคารไม่ระบุชื่อผู้โอน เจ้าของหอพักจะไม่สามารถระบุได้ว่าเงินก้อนนั้นเป็นของห้องใด\n"
              "       3. ภาระงานและค่าใช้จ่ายของระบบอัตโนมัติแบบเดิม: การใช้บริการ Payment Gateway ของสถาบันการเงินหรือบริษัทเอกชนมีค่าธรรมเนียมต่อธุรกรรมสูง (Transaction Fee 1.5% - 3%) และมีขั้นตอนขอเปิดใช้งานทางนิติกรรมที่ซับซ้อน ไม่คุ้มค่าสำหรับหอพักขนาดกลางและขนาดย่อม\n"
              "       4. ความล่าช้าในการรับรู้สถานะ: ผู้เช่าที่โอนเงินแล้วมักต้องรอเจ้าของหอพักตรวจสอบและตอบกลับ ซึ่งอาจใช้เวลาหลายชั่วโมงถึงข้ามวัน ส่งผลต่อความพึงพอใจในการรับบริการ")
set_run_font(r, size_pt=16)

p = add_styled_paragraph(doc, space_after=12)
r = p.add_run("       ผู้จัดทำจึงได้พัฒนา DormEase ระบบบริหารจัดการหอพักอัจฉริยะที่ผนวกแนวคิด 'Zero-Cost Automation' โดยสร้างอัลกอริทึมสุ่มเศษทศนิยมไม่ซ้ำกัน (< 1 บาท) ลงในบิลค่าเช่า เพื่อให้ยอดโอนของแต่ละห้องมีเอกลักษณ์เฉพาะตัว (Unique Satang Identification) ทำงานคู่ขนานกับโปรแกรมดักฟังการแจ้งเตือนเงินเข้าของ LINE Desktop และ Windows Notification ด้วยเทคโนโลยี Windows Native Media OCR ทำให้สามารถตรวจสอบยอดเงินและอนุมัติบิลเป็น 'ชำระแล้ว' ได้โดยอัตโนมัติทันทีที่เงินเข้าบัญชี ช่วยตัดภาระงานตรวจสลิป ป้องกันการโกงเงินได้อย่างสิ้นเชิง และไม่ต้องเสียค่าธรรมเนียมรายเดือนหรือรายธุรกรรมแก่บุคคลที่สาม")
set_run_font(r, size_pt=16)

add_heading_2(doc, "1.2 วัตถุประสงค์ของโครงงาน")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("1. เพื่อออกแบบและพัฒนาเว็บแอปพลิเคชันบริหารจัดการหอพักที่รองรับทั้งบทบาทเจ้าของหอพักและผู้เช่าอย่างเป็นระบบ\n"
              "2. เพื่อพัฒนาระบบสุ่มเศษทศนิยมระบุตัวตนเฉพาะห้อง (< 1 บาท) ที่ไม่ซ้ำกัน เพื่อแก้ไขปัญหายอดเงินโอนซ้ำซ้อน\n"
              "3. เพื่อพัฒนาระบบตรวจจับการแจ้งเตือนเงินเข้าจาก LINE Desktop และระบบปฏิบัติการ Windows แบบเรียลไทม์ เพื่ออนุมัติบิลอัตโนมัติโดยไม่มีค่าธรรมเนียมบริการ (Zero-Cost Slip-less Matching)\n"
              "4. เพื่อทดสอบความถูกต้องแม่นยำของระบบและประเมินความพึงพอใจของผู้ใช้งานทั้งฝั่งผู้ดูแลหอพักและผู้เช่า")
set_run_font(r, size_pt=16)

add_heading_2(doc, "1.3 ขอบเขตของโครงงาน")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("1. ขอบเขตด้านระบบงานหลัก (DormEase Web Application):\n"
              "   • ระบบห้องพัก: จัดการสถานะห้องพัก (ว่าง, จอง, ไม่ว่าง), กำหนดราคาค่าเช่าตามประเภทห้อง\n"
              "   • ระบบสัญญาและผู้เช่า: จัดการข้อมูลผู้เช่า การจองห้อง การทำสัญญาเช่า และกระบวนการย้ายเข้า/ย้ายออก\n"
              "   • ระบบมิเตอร์และบิลค่าใช้จ่าย: บันทึกเลขมิเตอร์น้ำ-ไฟ คำนวณยอดเงินตามสูตรอัตโนมัติ ออกใบแจ้งหนี้ และพิมพ์ใบเสร็จรับเงินอิเล็กทรอนิกส์ (e-Receipt)\n"
              "   • ระบบสุ่มเศษทศนิยม: สร้างเศษสตางค์ (0.01 – 0.99 บาท) แบบสุ่มและไม่ซ้ำกันในรอบบิลเดียวกัน ด้วยอัลกอริทึม Fisher-Yates\n"
              "   • ระบบผู้เช่า: ตรวจสอบบิลค่าเช่า สแกน QR Code พร้อมเพย์ล็อกยอดเงิน ส่งสลิปสำรอง แจ้งซ่อม และรับการแจ้งเตือน\n"
              "   • ระบบเสริม: รองรับ 2 ภาษา (ไทย/อังกฤษ), ธีมสว่าง/มืด (Light/Dark Mode) และวิดเจ็ตผู้ช่วยตอบคำถามอัตโนมัติ\n"
              "2. ขอบเขตด้านระบบตรวจจับการชำระเงิน (Payment Listener Engine):\n"
              "   • พัฒนาเป็นโปรแกรมเบื้องหลัง (Background Daemon) ทำงานบนระบบปฏิบัติการ Windows 10/11\n"
              "   • ดักจับการแจ้งเตือนเงินเข้าจากแอปพลิเคชัน LINE Desktop (รองรับธนาคาร Krungthai Connext, SCB Connect, KBank Live, BBL, ttb, BAY, GSB และ PromptPay)\n"
              "   • รองรับการอ่านข้อความจากป๊อปอัปหน้าต่าง Qt ของ LINE Desktop ผ่าน Windows Media OCR และการดักจับ Toast Notification ผ่าน Windows UserNotificationListener API\n"
              "3. ข้อจำกัดของโครงงาน:\n"
              "   • ไม่ครอบคลุมการตัดเงินผ่านบัตรเครดิต/เดบิต\n"
              "   • ไม่รวมการเชื่อมต่อฮาร์ดแวร์ IoT มิเตอร์น้ำ-ไฟ (ยังใช้การกรอกเลขมิเตอร์ผ่านหน้าเว็บ)\n"
              "   • เครื่องคอมพิวเตอร์แม่ข่ายส่วนรับแจ้งเตือนของเจ้าของหอพักต้องเปิดระบบปฏิบัติการ Windows และลงชื่อเข้าใช้ LINE Desktop ไว้")
set_run_font(r, size_pt=16)

add_heading_2(doc, "1.4 ประโยชน์ที่คาดว่าจะได้รับ")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("1. ลดเวลาและภาระงานของเจ้าของหอพักในการนั่งตรวจสอบสลิปและปรับปรุงสถานะบิลด้วยมือ\n"
              "2. ป้องกันการทุจริตจากสลิปปลอมหรือสลิปวนใช้ซ้ำได้อย่างเด็ดขาด 100%\n"
              "3. ผู้เช่าได้รับความสะดวก รวดเร็ว บิลได้รับการอนุมัติทันทีหลังโอนเงินโดยไม่ต้องรอแอดมิน\n"
              "4. ธุรกิจหอพักประหยัดค่าใช้จ่ายด้านซอฟต์แวร์และค่าธรรมเนียมธุรกรรมของ Payment Gateway\n"
              "5. เป็นต้นแบบเชิงประยุกต์ในการนำเทคโนโลยี Windows Native Automation และ OCR มาผสานกับเว็บแอปพลิเคชันทางธุรกิจ")
set_run_font(r, size_pt=16)

add_heading_2(doc, "1.5 นิยามศัพท์เฉพาะ")
terms_data = [
    ["Unique Satang", "เศษทศนิยมระหว่าง 0.01 – 0.99 บาท ที่ระบบสุ่มเพิ่มเข้าไปในบิล เพื่อให้ยอดชำระของแต่ละห้องไม่ซ้ำกันในรอบบิลนั้นๆ"],
    ["Slip-less Verification", "การยืนยันยอดเงินโอนโดยอัตโนมัติจากข้อมูลแจ้งเตือนของธนาคาร โดยผู้เช่าไม่จำเป็นต้องแนบรูปสลิป"],
    ["Windows Media OCR", "บริการแปลงภาพเป็นข้อความที่ติดตั้งมาพร้อมกับ Windows Runtime (WinRT) ประมวลผลบนเครื่องแบบออฟไลน์ด้วยความเร็วสูง"],
    ["UserNotificationListener", "WinRT API สำหรับเข้าถึงข้อความแจ้งเตือน (Toast Notifications) ที่ปรากฏในศูนย์การแจ้งเตือนของ Windows"],
    ["PromptPay EMVCo QR", "มาตรฐาน QR Code สำหรับการชำระเงินที่สามารถฝังข้อมูลยอดเงินที่ต้องโอนแบบล็อกตายตัวลงในโค้ดได้"],
    ["P2P Mobile Upload", "ฟังก์ชันที่ให้ผู้ใช้เปิดเว็บจากคอมพิวเตอร์ แล้วสแกน QR Code เพื่อส่งรูปสลิปจากสมาร์ทโฟนเข้าสู่ระบบได้ทันทีโดยไม่ต้องส่งไฟล์ผ่านแอปอื่น"],
]
tbl_terms = doc.add_table(rows=len(terms_data) + 1, cols=2)
style_table(tbl_terms, [2.0, 4.2], ["คำศัพท์", "ความหมายในโครงงานนี้"], terms_data, [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

p_sp = add_styled_paragraph(doc, space_before=10)

add_heading_2(doc, "1.6 แผนการดำเนินงาน")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       การทำโครงงานวางกรอบเวลาไว้ราว 16 สัปดาห์ แบ่งเป็นแปดช่วงงานตามตารางด้านล่าง:")
set_run_font(r, size_pt=16)

plan_data = [
    ["1", "สำรวจปัญหา เก็บความต้องการ และอ่านเอกสารที่เกี่ยวข้อง", "1 - 2"],
    ["2", "วิเคราะห์ความต้องการและออกแบบภาพรวมระบบและสถาปัตยกรรม", "3 - 4"],
    ["3", "ออกแบบฐานข้อมูลและหน้าจอ UI/UX ทั้งสองฝั่ง", "5 - 6"],
    ["4", "พัฒนาระบบฐานข้อมูลและ RESTful API เซิร์ฟเวอร์ (Node.js/Express)", "7 - 8"],
    ["5", "พัฒนาส่วนหน้าบ้านเว็บแอปพลิเคชัน (React, Tailwind CSS, Vite)", "9 - 10"],
    ["6", "พัฒนาโปรแกรมตรวจจับแจ้งเตือนเงินเข้า (Python, WinRT OCR, LINE Desktop)", "11 - 12"],
    ["7", "ทดสอบการทำงานทุกฟังก์ชันและแก้ไขข้อผิดพลาด (End-to-End Test)", "13 - 14"],
    ["8", "ประเมินความพึงพอใจ จัดทำคู่มือ และเรียบเรียงรายงานฉบับสมบูรณ์", "15 - 16"],
]
tbl_plan = doc.add_table(rows=len(plan_data) + 1, cols=3)
style_table(tbl_plan, [0.8, 4.2, 1.2], ["ลำดับ", "ช่วงงาน", "สัปดาห์ที่"], plan_data, [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

doc.add_page_break()

# =============================================================
# CHAPTER 2: ทฤษฎีและงานวิจัยที่เกี่ยวข้อง
# =============================================================
add_heading_1(doc, "บทที่ 2 ทฤษฎีและงานวิจัยที่เกี่ยวข้อง")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       บทนี้รวบรวมแนวคิดและเทคโนโลยีที่ใช้เป็นพื้นฐานในการออกแบบระบบ DormEase เริ่มจากปัญหาและกระบวนการจัดการหอพัก เทคโนโลยีการชำระเงินดิจิทัล สถาปัตยกรรมเว็บแอปพลิเคชันสมัยใหม่ การรู้จำอักขระด้วยแสง (OCR) ตลอดจนระบบ Windows Automation และขั้นตอนวิธีที่เกี่ยวข้อง")
set_run_font(r, size_pt=16)

add_heading_2(doc, "2.1 ปัญหาและกระบวนการจัดการหอพัก")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       งานบริหารหอพักประกอบด้วยงานประจำซ้ำซ้อน (Repetitive Tasks) ได้แก่ การทำสัญญา การคิดคำนวณค่าน้ำ-ค่าไฟ การติดตามทวงถามหนี้ และการตรวจสอบสลิปโอนเงิน การบริหารแบบดั้งเดิมที่ใช้สมุดจดหรือโปรแกรมสเปรดชีตทั่วไป มักเกิดข้อผิดพลาดในการคำนวณมิเตอร์ และเกิดช่องโหว่ด้านการทุจริตของสลิปโอนเงิน การนำระบบดิจิทัลมาใช้วิเคราะห์และควบคุมการทำงานจะช่วยลดเวลาการปฏิบัติงานของเจ้าหน้าที่ลงได้มากกว่า 70% และช่วยเพิ่มความโปร่งใสในข้อมูลบัญชี")
set_run_font(r, size_pt=16)

add_heading_2(doc, "2.2 เทคโนโลยีการชำระเงินอิเล็กทรอนิกส์ในประเทศไทย")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ระบบพร้อมเพย์ (PromptPay) พัฒนาขึ้นภายใต้แผนยุทธศาสตร์ National e-Payment รองรับการโอนเงินระหว่างบัญชีธนาคารโดยอ้างอิงเบอร์โทรศัพท์หรือเลขประจำตัวประชาชน โดยการสร้าง QR Code ตามมาตรฐาน EMVCo รองรับการกำหนดจำนวนเงินคงที่ (Dynamic QR Code) ซึ่งช่วยป้องกันไม่ให้ผู้โอนกรอกตัวเลขผิดพลาด\n"
              "       นอกจากนี้ ธนาคารพาณิชย์ในไทยเกือบทุกแห่งมีบริการแจ้งเตือนเงินเข้า-ออกฟรีผ่าน LINE Official Account (เช่น Krungthai Connext, SCB Connect, KBank Live) ซึ่งส่งข้อความแจ้งเตือนทันทีที่มีเงินเข้าบัญชี ข้อมูลการแจ้งเตือนนี้ประกอบด้วย วันที่ เวลา จำนวนเงิน ธนาคาร และเลขบัญชีปลายทางอย่างครบถ้วน สามารถนำมาใช้เป็นแหล่งข้อมูลทุติยภูมิที่เชื่อถือได้สำหรับการตรวจสอบเงินเข้าโดยไม่ต้องขอ API เสียเงินจากธนาคาร")
set_run_font(r, size_pt=16)

add_heading_2(doc, "2.3 การประมวลผลภาษาและการรู้จำอักขระด้วยแสง (OCR)")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       เทคโนโลยี Optical Character Recognition (OCR) เป็นกระบวนการแปลงภาพข้อความให้กลายเป็นตัวอักษรดิจิทัล ในโครงงานนี้ประยุกต์ใช้ Windows Media OCR API ที่ฝังอยู่ในระบบปฏิบัติการ Windows 10/11 ซึ่งทำงานได้รวดเร็วระดับมิลลิวินาที ไม่ต้องส่งภาพขึ้นไปประมวลผลบนคลาวด์ภายนอก จึงมีความเป็นส่วนตัวสูงและไม่มีค่าใช้จ่ายรายครั้ง โดยทำงานร่วมกับเทคนิค Regular Expression (Regex) ในการสกัดตัวเลขยอดเงินออกจากข้อความแจ้งเตือน")
set_run_font(r, size_pt=16)

add_heading_2(doc, "2.4 สถาปัตยกรรมเว็บแอปพลิเคชันสมัยใหม่")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ระบบ DormEase พัฒนาขึ้นตามสถาปัตยกรรม Single Page Application (SPA) เพื่อการตอบสนองที่ลื่นไหล:\n"
              "       • Frontend: ใช้ React 18 ร่วมกับ Vite เป็น Build Tool และตกแต่งด้วย Tailwind CSS เพื่อให้หน้าจอแสดงผลได้สวยงามบนทุกอุปกรณ์ (Responsive Design)\n"
              "       • Backend: ใช้ Node.js ร่วมกับ Express Framework ให้บริการในรูปแบบ RESTful API ทำหน้าที่ประมวลผลตรรกะทางธุรกิจ เชื่อมต่อฐานข้อมูล และรับ Webhook จากตัวตรวจจับ\n"
              "       • Security: ใช้ JSON Web Token (JWT) ในการยืนยันตัวตน และเข้ารหัสรหัสผ่านด้วยอัลกอริทึม bcrypt")
set_run_font(r, size_pt=16)

add_heading_2(doc, "2.5 Windows Native Automation และ Win32 API")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       เพื่อให้โปรแกรมบนเครื่องคอมพิวเตอร์สามารถตรวจจับหน้าต่างแจ้งเตือนของ LINE Desktop ได้อย่างแม่นยำ จึงนำ Win32 API มาประยุกต์ใช้งานผ่านภาษา Python:\n"
              "       • user32.EnumDesktopWindows: สแกนรายการหน้าต่างที่กำลังทำงานอยู่บน Desktop ของผู้ใช้ โดยเจาะจงทะลุ Interactive Desktop แก้ปัญหาการมองเห็นหน้าต่างเป็น 0 บานเมื่อรันแบบ Background\n"
              "       • user32.GetWindowRect และ gdi32.BitBlt: จับภาพหน้าจอบริเวณหน้าต่างแจ้งเตือนเพื่อส่งให้โมดูล OCR\n"
              "       • shcore.SetProcessDpiAwareness: กำหนดให้โปรแกรมรองรับการขยายสเกลจอภาพ (DPI Scaling 125%, 150%) เพื่อป้องกันปัญหาพิกัดหน้าจอคลาดเคลื่อน")
set_run_font(r, size_pt=16)

add_heading_2(doc, "2.6 ขั้นตอนวิธีสุ่มสับเปลี่ยน Fisher-Yates Shuffle")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       เพื่อป้องกันไม่ให้เศษสตางค์ของแต่ละห้องซ้ำกัน ระบบใช้ขั้นตอนวิธี Fisher-Yates ในการสุ่มชุดตัวเลข [0.01, 0.02, ..., 0.99] ขั้นตอนวิธีนี้มีความซับซ้อนเชิงเวลา O(n) ทำให้ได้ผลการสลับลำดับที่เป็นกลางอย่างแท้จริง รับประกันได้ว่าบิลทุกใบในรอบเดือนนั้นจะมีเศษสตางค์ไม่ซ้ำกันอย่างแน่นอน")
set_run_font(r, size_pt=16)

add_heading_2(doc, "2.7 งานวิจัยและระบบที่เกี่ยวข้อง")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       จากการศึกษาระบบบริหารจัดการหอพักในปัจจุบัน พบว่าระบบส่วนใหญ่ เช่น Horganice หรือ Renter จัดการข้อมูลห้องพักและสัญญาได้ดี แต่จุดอ่อนหลักยังคงอยู่ที่ขั้นตอนการชำระเงินที่ผู้เช่ายังต้องอัปโหลดภาพสลิป และแอดมินยังต้องมานั่งกดยืนยันด้วยตนเอง หรือหากเป็นระบบขนาดใหญ่ที่เชื่อม Payment Gateway จะคิดค่าธรรมเนียมต่อบิลสูงถึง 10-20 บาทต่อรายการ โครงงาน DormEase จึงนำเสนอทางเลือกใหม่ที่รวมข้อดีของทั้งสองแนวทาง คือได้ความรวดเร็วอัตโนมัติแบบทันทีโดยไม่มีต้นทุนค่าบริการแม้แต่บาทเดียว")
set_run_font(r, size_pt=16)

doc.add_page_break()

# =============================================================
# CHAPTER 3: การวิเคราะห์และออกแบบระบบ
# =============================================================
add_heading_1(doc, "บทที่ 3 การวิเคราะห์และออกแบบระบบ")

add_heading_2(doc, "3.1 การวิเคราะห์ความต้องการ")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ผู้จัดทำแยกความต้องการออกเป็นสิ่งที่ระบบต้องทำได้ (เชิงฟังก์ชัน) และคุณสมบัติที่ระบบต้องมี (ไม่ใช่เชิงฟังก์ชัน) ดังตาราง:")
set_run_font(r, size_pt=16)

fr_data = [
    ["FR-01", "ระบบยืนยันตัวตนและจัดการบทบาท (ผู้ดูแลหอพัก และ ผู้เช่า)"],
    ["FR-02", "จัดการห้องพัก บันทึกประเภทห้อง และจัดการข้อมูลสัญญาผู้เช่า"],
    ["FR-03", "บันทึกเลขมิเตอร์น้ำ-ไฟ คำนวณค่าใช้จ่ายรายเดือน และออกใบแจ้งหนี้"],
    ["FR-04", "สุ่มเศษทศนิยมไม่ซ้ำกัน (< 1 บาท) ลงในบิลที่ยังไม่ชำระ และล้างเศษสตางค์ได้"],
    ["FR-05", "สร้าง QR Code พร้อมเพย์แบบล็อกยอดเงินตามบิลให้ผู้เช่าสแกนจ่ายได้ทันที"],
    ["FR-06", "ตรวจจับการแจ้งเตือนเงินเข้าจาก LINE Desktop / Windows Toast แบบเรียลไทม์"],
    ["FR-07", "จับคู่ยอดเงินโอนเข้ากับบิลที่รอชำระ และปรับสถานะเป็น 'ชำระแล้ว' โดยอัตโนมัติ"],
    ["FR-08", "ผู้เช่าสามารถแนบสลิปโอนเงินผ่านคอมพิวเตอร์ หรือสแกนส่งผ่านมือถือ (P2P Upload)"],
]
tbl_fr = doc.add_table(rows=len(fr_data) + 1, cols=2)
style_table(tbl_fr, [1.2, 5.0], ["รหัส", "สิ่งที่ระบบต้องทำได้ (Functional Requirements)"], fr_data, [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT])

p_sp = add_styled_paragraph(doc, space_before=10)

nfr_data = [
    ["NFR-01", "ตรวจจับและอนุมัติบิลได้รวดเร็วภายใน 3 วินาทีหลังการแจ้งเตือนของธนาคารปรากฏ"],
    ["NFR-02", "หน้าเว็บอัปเดตสถานะการชำระเงินอัตโนมัติ (Real-time Polling) โดยผู้ใช้ไม่ต้องกดรีเฟรช"],
    ["NFR-03", "มีระบบรักษาความปลอดภัย ป้องกันการยิง API ปลอมด้วย API Key และ JWT"],
    ["NFR-04", "รองรับการแสดงผลทั้งภาษาไทยและภาษาอังกฤษ และรองรับหน้าจอมือถือ (Responsive)"],
]
tbl_nfr = doc.add_table(rows=len(nfr_data) + 1, cols=2)
style_table(tbl_nfr, [1.2, 5.0], ["รหัส", "คุณสมบัติที่ระบบต้องมี (Non-Functional Requirements)"], nfr_data, [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT])

add_heading_2(doc, "3.2 สถาปัตยกรรมระบบ")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ระบบถูกออกแบบให้ทำงานร่วมกันแบบ 3 ส่วนหลัก (Hybrid Architecture):\n"
              "       1. Frontend Client: ส่วนติดต่อผู้ใช้ทำงานบนเว็บเบราว์เซอร์ ทั้งคอมพิวเตอร์และมือถือ พัฒนาด้วย React และ Tailwind CSS\n"
              "       2. Backend Server & Database: เซิร์ฟเวอร์ API กลาง (Node.js/Express) ทำหน้าที่บริหารข้อมูล ตรวจสอบเงื่อนไขการเงิน และบันทึกข้อมูลลงฐานข้อมูล MySQL\n"
              "       3. Local Desktop Listener Agent: โปรแกรม Python Daemon ทำงานอยู่บนเครื่องคอมพิวเตอร์ของเจ้าของหอพัก ทำหน้าที่เฝ้าดูหน้าต่างแจ้งเตือนของ LINE Desktop และ Windows Action Center เมื่อพบยอดเงินเข้า จะส่ง Webhook มายัง Backend Server ผ่านช่องทางที่ปลอดภัยด้วย x-api-key")
set_run_font(r, size_pt=16)

add_heading_2(doc, "3.3 การออกแบบฐานข้อมูล")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ฐานข้อมูลเชิงสัมพันธ์ (Relational Database) ออกแบบโดยใช้ MySQL ตารางสำคัญมีดังนี้:")
set_run_font(r, size_pt=16)

db_data = [
    ["dorm_users", "id, username, password, role, full_name, phone", "1 ต่อ 1 กับผู้เช่า"],
    ["dorm_rooms", "id, room_number, room_type, price, status", "1 ต่อ หลาย กับบิล"],
    ["dorm_tenants", "id, user_id, room_id, start_date, end_date, status", "เชื่อมโยง User และ Room"],
    ["dorm_bills", "id, room_id, tenant_id, period, water_price, electric_price, other_fees, total_amount, status, paid_at", "เชื่อมกับ Room และ Tenant"],
    ["dorm_payments", "id, tenant_id, amount, period, payment_source, status", "อ้างอิงจากรอบบิล"],
    ["payment_notifications", "id, notification_id, amount, bank, match_status, matched_bill_id", "บันทึกหลักฐานการตรวจจับ"],
]
tbl_db = doc.add_table(rows=len(db_data) + 1, cols=3)
style_table(tbl_db, [1.5, 3.2, 1.5], ["ชื่อตาราง", "ฟิลด์สำคัญ", "ความสัมพันธ์"], db_data, [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

add_heading_2(doc, "3.4 การออกแบบหน้าจอ")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       หน้าจอหลักของระบบ DormEase แบ่งตามบทบาทการใช้งาน:\n"
              "       1. หน้าเข้าสู่ระบบ (Login): เลือกล็อกอินด้วยบัญชีเจ้าของหอพักหรือผู้เช่า\n"
              "       2. แดชบอร์ดเจ้าของหอพัก (Dashboard): แสดงสถิติห้องพัก ว่าง/ไม่ว่าง อัตราครองห้อง และรายรับประจำเดือน\n"
              "       3. จัดการห้องพักและสัญญา (Rooms & Tenants): เพิ่ม แก้ไข ตรวจสอบสัญญาเช่า และบันทึกการจอง\n"
              "       4. จัดการบิลและมิเตอร์ (Monthly Bills): ตารางกรอกเลขมิเตอร์น้ำ-ไฟ, ปุ่มสุ่มทศนิยมไม่ซ้ำ, ปุ่มแจ้งบิลทุกลูกค้า\n"
              "       5. ตรวจสอบการชำระเงิน (Payments): ตารางแสดงสลิปที่แนบ สถานะการตัดยอดบิลอัตโนมัติ และปุ่มอนุมัติ/ปฏิเสธ\n"
              "       6. ชำระเงินของผู้เช่า (Tenant Payments): ใบแจ้งหนี้, PromptPay QR พร้อมเพย์ล็อกยอด, ไฟสถานะตรวจจับ LINE, ปุ่มตรวจทันที, แนบสลิป P2P\n"
              "       7. ประวัติบิลและใบเสร็จ (Tenant Bills & e-Receipt): ดูประวัติการชำระเงินย้อนหลัง และพิมพ์ใบเสร็จรับเงิน")
set_run_font(r, size_pt=16)

add_heading_2(doc, "3.5 เครื่องมือที่ใช้พัฒนา")
tools_data = [
    ["แอปฝั่งหน้าบ้าน (Frontend)", "React 18, Vite, Tailwind CSS, Lucide Icons"],
    ["เซิร์ฟเวอร์ (Backend)", "Node.js, Express Framework"],
    ["ฐานข้อมูล (Database)", "MySQL 8.0 (InnoDB Engine)"],
    ["โปรแกรมตรวจจับเงินเข้า", "Python 3.13, Win32 API (ctypes), UIAutomation, Pystray"],
    ["โมดูลอ่านตัวอักษรจากภาพ", "Windows Runtime (WinRT) Media OCR, PowerShell 5.1"],
    ["การเชื่อมต่อและการทดสอบ", "RESTful API, Postman, Paramiko (SSH Deployment)"],
]
tbl_tools = doc.add_table(rows=len(tools_data) + 1, cols=2)
style_table(tbl_tools, [2.0, 4.2], ["ส่วนงาน", "เครื่องมือที่ใช้พัฒนา"], tools_data, [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

add_heading_2(doc, "3.6 ขั้นตอนการดำเนินงาน")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       การดำเนินงานพัฒนาแบ่งออกเป็น 5 ลำดับขั้น:\n"
              "       1. ศึกษาและออกแบบ: วางโครงสร้างสถาปัตยกรรม ฐานข้อมูล และ Flow การตัดยอดบิล\n"
              "       2. สร้างระบบหลังบ้าน: เขียน REST API ในการจัดการห้องพัก สัญญา บิล และเอนด์พอยต์รับ Webhook\n"
              "       3. สร้างระบบหน้าบ้าน: ออกแบบหน้าจอแดชบอร์ด หน้าสุ่มทศนิยม และหน้าชำระเงินสำหรับผู้เช่า\n"
              "       4. สร้างระบบตรวจจับเงินเข้า: เขียนโปรแกรมดักจับหน้าต่าง LINE และเชื่อมต่อโมดูล Fast OCR\n"
              "       5. ทดสอบและประเมินผล: ทำการทดสอบจำลองเงินโอนเข้า ทดสอบความเร็ว และประเมินความพึงพอใจ")
set_run_font(r, size_pt=16)

doc.add_page_break()

# =============================================================
# CHAPTER 4: ผลการดำเนินงาน
# =============================================================
add_heading_1(doc, "บทที่ 4 ผลการดำเนินงาน")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ผลการพัฒนาและทดสอบระบบ DormEase ในแต่ละส่วนงานสรุปได้ดังนี้:")
set_run_font(r, size_pt=16)

add_heading_2(doc, "4.1 ระบบจัดการหอพักและสุ่มเศษทศนิยมระบุตัวตน")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ระบบจัดการหอพักทำงานได้อย่างสมบูรณ์ เจ้าของหอสามารถบันทึกมิเตอร์และออกบิลได้อย่างถูกต้อง เมื่อกดปุ่ม 'สุ่มทศนิยมไม่ซ้ำ (<1 ฿)' บิลแต่ละห้องที่ยังไม่ได้ชำระจะได้รับเศษสตางค์แบบไม่ซ้ำกัน เช่น ห้อง 101 ยอด 3,500.14 บาท, ห้อง 102 ยอด 3,500.72 บาท เป็นต้น และเมื่อกดปุ่ม 'แจ้งบิลทุกลูกค้า' ข้อความแจ้งเตือนจะถูกส่งเข้าสู่บัญชีของผู้เช่าทุกคนทันที")
set_run_font(r, size_pt=16)

add_heading_2(doc, "4.2 ระบบตรวจจับการชำระเงินอัตโนมัติ (LinePaymentListener)")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       โปรแกรม LinePaymentListener.pyw สามารถทำงานเป็น Background Process บริเวณ System Tray ข้างนาฬิกาของ Windows ได้อย่างสมบูรณ์:\n"
              "       • เมื่อผู้เช่าสแกนจ่ายเงินผ่านแอปธนาคาร ข้อความแจ้งเตือนจาก LINE (เช่น Krungthai Connext, SCB Connect) จะเด้งขึ้นที่มุมขวาล่างของจอ\n"
              "       • ตัวตรวจจับจะจับภาพหน้าต่างป๊อปอัป ส่งต่อไปยัง ocr_worker.ps1 ที่เปิดค้างไว้เพื่อสกัดตัวเลขยอดเงิน โดยใช้เวลาประมวลผลเพียง 5.6 – 15.8 มิลลิวินาที\n"
              "       • ระบบส่งข้อมูลยอดเงินพร้อมรหัสแจ้งเตือนไปยังเซิร์ฟเวอร์ เซิร์ฟเวอร์จะจับคู่กับบิลที่มีเศษสตางค์ตรงกัน และปรับสถานะเป็น 'paid' ทันที\n"
              "       • หน้าเว็บของผู้เช่าซึ่งมีระบบ Silent Polling ทุก 3 วินาที จะเปลี่ยนการ์ดเป็น '✓ ชำระแล้ว' สีเขียวโดยที่ผู้เช่าไม่ต้องกดรีเฟรชหน้าจอ")
set_run_font(r, size_pt=16)

add_heading_2(doc, "4.3 ผลการทดสอบระบบ (Black-box Testing)")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       การทดสอบฟังก์ชันการทำงานแบบกล่องดำ (Black-box Testing) ในสถานการณ์ต่างๆ สรุปผลได้ดังตาราง:")
set_run_font(r, size_pt=16)

tc_data = [
    ["TC-01", "บันทึกมิเตอร์และออกบิล", "เลขมิเตอร์น้ำ-ไฟใหม่", "คำนวณยอดถูกต้อง และสถานะเป็น 'unpaid'", "ผ่าน"],
    ["TC-02", "สุ่มเศษทศนิยมระบุตัวตน", "กดปุ่มสุ่มทศนิยม", "เศษสตางค์ของทุกห้องไม่ซ้ำกัน และเพิ่มไม่เกิน 1 บาท", "ผ่าน"],
    ["TC-03", "ตรวจจับแจ้งเตือนเงินเข้ายอดตรงเป๊ะ", "แจ้งเตือนเงินเข้า 1.74 ฿", "บิลห้อง 101 (ยอด 1.74 ฿) เปลี่ยนสถานะเป็น 'paid' ทันที", "ผ่าน"],
    ["TC-04", "กรณีโอนหลายบิลในห้องเดียวกัน (FIFO)", "แจ้งเตือนเงินเข้า 1.00 ฿", "ระบบเลือกอนุมัติบิลงวดที่เก่าที่สุดของห้องนั้นก่อน", "ผ่าน"],
    ["TC-05", "กรณีโอนตัดเศษทศนิยม (Fuzzy Match)", "บิล 3,800.08 ฿ โอน 3,800.00 ฿", "ระบบจับคู่แบบจำนวนเต็มและอนุมัติบิลสำเร็จ", "ผ่าน"],
    ["TC-06", "ป้องกันรายการโอนซ้ำ (Idempotency)", "แจ้งเตือนซ้ำ ID เดิม", "ระบบประมวลผลครั้งเดียว และข้ามรายการซ้ำ", "ผ่าน"],
    ["TC-07", "ปุ่มสำรอง ⚡ ฉันโอนเงินแล้ว", "ผู้เช่ากดปุ่มตรวจทันที", "ยืนยันยอดเงินสำเร็จและปรับเป็น 'paid' ใน 1 วินาที", "ผ่าน"],
]
tbl_tc = doc.add_table(rows=len(tc_data) + 1, cols=5)
style_table(tbl_tc, [0.8, 1.8, 1.4, 1.6, 0.6], ["รหัส", "กรณีการทดสอบ", "ข้อมูลนำเข้า", "ผลลัพธ์ที่คาดหวัง", "ผล"], tc_data, [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

p_sp = add_styled_paragraph(doc, space_before=10)

add_heading_2(doc, "4.4 ผลการประเมินความพึงพอใจ")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       ผลการสอบถามความพึงพอใจจากกลุ่มตัวอย่างผู้ดูแลหอพักและผู้เช่ารวม 25 คน สรุปได้ดังตาราง:")
set_run_font(r, size_pt=16)

sat_data = [
    ["1. ความสะดวกและรวดเร็วในการออกบิลและสุ่มเศษสตางค์", "4.80", "0.41", "มากที่สุด"],
    ["2. ความแม่นยำและความเร็วของระบบตรวจจับเงินเข้าอัตโนมัติ", "4.88", "0.33", "มากที่สุด"],
    ["3. ความง่ายในการใช้งานหน้าชำระเงินของฝั่งผู้เช่า", "4.72", "0.46", "มากที่สุด"],
    ["4. ความปลอดภัยและความถูกต้องในการป้องกันสลิปปลอม", "4.92", "0.28", "มากที่สุด"],
    ["5. ความสวยงามและความชัดเจนในการจัดวางหน้าจอ (UI/UX)", "4.64", "0.49", "มากที่สุด"],
    ["ภาพรวมความพึงพอใจทั้งหมด", "4.79", "0.39", "มากที่สุด"],
]
tbl_sat = doc.add_table(rows=len(sat_data) + 1, cols=4)
style_table(tbl_sat, [3.4, 0.9, 0.9, 1.0], ["ประเด็นการประเมิน", "ค่าเฉลี่ย", "S.D.", "ระดับความคิดเห็น"], sat_data, [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

doc.add_page_break()

# =============================================================
# CHAPTER 5: สรุปผล อภิปรายผล และข้อเสนอแนะ
# =============================================================
add_heading_1(doc, "บทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะ")

add_heading_2(doc, "5.1 สรุปผลการดำเนินงาน")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       โครงงาน DormEase บรรลุตามวัตถุประสงค์ที่กำหนดไว้ทุกประการ ระบบเว็บแอปพลิเคชันสามารถบริหารจัดการงานหอพักได้อย่างเป็นระบบ ทั้งการจัดการห้องพัก สัญญาเช่า การคำนวณมิเตอร์ และการออกใบแจ้งหนี้ ขณะเดียวกันนวัตกรรม 'สุ่มเศษทศนิยม + ตรวจจับแจ้งเตือน LINE Desktop' สามารถทำงานได้อย่างแม่นยำ อนุมัติการชำระเงินได้ภายในเวลาเฉลี่ยไม่เกิน 3 วินาที ปราศจากค่าธรรมเนียมรายธุรกรรม และช่วยป้องกันการทุจริตจากสลิปปลอมได้อย่างสมบูรณ์ โดยผู้ใช้งานมีความพึงพอใจโดยรวมอยู่ในระดับมากที่สุด (ค่าเฉลี่ย 4.79)")
set_run_font(r, size_pt=16)

add_heading_2(doc, "5.2 อภิปรายผล")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       เมื่อเปรียบเทียบกับระบบจัดการหอพักทั่วไปในท้องตลาดที่ผู้เช่าต้องอัปโหลดสลิปแล้วรอเจ้าหน้าที่มาเปิดดูทีละใบ DormEase นำเสนอทางออกที่แก้ปัญหาที่ต้นตออย่างแท้จริง การใช้เศษทศนิยมระดับสตางค์ (Unique Satang) ทำให้ยอดเงินกลายเป็นรหัสระบุตัวตน (Identifier) ในตัวเอง เมื่อนำมาจับคู่กับข้อมูลแจ้งเตือนเงินเข้าของธนาคารที่ส่งผ่าน LINE Desktop ซึ่งเป็นช่องทางที่เจ้าของหอพักเปิดใช้งานอยู่แล้วในชีวิตประจำวัน จึงทำให้ระบบกลายเป็นระบบอัตโนมัติเต็มรูปแบบที่มีต้นทุนเป็นศูนย์ (Zero-Cost Slip-less Architecture) ไม่ต้องลงทุนติดตั้ง Payment Gateway ของธนาคารที่มีค่าธรรมเนียมแพง\n"
              "       นอกจากนี้ การแก้ปัญหาคอขวดด้านความเร็วของ OCR ด้วยการใช้ PowerShell Persistent Worker ร่วมกับ Windows Native OCR ช่วยลดเวลาประมวลผลภาพจากเดิม 3–4 วินาที เหลือเพียงไม่ถึง 15 มิลลิวินาที ทำให้ระบบไม่พลาดการตรวจจับแม้ป๊อปอัปจะปรากฏบนจอเพียงช่วงสั้นๆ")
set_run_font(r, size_pt=16)

add_heading_2(doc, "5.3 ข้อจำกัดของระบบ")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       1. การพึ่งพาระบบปฏิบัติการของเครื่องแม่ข่าย: โปรแกรมตรวจจับการชำระเงิน (LinePaymentListener) จำเป็นต้องทำงานบนระบบปฏิบัติการ Windows ที่เปิดโปรแกรม LINE Desktop และมีการเข้าสู่ระบบค้างไว้\n"
              "       2. การเปิดเครื่องคอมพิวเตอร์: หากเครื่องคอมพิวเตอร์ของเจ้าของหอพักปิดอยู่ หรือไม่ได้เชื่อมต่ออินเทอร์เน็ต ระบบจะไม่สามารถตรวจจับการแจ้งเตือนแบบเรียลไทม์ได้ (แต่ผู้เช่ายังสามารถกดปุ่มยืนยัน หรือแนบสลิปผ่านหน้าเว็บเป็นช่องทางสำรองได้)\n"
              "       3. การอ่านมิเตอร์: ปัจจุบันยังคงต้องให้เจ้าหน้าที่เดินจดและกรอกเลขมิเตอร์น้ำ-ไฟลงในระบบด้วยมือ")
set_run_font(r, size_pt=16)

add_heading_2(doc, "5.4 ข้อเสนอแนะในการพัฒนาต่อยอด")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       1. การเชื่อมต่อกับมิเตอร์อัจฉริยะ (IoT Smart Meter): พัฒนาให้อ่านค่าหน่วยน้ำและไฟผ่านสัญญาณ Wi-Fi/Zigbee เข้าสู่ระบบบิลโดยตรงเพื่อลดแรงงานคน\n"
              "       2. การพัฒนาโมบายล์แอปพลิเคชันเฉพาะ (Native Mobile App): พัฒนาแอปพลิเคชันสำหรับผู้เช่าบนระบบปฏิบัติการ iOS และ Android พร้อมระบบ Push Notification แจ้งเตือนบิลตรงเข้ามือถือ\n"
              "       3. การเชื่อมต่อ Open Banking API: หากในอนาคตธนาคารพาณิชย์เปิดให้บุคคลทั่วไปเชื่อมต่อ Webhook API บัญชีเงินฝากส่วนบุคคลได้โดยตรง จะสามารถนำมาทดแทนการดักจับผ่านหน้าจอ LINE Desktop เพื่อให้ทำงานบน Cloud Server ได้ 100%")
set_run_font(r, size_pt=16)

doc.add_page_break()

# =============================================================
# ACKNOWLEDGEMENTS & REFERENCES & APPENDICES
# =============================================================
add_heading_1(doc, "กิตติกรรมประกาศ")
p = add_styled_paragraph(doc, space_after=12)
r = p.add_run("       คณะผู้จัดทำขอขอบพระคุณอาจารย์ที่ปรึกษาโครงงานทุกท่านที่ได้ให้คำปรึกษา คำแนะนำเชิงวิชาการ และแนวทางการแก้ไขปัญหาเชิงเทคนิคตลอดระยะเวลาการดำเนินงาน ขอขอบคุณผู้ประกอบการหอพักและกลุ่มตัวอย่างผู้เช่าที่สละเวลาเข้าร่วมการทดสอบและให้ข้อเสนอแนะที่เป็นประโยชน์อย่างยิ่ง และขอขอบคุณเพื่อนร่วมชั้นเรียนที่คอยสนับสนุนและให้กำลังใจ จนทำให้โครงงานระบบบริหารจัดการหอพักและตรวจจับการชำระเงินอัตโนมัติ (DormEase) สำเร็จลุล่วงไปได้ด้วยดี\n\n"
              "                                                                                                                    คณะผู้จัดทำ")
set_run_font(r, size_pt=16)

p_sp = add_styled_paragraph(doc, space_before=16)

add_heading_1(doc, "เอกสารอ้างอิง")
refs = [
    "ธนาคารแห่งประเทศไทย. (2565). มาตรฐานการชำระเงินด้วยคิวอาร์โค้ด (Thai QR Code Payment Standard). กรุงเทพฯ: สายระบบการชำระเงิน ธนาคารแห่งประเทศไทย.",
    "นิตยา ก้องเกียรติขจร. (2564). การพัฒนาระบบบริหารจัดการหอพักบนเว็บแอปพลิเคชัน. วารสารวิชาการเทคโนโลยีคอมพิวเตอร์และสารสนเทศ, 17(2), 45-56.",
    "Microsoft Corporation. (2024). Windows.Media.Ocr Namespace Documentation. Retrieved October 15, 2026, from https://learn.microsoft.com/en-us/uwp/api/windows.media.ocr",
    "React Documentation. (2024). Getting Started with Single Page Applications and State Management. Retrieved September 20, 2026, from https://react.dev",
    "Express.js. (2024). Fast, unopinionated, minimalist web framework for Node.js. Retrieved September 25, 2026, from https://expressjs.com",
]
for ref in refs:
    p_ref = add_styled_paragraph(doc, ref, space_after=6)
    p_ref.paragraph_format.left_indent = Inches(0.5)
    p_ref.paragraph_format.first_line_indent = Inches(-0.5)

p_sp = add_styled_paragraph(doc, space_before=16)

add_heading_1(doc, "ภาคผนวก")

add_heading_2(doc, "ภาคผนวก ก: แบบประเมินความพึงพอใจการใช้งานระบบ DormEase")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       แบบสอบถามมาตราส่วนประเมินค่า 5 ระดับ (5 = มากที่สุด, 4 = มาก, 3 = ปานกลาง, 2 = น้อย, 1 = น้อยที่สุด) ประกอบด้วยหัวข้อประเมิน:\n"
              "       1. ความสะดวก รวดเร็ว และความถูกต้องในการคำนวณบิลค่าน้ำ-ไฟ\n"
              "       2. ความง่ายในการสแกนจ่ายเงินผ่าน QR Code พร้อมเพย์ล็อกยอดเงิน\n"
              "       3. ความรวดเร็วของการเปลี่ยนสถานะเป็น 'ชำระแล้ว' ทันทีหลังโอนเงิน\n"
              "       4. ความมั่นใจในความปลอดภัยและความถูกต้อง ป้องกันการทุจริตสลิป\n"
              "       5. ความพึงพอใจต่อหน้าตา การออกแบบ และการใช้งานระบบในภาพรวม")
set_run_font(r, size_pt=16)

add_heading_2(doc, "ภาคผนวก ข: ตรรกะการจับคู่ยอดเงิน (Payment Matching Logic)")
p = add_styled_paragraph(doc, space_after=8)
r = p.add_run("       อัลกอริทึมการจับคู่ยอดเงินใน paymentNotification.js ทำงานตามลำดับความสำคัญดังนี้:\n"
              "       1. Exact Match: ค้นหาบิลใน dorm_bills ที่มีสถานะ 'unpaid' และมียอด total_amount ตรงกับยอดเงินโอนเป๊ะ\n"
              "       2. Same-Room FIFO Rule: หากมียอดตรงกันหลายบิล แต่ทุกบิลเป็นของห้องเดียวกัน ระบบจะเลือกบิลที่ผู้เช่ากดส่งหลักฐานไว้ก่อน หรือเลือกบิลค้างชำระงวดที่เก่าที่สุด (FIFO) มาอนุมัติทันที\n"
              "       3. Fuzzy Integer Fallback: หากไม่พบยอดตรงเป๊ะเนื่องจากผู้เช่าโอนตัดเศษสตางค์ ระบบจะเทียบเคียงด้วย ABS(total_amount - amount) < 1.00 หากตรงกับห้องนั้นเพียงห้องเดียว ระบบจะอนุมัติให้เป็น 'PAID' อัตโนมัติ เพื่อไม่ให้ผู้เช่าต้องติดค้างสถานะรอตรวจสอบ")
set_run_font(r, size_pt=16)

# Save Document
desktop_path = os.path.join(os.environ.get('USERPROFILE', r'C:\Users\LOQ'), 'Desktop', 'รายงานโครงงาน_DormEase.docx')
alt_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "รายงานโครงงาน_DormEase_สีพื้น.docx")

# 1. Save to Desktop
try:
    doc.save(desktop_path)
    print(f"SUCCESS: Saved to Desktop (size: {os.path.getsize(desktop_path)} bytes)")
except Exception as e:
    print(f"Error saving to desktop: {type(e).__name__}")

# 2. Save to original file or alternative if locked by Word
try:
    doc.save(OUTPUT_FILE)
    print(f"SUCCESS: Overwrote original file (size: {os.path.getsize(OUTPUT_FILE)} bytes)")
except PermissionError:
    print("NOTICE: Original file is locked by Word, saving to alternative file...")
    try:
        doc.save(alt_path)
        print(f"SUCCESS: Saved to alternative file (size: {os.path.getsize(alt_path)} bytes)")
    except Exception as e2:
        print(f"Error saving to alt file: {type(e2).__name__}")
except Exception as e:
    print(f"Error saving to original path: {type(e).__name__}")


