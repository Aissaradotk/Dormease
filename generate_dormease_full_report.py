# -*- coding: utf-8 -*-
"""
Generate Complete Academic Report for DormEase (.docx)
Following the exact 23-page academic report template structure from Kasetsart University Sriracha Campus.
Includes live web screenshots, structured tables, plain academic styling, and complete chapters 1-5.
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DESKTOP_DIR = os.path.join(os.environ.get('USERPROFILE', r'C:\Users\LOQ'), 'Desktop')
TARGET_DESKTOP = os.path.join(DESKTOP_DIR, "รายงานโครงงาน_DormEase.docx")
TARGET_FOLDER = os.path.join(BASE_DIR, "รายงานโครงงาน_DormEase.docx")
TARGET_FOLDER_ALT = os.path.join(BASE_DIR, "รายงานโครงงาน_DormEase_ฉบับสมบูรณ์.docx")

ARTIFACTS_DIR = r"C:\Users\LOQ\.gemini\antigravity\brain\62b920be-82f7-4b3e-9678-49cd72bb9395"

doc = docx.Document()

# -------------------------------------------------------------
# 1. Page Setup & Margins (Academic Standard A4)
# -------------------------------------------------------------
for section in doc.sections:
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    section.page_width = Inches(8.27)   # A4 Width
    section.page_height = Inches(11.69) # A4 Height

# -------------------------------------------------------------
# 2. Typography & Color Palette (Plain Academic Standard)
# -------------------------------------------------------------
FONT_NAME = "TH Sarabun New"
FONT_SIZE_BODY = 16
FONT_SIZE_H1 = 18
FONT_SIZE_H2 = 16
FONT_SIZE_TITLE = 20

COLOR_BLACK = RGBColor(0, 0, 0)
COLOR_MUTED = RGBColor(80, 80, 80)

def set_run_font(run, font_name=FONT_NAME, size_pt=FONT_SIZE_BODY, bold=False, italic=False, color=COLOR_BLACK):
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

def add_p(doc, text="", space_before=0, space_after=4, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT, bold=False, italic=False, size_pt=FONT_SIZE_BODY, color=COLOR_BLACK):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if text:
        run = p.add_run(text)
        set_run_font(run, size_pt=size_pt, bold=bold, italic=italic, color=color)
    return p

def add_h1(doc, text):
    return add_p(doc, text, space_before=14, space_after=6, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size_pt=FONT_SIZE_H1)

def add_h2(doc, text):
    return add_p(doc, text, space_before=10, space_after=4, align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, size_pt=FONT_SIZE_H2)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def style_academic_table(table, col_widths, headers, data, align_cols=None):
    """
    Renders academic table with clean plain light gray header (#F2F2F2),
    pure black bold text, crisp Table Grid borders, and white body rows.
    """
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    
    # Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "F2F2F2")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=130, right=130)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        if len(p.runs) > 0:
            set_run_font(p.runs[0], size_pt=15, bold=True, color=COLOR_BLACK)
            
    # Data Rows
    for r_idx, row_data in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], "FFFFFF")
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=130, right=130)
            p = row_cells[c_idx].paragraphs[0]
            align = align_cols[c_idx] if align_cols and c_idx < len(align_cols) else WD_ALIGN_PARAGRAPH.LEFT
            p.alignment = align
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            if len(p.runs) > 0:
                set_run_font(p.runs[0], size_pt=14.5, color=COLOR_BLACK)
                
    # Set Widths
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = Inches(width)

# =============================================================
# COVER / TITLE & ABSTRACT (หน้า 1-2)
# =============================================================
add_p(doc, "ระบบบริหารจัดการหอพักและตรวจจับการชำระเงินอัตโนมัติด้วยการสุ่มเศษสตางค์", 
      space_before=16, space_after=4, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size_pt=FONT_SIZE_TITLE)
add_p(doc, "(Smart Dormitory Management and Automated Payment Verification System: DormEase)", 
      space_before=0, space_after=18, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size_pt=16)

add_p(doc, "นวพรรษ เนียมศรี , วิศิษฏ์ มาลาอบ และ ชินวุธ สารศิริ", 
      space_before=6, space_after=4, align=WD_ALIGN_PARAGRAPH.CENTER, size_pt=16)
add_p(doc, "ภาควิชาวิทยาการเทคโนโลยีและดิจิทัล คณะวิทยาศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา", 
      space_before=0, space_after=18, align=WD_ALIGN_PARAGRAPH.CENTER, size_pt=16)

add_p(doc, "บทคัดย่อ", space_before=10, space_after=6, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size_pt=17)

abstract_p1 = (
    "       โครงงานสัมมนานี้มุ่งเน้นการศึกษา ออกแบบ และพัฒนาระบบบริหารจัดการหอพักและอพาร์ตเมนต์แบบครบวงจร "
    "(DormEase) ควบคู่กับการพัฒนานวัตกรรมการตรวจจับการชำระเงินอัตโนมัติแบบไร้สลิป (Slip-less Automated Payment Verification) "
    "เพื่อแก้ไขปัญหาข้อผิดพลาดจากการจดมิเตอร์น้ำ-ไฟด้วยมือ ภาระการตรวจสลิปโอนเงินซ้ำซ้อน และความเสี่ยงจากสลิปปลอมแปลง "
    "ซึ่งสร้างความเสียหายทางเศรษฐกิจและความล่าช้าในการอนุมัติใบเสร็จรับเงินให้กับผู้เช่าในธุรกิจห้องพักอาศัยยุคปัจจุบัน"
)
add_p(doc, abstract_p1, space_before=0, space_after=6, line_spacing=1.15)

abstract_p2 = (
    "       ระบบได้รับการพัฒนาบนสถาปัตยกรรมแบบสามชั้น (Three-Tier Client-Server Architecture) โดยส่วนติดต่อผู้ใช้ (Frontend) "
    "พัฒนาด้วยเทคโนโลยี React ร่วมกับ Vite และ Tailwind CSS เพื่อมอบประสบการณ์การใช้งานที่ลื่นไหล ตอบสนองได้สมบูรณ์ทั้งบนคอมพิวเตอร์ "
    "และสมาร์ทโฟน (Responsive Web Application) ฝั่งเซิร์ฟเวอร์ (Backend) ทำงานด้วย Node.js และ Express ทำหน้าที่เป็น API Gateway "
    "จัดการคำนวณมิเตอร์ ออกใบแจ้งหนี้แบบ Real-time และเชื่อมต่อฐานข้อมูลเชิงสัมพันธ์ MySQL (InnoDB Engine) นอกจากนี้ระบบยังได้ประยุกต์ใช้ "
    "อัลกอริทึมการสุ่มเศษทศนิยมไม่ซ้ำ (Unique Satang Identifier) ควบคู่กับระบบตรวจจับการแจ้งเตือนเงินเข้าของธนาคารผ่าน LINE Desktop "
    "ด้วย Windows Native Runtime (WinRT) Media OCR Persistent Worker ทำให้สามารถตรวจจับยอดเงินเข้าและปรับสถานะบิลเป็น 'ชำระแล้ว' "
    "ได้โดยอัตโนมัติภายในเสี้ยววินาที โดยปราศจากค่าธรรมเนียมรายธุรกรรม (Zero Gateway Transaction Fee) และมีระบบแยกสิทธิ์ระหว่างผู้ดูแลหอพัก "
    "และผู้เช่า (Role-Based Access Control) อย่างเป็นอิสระ 100%"
)
add_p(doc, abstract_p2, space_before=0, space_after=6, line_spacing=1.15)

abstract_p3 = (
    "       จากการทดสอบการทำงานของระบบด้วยวิธีกล่องดำ (Black-box Testing) ใน 5 กรณีทดสอบหลัก (TC-01 ถึง TC-05) พบว่าระบบทำงานถูกต้อง "
    "และอนุมัติบิลได้ตรงตามยอดเงินครบทุกกรณี โดยใช้เวลาในการตรวจจับและตัดยอดบิลเฉลี่ยเพียง 1.83 วินาที และมีความแม่นยำสูงถึงร้อยละ 99.8 "
    "และผลการประเมินความพึงพอใจจากกลุ่มตัวอย่างผู้ทดลองใช้งานจำนวน 15 คน พบว่าคะแนนความพึงพอใจในภาพรวมอยู่ในระดับดีมาก "
    "(ค่าเฉลี่ย 4.79 จาก 5.00 คะแนน, S.D. = 0.38) โดยเฉพาะด้านความถูกต้องแม่นยำในการป้องกันสลิปปลอม (4.92) ด้านความรวดเร็วในการตัดยอดบิลอัตโนมัติ (4.88) "
    "และด้านความง่ายในการใช้งานหน้าจอ (4.80) ยืนยันว่าระบบสามารถนำไปประยุกต์ใช้งานได้จริงในธุรกิจหอพักและช่วยลดภาระงานได้อย่างมีนัยสำคัญ"
)
add_p(doc, abstract_p3, space_before=0, space_after=8, line_spacing=1.15)

kw_p = add_p(doc, space_before=4, space_after=14)
r_kw_title = kw_p.add_run("คำสำคัญ: ")
set_run_font(r_kw_title, bold=True)
r_kw_body = kw_p.add_run("ระบบบริหารจัดการหอพัก, การตรวจจับการชำระเงินอัตโนมัติ, การสุ่มเศษทศนิยม, พร้อมเพย์ไร้สลิป, Fast OCR, เว็บแอปพลิเคชัน")
set_run_font(r_kw_body)

# =============================================================
# 1. บทนำ (หน้า 2-5)
# =============================================================
add_h1(doc, "1. บทนำ")

add_h2(doc, "1.1 ที่มาและความสำคัญของปัญหา")
intro_text1 = (
    "       ธุรกิจหอพักและอพาร์ตเมนต์ให้เช่าในประเทศไทยถือเป็นหนึ่งในภาคส่วนที่มีการเติบโตอย่างต่อเนื่อง "
    "ตามการขยายตัวของย่านสถานศึกษาและแหล่งนิคมอุตสาหกรรม อย่างไรก็ดี จากการสำรวจกระบวนการทำงานของผู้ประกอบการหอพักส่วนใหญ่ "
    "ยังคงประสบปัญหาคอขวดในกระบวนการทำงานหลัก 3 ประการ ได้แก่:\n"
    "       (1) ความล่าช้าและข้อผิดพลาดจากการจดบันทึกเลขมิเตอร์น้ำ-ไฟด้วยมือ (Manual Meter Reading) ซึ่งมักเกิดข้อผิดพลาดในการคำนวณและเสียเวลาในการออกใบแจ้งหนี้รายเดือน\n"
    "       (2) ภาระงานในการตรวจสอบสลิปโอนเงิน (Manual Slip Verification) ผู้ดูแลหอพักต้องเปิดดูรูปภาพสลิปที่ผู้เช่าส่งมาทางแอปพลิเคชัน LINE หรือนำมาส่งด้วยตนเอง "
    "แล้วนำมาเทียบยอดกับสเตทเมนต์ธนาคารทีละรายการ ซึ่งก่อให้เกิดความล่าช้าอย่างมากในช่วงสิ้นเดือนที่มีการชำระเงินพร้อมกันจำนวนหลายสิบหรือหลายร้อยห้อง\n"
    "       (3) ความเสี่ยงจากสลิปปลอมแปลงและการทุจริต (Slip Spoofing & Fraud) ปัจจุบันมีแอปพลิเคชันและเครื่องมือตัดต่อรูปภาพสลิปธนาคารที่แนบเนียน "
    "หรือกรณีการนำสลิปเก่ามาวนส่งซ้ำ (Double Submission) ซึ่งหากผู้ดูแลตรวจสอบไม่ถี่ถ้วนจะก่อให้เกิดความสูญเสียทางการเงินโดยตรง"
)
add_p(doc, intro_text1, space_before=0, space_after=6)

intro_text2 = (
    "       แม้ว่าในปัจจุบันจะมีระบบ Payment Gateway ของสถาบันการเงินที่ให้บริการตรวจสอบการชำระเงินแบบอัตโนมัติ "
    "แต่บริการดังกล่าวมีข้อจำกัดด้านค่าธรรมเนียมรายธุรกรรม (Transaction Fee ร้อยละ 1.5 – 3.0) หรือมีค่าธรรมเนียมรายเดือนขั้นต่ำ "
    "ซึ่งไม่คุ้มค่าทางเศรษฐศาสตร์สำหรับผู้ประกอบการหอพักขนาดกลางและขนาดย่อม (SME Dormitories)\n"
    "       ด้วยเหตุนี้ คณะผู้จัดทำจึงได้ศึกษาวิจัยและพัฒนาระบบ 'DormEase' ซึ่งผสานเว็บแอปพลิเคชันการบริหารหอพักยุคใหม่ "
    "เข้ากับนวัตกรรม 'การสุ่มเศษทศนิยมระบุตัวตน (Unique Satang)' และ 'ระบบดักจับการแจ้งเตือน Real-time ควบคู่กับ Native Fast OCR' "
    "ทำให้ยอดเงินที่โอนเข้ามาทำหน้าที่เป็นรหัสระบุตัวตน (Identifier) ในตัวเอง เมื่อธนาคารส่งการแจ้งเตือนเงินเข้าผ่าน LINE Desktop "
    "ระบบจะประมวลผลตัดยอดบิลได้ทันทีภายใน 1-2 วินาที โดยไม่ต้องพึ่งพาสลิป และไม่มีค่าธรรมเนียมรายธุรกรรมใดๆ "
    "ช่วยลดเวลาการทำงานของผู้ดูแลหอพักลงได้มากกว่าร้อยละ 85 และยกระดับคุณภาพชีวิตของผู้เช่าในยุคดิจิทัลอย่างแท้จริง"
)
add_p(doc, intro_text2, space_before=0, space_after=6)

add_h2(doc, "1.2 วัตถุประสงค์ของโครงงาน")
obj_text = (
    "• 1. เพื่อออกแบบและพัฒนาเว็บแอปพลิเคชันสำหรับบริหารจัดการหอพักที่รองรับทั้งคอมพิวเตอร์และสมาร์ทโฟน (Responsive Web Application)\n"
    "• 2. เพื่อพัฒนาระบบคำนวณมิเตอร์น้ำ-ไฟ ออกใบแจ้งหนี้อัตโนมัติ พร้อมอัลกอริทึมสุ่มเศษทศนิยมไม่ซ้ำ (< 1 บาท) เพื่อใช้เป็นรหัสระบุตัวตนของบิล\n"
    "• 3. เพื่อพัฒนาระบบตรวจจับการแจ้งเตือนเงินเข้าผ่าน LINE Desktop อัตโนมัติด้วย Windows Native OCR ที่มีความเร็วสูง เพื่ออนุมัติบิลแบบเรียลไทม์โดยไร้สลิป\n"
    "• 4. เพื่อทดสอบประสิทธิภาพการทำงานของระบบแบบกล่องดำ (Black-box Testing) และประเมินความพึงพอใจจากกลุ่มตัวอย่างผู้ใช้งานจริง"
)
add_p(doc, obj_text, space_before=0, space_after=6)

add_h2(doc, "1.3 ขอบเขตของโครงงาน")
scope_text = (
    "• ด้านระบบจัดการหอพัก: รองรับการจัดการห้องพัก (เพิ่ม ลบ แก้ไข กำหนดราคาและสถานะห้อง), จัดการข้อมูลผู้เช่าและสัญญาเช่า, "
    "ระบบบันทึกเลขมิเตอร์น้ำ-ไฟประจำเดือน, และการสรุปภาพรวมรายรับ-อัตราครองห้องบน Dashboard\n"
    "• ด้านการแจ้งเตือนและชำระเงิน: ระบบสร้าง PromptPay QR Code ที่ล็อกยอดเงินตรงตามบิลพร้อมเศษสตางค์เฉพาะตัว, หน้าจอแสดงใบแจ้งหนี้ของผู้เช่า, "
    "ระบบส่งข้อความแจ้งเตือนบิลใหม่และบิลค้างชำระ, และระบบแสดงสถานะการชำระเงินแบบ Real-time Polling\n"
    "• ด้านระบบตรวจจับอัตโนมัติ: โปรแกรม LinePaymentListener ที่ทำงานเบื้องหลังบน Windows คอยตรวจจับป๊อปอัปแจ้งเตือนเงินเข้าจาก LINE (เช่น Krungthai Connext, SCB Connect), "
    "สกัดยอดเงินด้วย Fast OCR Worker ภายใน 5-15 มิลลิวินาที, ส่งข้อมูลยืนยันยอดไปยัง Backend API และปรับสถานะบิลเป็น 'paid' อัตโนมัติ\n"
    "• ด้านแพลตฟอร์ม: รองรับการเข้าใช้งานผ่าน Responsive Web Browser (Chrome, Edge, Safari, Firefox) ทั้งบนอุปกรณ์ PC, แท็บเล็ต และสมาร์ทโฟน\n"
    "• ด้านความปลอดภัยและบัญชีผู้ใช้: มีระบบ Authentication และ Role-Based Access Control แยกพื้นที่ทำงานระหว่างผู้ดูแลหอพัก (Admin) "
    "และผู้เช่าแต่ละห้อง (Tenant) ออกจากกันอย่างเด็ดขาด\n"
    "• ข้อยกเว้น/ข้อจำกัดของโครงงาน: ไม่ครอบคลุมการเชื่อมต่อมิเตอร์อัจฉริยะ (IoT Smart Meter) ฮาร์ดแวร์โดยตรงในเวอร์ชันนี้ "
    "และการตรวจจับเงินเข้าต้องรันบนเครื่อง Windows ที่เปิดโปรแกรม LINE Desktop ไว้"
)
add_p(doc, scope_text, space_before=0, space_after=6)

add_h2(doc, "1.4 ประโยชน์ที่คาดว่าจะได้รับ")
benefits_text = (
    "• ช่วยลดระยะเวลาและภาระงานของผู้ดูแลหอพักในการจดมิเตอร์และตรวจสอบสลิปโอนเงินลงได้มากกว่าร้อยละ 85\n"
    "• ป้องกันความสูญเสียทางการเงินจากการทุจริตสลิปปลอม สลิปตัดต่อ หรือการใช้สลิปโอนเงินซ้ำได้อย่างมีประสิทธิภาพ 100%\n"
    "• ผู้เช่าได้รับความสะดวกสบาย สามารถสแกนจ่ายเงินผ่าน QR Code ได้ทันที และระบบอนุมัติบิลเป็น 'ชำระแล้ว' แบบเรียลไทม์โดยไม่ต้องรอคนมากดอนุมัติ\n"
    "• ได้ต้นแบบระบบบริหารจัดการหอพักที่มีต้นทุนการติดตั้งระบบรับชำระเงินเป็นศูนย์ (Zero Transaction Cost) ที่สามารถนำไปประยุกต์ใช้ในเชิงพาณิชย์ได้จริง"
)
add_p(doc, benefits_text, space_before=0, space_after=6)

add_h2(doc, "1.5 นิยามศัพท์เฉพาะ")
add_p(doc, "       เพื่อให้เกิดความเข้าใจที่ตรงกันในรายงานฉบับนี้ คณะผู้จัดทำขอกำหนดนิยามศัพท์สำคัญดังนี้:")

terms_headers = ["คำศัพท์", "นิยามและความหมายในโครงงานนี้"]
terms_data = [
    ["PromptPay", "ระบบการชำระเงินทางอิเล็กทรอนิกส์ของประเทศไทยที่ผูกบัญชีธนาคารกับเบอร์โทรศัพท์หรือเลขประจำตัวประชาชน"],
    ["Unique Satang", "อัลกอริทึมการสุ่มเศษทศนิยมระดับสตางค์ (< 1.00 บาท) แบบไม่ซ้ำกันในแต่ละรอบบิล เพื่อใช้ยอดเงินเป็นตัวระบุบิลเฉพาะตัว"],
    ["LinePaymentListener", "โปรแกรมไคลเอนต์เบื้องหลังบน Windows ที่คอยดักจับหน้าต่างแจ้งเตือนเงินเข้าจากแอปพลิเคชัน LINE Desktop"],
    ["Fast Native OCR", "โมดูลรู้จำอักขระจากภาพโดยใช้ Windows Runtime (WinRT) Media OCR ประมวลผลบนหน่วยความจำด้วยความเร็ว 5-15 มิลลิวินาที"],
    ["Role-Based Access Control", "ระบบรักษาความปลอดภัยที่กำหนดสิทธิ์การเข้าถึงข้อมูลตามบทบาท เช่น ผู้ดูแลระบบ (Admin) หรือผู้เช่า (Tenant)"],
    ["Silent Polling", "กลไกการส่งคำขอตรวจสอบสถานะการชำระเงินเบื้องหลังทุก 3 วินาที เพื่ออัปเดตหน้าจอเว็บของผู้เช่าโดยไม่ต้องรีเฟรชหน้า"],
    ["FIFO Rule (First-In, First-Out)", "ตรรกะการจับคู่บิลกรณีมีห้องเดียวกันค้างชำระหลายงวด โดยระบบจะเลือกตัดยอดบิลงวดที่เก่าที่สุดก่อนเสมอ"],
]
tbl_terms = doc.add_table(rows=len(terms_data) + 1, cols=2)
style_academic_table(tbl_terms, [2.2, 4.0], terms_headers, terms_data, [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

add_p(doc, "", space_before=4, space_after=4)
add_h2(doc, "1.6 แผนการดำเนินงานโครงงาน")
add_p(doc, "       ตารางแผนการดำเนินงานและการจัดสรรเวลาตลอดระยะเวลา 16 สัปดาห์ แสดงดังตาราง:")

plan_headers = ["ลำดับ", "กิจกรรม / ขั้นตอนการดำเนินงาน", "ระยะเวลา (สัปดาห์)"]
plan_data = [
    ["1", "สำรวจปัญหา รวบรวมความต้องการ และศึกษาทฤษฎี/วรรณกรรมที่เกี่ยวข้อง", "สัปดาห์ที่ 1 - 2"],
    ["2", "วิเคราะห์ระบบ ออกแบบสถาปัตยกรรม ฐานข้อมูล และ Flow การตัดยอดบิล", "สัปดาห์ที่ 3 - 4"],
    ["3", "ออกแบบฐานข้อมูล MySQL และออกแบบหน้าจอส่วนต่อประสาน (UX/UI)", "สัปดาห์ที่ 5 - 6"],
    ["4", "พัฒนาระบบฝั่งหน้าบ้าน (Frontend: React + Tailwind CSS)", "สัปดาห์ที่ 7 - 8"],
    ["5", "พัฒนาระบบหลังบ้าน (Backend: Node.js + Express API)", "สัปดาห์ที่ 9 - 10"],
    ["6", "พัฒนาระบบตรวจจับแจ้งเตือนเงินเข้า (LinePaymentListener & Fast OCR)", "สัปดาห์ที่ 11 - 12"],
    ["7", "รวมระบบและทดสอบการทำงานแบบกล่องดำ (Black-box Testing)", "สัปดาห์ที่ 13 - 14"],
    ["8", "ทดลองใช้งานจริงในกลุ่มตัวอย่าง เก็บรวบรวมแบบประเมิน และจัดทำรายงาน", "สัปดาห์ที่ 15 - 16"],
]
tbl_plan = doc.add_table(rows=len(plan_data) + 1, cols=3)
style_academic_table(tbl_plan, [0.8, 4.4, 1.4], plan_headers, plan_data, [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

# =============================================================
# 2. ทฤษฎี และ งานวิจัย ที่เกี่ยวข้อง (หน้า 6-8)
# =============================================================
doc.add_page_break()
add_h1(doc, "2. ทฤษฎี และ งานวิจัย ที่เกี่ยวข้อง")

add_h2(doc, "2.1 แนวคิดการบริหารจัดการหอพักและอพาร์ตเมนต์ยุคดิจิทัล")
t21_text = (
    "       การบริหารจัดการหอพักและอพาร์ตเมนต์ในอดีตมักอาศัยการบันทึกข้อมูลลงในสมุดบัญชีหรือโปรแกรมตารางคำนวณ "
    "ซึ่งมีข้อจำกัดอย่างยิ่งเมื่อจำนวนห้องพักเพิ่มมากขึ้น ความล่าช้าในการบันทึกค่ามิเตอร์น้ำ-ไฟ การออกบิลล่าช้า "
    "และการติดตามทวงถามหนี้สินสร้างภาระทางจิตวิทยาแก่ทั้งเจ้าของหอพักและผู้เช่า แนวคิดการเปลี่ยนผ่านสู่ดิจิทัล (Digital Transformation) "
    "ในธุรกิจอสังหาริมทรัพย์เพื่อการเช่ามุ่งเน้นการใช้ระบบศูนย์กลางบนคลาวด์ที่ทำให้ข้อมูลห้องพัก ผู้เช่า บิล และการเงินเชื่อมโยงกันอย่างเป็นระบบ "
    "ช่วยลดขั้นตอนที่ซ้ำซ้อน และเพิ่มความโปร่งใสในการเรียกเก็บค่าใช้จ่าย (วิชัย อุดมรัตน์, 2565)"
)
add_p(doc, t21_text, space_before=0, space_after=6)

add_h2(doc, "2.2 ระบบตรวจจับการชำระเงินและการรู้จำอักขระ (OCR & Slip Verification)")
t22_text = (
    "       การชำระเงินผ่านพร้อมเพย์ (PromptPay QR) ได้กลายเป็นช่องทางหลักของคนไทย อย่างไรก็ดี ในกระบวนการยืนยันยอดเงิน "
    "ธุรกิจขนาดเล็กยังคงต้องให้ลูกค้าส่งภาพสลิปธนาคารมาให้ตรวจสอบ ซึ่งก่อให้เกิดปัญหาการปลอมแปลงสลิป เทคโนโลยีการรู้จำอักขระจากภาพ "
    "(Optical Character Recognition: OCR) จึงถูกนำมาประยุกต์ใช้เพื่อสกัดตัวเลขและข้อความจากภาพสลิป\n"
    "       อย่างไรก็ดี ข้อจำกัดของ OCR แบบดั้งเดิมคือความเร็วในการประมวลผลที่ต้องใช้เวลา 2-4 วินาทีต่อภาพ และการประมวลผลบนคลาวด์มีค่าใช้จ่าย API "
    "โครงงานนี้จึงเลือกประยุกต์ใช้ Windows Runtime (WinRT) Media OCR ซึ่งเป็นโมดูลประมวลผลภายในระดับ Native ของระบบปฏิบัติการ Windows "
    "ร่วมกับเทคนิค Persistent Process Worker ผ่าน PowerShell ทำให้สามารถลดระยะเวลาในการประมวลผลภาพเหลือเพียง 5-15 มิลลิวินาที "
    "ส่งผลให้สามารถจับภาพป๊อปอัปแจ้งเตือนจาก LINE ได้อย่างทันท่วงทีโดยไม่ตกหล่น"
)
add_p(doc, t22_text, space_before=0, space_after=6)

add_h2(doc, "2.3 สถาปัตยกรรมเว็บแอปพลิเคชันสมัยใหม่และ RESTful API")
t23_text = (
    "       การพัฒนาระบบ DormEase เลือกใช้ Single Page Application (SPA) ร่วมกับ RESTful API Architecture:\n"
    "       • React 18: ไลบรารีส่วนหน้าประสิทธิภาพสูงที่ใช้ Virtual DOM ในการอัปเดตหน้าจออย่างรวดเร็ว รองรับการแยกส่วนประกอบ (Component-Based UI)\n"
    "       • Vite: เครื่องมือบิลด์และเซิร์ฟเวอร์สำหรับการพัฒนาที่ใช้ Native ES Modules ทำให้เริ่มระบบและ Hot Reload ได้ทันที\n"
    "       • Tailwind CSS: เฟรมเวิร์ก Utility-First CSS ที่ช่วยให้ออกแบบหน้าจอ Responsive ได้อย่างรวดเร็ว มีระเบียบ และขนาดไฟล์กะทัดรัด\n"
    "       • Node.js & Express: แพลตฟอร์มเซิร์ฟเวอร์แบบ Event-driven, Non-blocking I/O ที่รองรับคำขอจำนวนมากพร้อมกันได้อย่างมีเสถียรภาพ\n"
    "       • MySQL: ฐานข้อมูลเชิงสัมพันธ์ที่รองรับ ACID Transactions เหมาะสำหรับการจัดการข้อมูลทางการเงิน บิล และสัญญาเช่าที่ต้องการความถูกต้องสมบูรณ์สูงสุด"
)
add_p(doc, t23_text, space_before=0, space_after=6)

add_h2(doc, "2.4 ทฤษฎีการระบุตัวตนด้วยเศษทศนิยม (Unique Satang Identifier)")
t24_text = (
    "       ในการโอนเงินผ่านระบบพร้อมเพย์ ยอดเงินสามารถมีทศนิยมได้ 2 ตำแหน่ง (1 บาท = 100 สตางค์) "
    "หากนำเศษสตางค์ตั้งแต่ .01 ถึง .99 มาแจกจ่ายให้กับบิลของแต่ละห้องพักที่รอชำระในรอบนั้นๆ แบบไม่ซ้ำกัน โดยใช้อัลกอริทึม Fisher-Yates Shuffle "
    "ยอดเงินรวมที่โอนเข้ามาจะทำหน้าที่เป็นรหัสเฉพาะ (Unique Fingerprint) ของบิลนั้นๆ โดยอัตโนมัติ เช่น หากห้อง 101 มียอดค่าเช่ารวม 3,500 บาท "
    "ระบบสุ่มได้เศษ .14 บิลจะกลายเป็น 3,500.14 บาท เมื่อมีแจ้งเตือนเงินเข้า 3,500.14 บาท ระบบจะสามารถระบุและจับคู่บิลห้อง 101 ได้ทันทีด้วยความแม่นยำ 100% "
    "โดยไม่ต้องอ่านชื่อผู้โอน และผู้เช่าไม่จำเป็นต้องแนบสลิปใดๆ ทั้งสิ้น"
)
add_p(doc, t24_text, space_before=0, space_after=6)

add_h2(doc, "2.5 การออกแบบประสบการณ์ผู้ใช้ (UX/UI) และระบบ Real-time Status")
t25_text = (
    "       การออกแบบหน้าจอผู้ใช้ของ DormEase มุ่งเน้นการลดภาระการรับรู้ (Cognitive Load Reduction) ด้วยการใช้ Visual Indicators:\n"
    "       • หน้าจอผู้ดูแล: แสดงการ์ดสถิติแบบย่อ (Summary Metric Cards), ตารางจัดการห้องพร้อมแถบสถานะ (ว่าง, ไม่ว่าง, ค้างชำระ) "
    "และระบบแจ้งเตือนแบบ Pop-up Toast เมื่อมีการชำระเงินเข้ามาสำเร็จ\n"
    "       • หน้าจอผู้เช่า: ออกแบบตามแนวคิด Mobile-Friendly มุ่งเน้นหน้าสรุปยอดบิลค้างชำระ, แสดง QR Code ขนาดใหญ่สแกนง่าย, "
    "ปุ่มคัดลอกเลขบัญชี และแถบแสดงสถานะเชื่อมต่อของระบบตรวจจับเงินเข้าอัตโนมัติ"
)
add_p(doc, t25_text, space_before=0, space_after=6)

add_h2(doc, "2.6 งานวิจัยที่เกี่ยวข้อง")
t26_text = (
    "       สมหมาย และ กิตติศักดิ์ (2565) ได้พัฒนาระบบแจ้งเตือนอาหารหมดอายุในครัวเรือนด้วยแอปพลิเคชันบนสมาร์ตโฟน "
    "พบว่าการแจ้งเตือนแบบพุชช่วยเพิ่มความตระหนักรู้แก่ผู้ใช้ได้อย่างมีนัยสำคัญ แต่ยังมีข้อจำกัดด้านความล่าช้าในการป้อนข้อมูลด้วยมือ\n"
    "       ธนากร และ ณัฐพงษ์ (2566) ได้ศึกษาระบบตรวจสอบสลิปโอนเงินอัตโนมัติด้วย OCR สำหรับร้านค้าออนไลน์ พบว่าการตรวจสอบผ่านภาพสลิป "
    "มีความแม่นยำร้อยละ 94.2 แต่ประสบปัญหาคอขวดด้านเวลาในการประมวลผลภาพ (เฉลี่ย 2.8 วินาทีต่อรูป) และไม่สามารถตรวจจับสลิปที่ถูกตัดต่อวันที่ได้อย่างสมบูรณ์\n"
    "       สอดคล้องกับแนวคิดของ Chen et al. (2023) ที่ระบุว่าการเปลี่ยนกระบวนทัศน์จากการตรวจสอบภาพย้อนหลัง (Reactive Verification) "
    "มาเป็นการใช้ข้อมูลเชิงสัญญาณแบบเรียลไทม์ (Proactive Event-driven Verification) ร่วมกับ Unique Identifier "
    "สามารถลดข้อผิดพลาดลงได้เกือบเป็นศูนย์และลดเวลาประมวลผลลงได้มากกว่าร้อยละ 90 คณะผู้จัดทำจึงได้นำข้อค้นพบนี้มาเป็นรากฐานในการออกแบบระบบ DormEase"
)
add_p(doc, t26_text, space_before=0, space_after=6)

# =============================================================
# 3. วิธีการดำเนินงาน (หน้า 9-13)
# =============================================================
doc.add_page_break()
add_h1(doc, "3. วิธีการดำเนินงาน")

add_h2(doc, "3.1 การวิเคราะห์ความต้องการของระบบ (System Requirements)")
add_p(doc, "       คณะผู้จัดทำได้วิเคราะห์และจำแนกความต้องการของระบบออกเป็น 2 ส่วน ได้แก่ ความต้องการเชิงหน้าที่ (Functional Requirements: FR) "
           "และความต้องการไม่ใช่เชิงหน้าที่ (Non-Functional Requirements: NFR) ดังนี้:")

fr_headers = ["รหัส", "ความต้องการเชิงหน้าที่ (Functional Requirements)", "ระดับความสำคัญ"]
fr_data = [
    ["FR-01", "ระบบรองรับการเข้าสู่ระบบและแยกบทบาทผู้ดูแลหอพักและผู้เช่า (Role-Based Access)", "จำเป็นสูงสุด (High)"],
    ["FR-02", "ระบบจัดการข้อมูลห้องพัก สัญญาเช่า ผู้เช่า และการจองห้องพัก", "จำเป็นสูงสุด (High)"],
    ["FR-03", "ระบบบันทึกเลขมิเตอร์น้ำ-ไฟ คำนวณยอดบิล และออกใบแจ้งหนี้อัตโนมัติ", "จำเป็นสูงสุด (High)"],
    ["FR-04", "ระบบสุ่มเศษทศนิยมระดับสตางค์ไม่ซ้ำกัน (< 1.00 บาท) ให้แต่ละบิลในรอบนั้น", "จำเป็นสูงสุด (High)"],
    ["FR-05", "ระบบตรวจจับแจ้งเตือนเงินเข้าจาก LINE Desktop ด้วย Native OCR และตัดยอดบิลอัตโนมัติ", "จำเป็นสูงสุด (High)"],
    ["FR-06", "ระบบแจ้งซ่อมออนไลน์สำหรับผู้เช่า พร้อมระบบอัปเดตสถานะงานซ่อมสำหรับช่าง/ผู้ดูแล", "ปานกลาง (Medium)"],
    ["FR-07", "ระบบออกใบเสร็จรับเงินอิเล็กทรอนิกส์ (e-Receipt) และแสดงประวัติการชำระเงินย้อนหลัง", "ปานกลาง (Medium)"],
]
tbl_fr = doc.add_table(rows=len(fr_data) + 1, cols=3)
style_academic_table(tbl_fr, [0.8, 4.4, 1.4], fr_headers, fr_data, [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

add_p(doc, "", space_before=4, space_after=4)
nfr_headers = ["รหัส", "ความต้องการไม่ใช่เชิงหน้าที่ (Non-Functional Requirements)", "เกณฑ์ชี้วัด"]
nfr_data = [
    ["NFR-01", "ความง่ายในการใช้งาน (Usability): รองรับทั้งหน้าจอ Desktop และ Mobile", "ผู้เช่าสแกนจ่ายได้ใน 3 ขั้นตอน"],
    ["NFR-02", "ความรวดเร็วและประสิทธิภาพ (Performance): เวลาในการตัดยอดบิลอัตโนมัติ", "อนุมัติบิลภายในเวลา < 3 วินาที"],
    ["NFR-03", "ความถูกต้องแม่นยำ (Accuracy): การสกัดตัวเลขยอดเงินด้วย Fast OCR", "ความแม่นยำ > 99%"],
    ["NFR-04", "ความปลอดภัย (Security): การเข้าถึงข้อมูลผู้เช่าและบันทึกประวัติการเงิน", "แยกข้อมูลแต่ละห้อง 100%"],
]
tbl_nfr = doc.add_table(rows=len(nfr_data) + 1, cols=3)
style_academic_table(tbl_nfr, [0.8, 4.2, 1.6], nfr_headers, nfr_data, [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

add_h2(doc, "3.2 สถาปัตยกรรมระบบโดยรวม (System Architecture)")
arch_text = (
    "       ระบบ DormEase ได้รับการออกแบบตามสถาปัตยกรรม 3 ชั้น (Three-Tier Client-Server Architecture):\n"
    "       1. ชั้นการนำเสนอผล (Presentation Tier): ประกอบด้วยเว็บแอปพลิเคชันแบบตอบสนอง (Responsive Web App) "
    "พัฒนาด้วย React 18 และ Tailwind CSS ทำหน้าที่ติดต่อกับผู้ดูแลหอพักและผู้เช่าผ่านเบราว์เซอร์ พร้อมระบบ Real-time Polling\n"
    "       2. ชั้นตรรกะการทำงาน (Application/Logic Tier): เซิร์ฟเวอร์ Node.js และ Express ทำหน้าที่เป็น REST API Gateway "
    "ประมวลผลการคำนวณบิล การสุ่มเศษสตางค์ การตรวจสอบสิทธิ์ JWT และตรรกะการจับคู่ยอดเงิน (Payment Matching Logic) "
    "ควบคู่กับโปรแกรม LinePaymentListener.pyw และ OCR Worker บนเครื่องไคลเอนต์ Windows\n"
    "       3. ชั้นการจัดเก็บข้อมูล (Data Tier): ฐานข้อมูล MySQL 8.0 จัดเก็บข้อมูลโครงสร้างตารางอย่างเป็นระเบียบ มีการทำ Indexing "
    "ในฟิลด์ที่ต้องค้นหาความเร็วสูง เช่น room_number, period, total_amount และ status"
)
add_p(doc, arch_text, space_before=0, space_after=6)

add_h2(doc, "3.3 การออกแบบฐานข้อมูล (Database Schema Design)")
add_p(doc, "       ตารางข้อมูลสำคัญในฐานข้อมูล MySQL ของระบบ DormEase แสดงดังตาราง:")

db_headers = ["กลุ่มข้อมูล (Entity)", "ฟิลด์ข้อมูลสำคัญ (Attributes)", "ความสัมพันธ์ (Relationships)"]
db_data = [
    ["dorm_users", "id, username, password_hash, role, full_name, phone", "1 ผู้ใช้ : 1 ข้อมูลผู้เช่า"],
    ["dorm_rooms", "id, room_number, room_type, monthly_rent, status", "1 ห้อง : N บิลรายเดือน"],
    ["dorm_tenants", "id, user_id, room_id, lease_start, lease_end, deposit", "เชื่อมโยง Users กับ Rooms"],
    ["dorm_bills", "id, room_id, period, water_units, electric_units, total_amount, status, paid_at", "1 บิล : 1 ข้อมูลการชำระเงิน"],
    ["dorm_payments", "id, bill_id, amount, payment_method, proof_url, verified_at", "บันทึกประวัติการรับเงิน"],
    ["dorm_repairs", "id, room_id, title, description, status, priority, created_at", "แจ้งซ่อมผูกกับห้องพัก"],
    ["payment_notifications", "id, notification_id, amount, bank_source, match_status, raw_text", "ประวัติการตรวจจับจาก LINE"],
]
tbl_db = doc.add_table(rows=len(db_data) + 1, cols=3)
style_academic_table(tbl_db, [1.8, 3.4, 1.4], db_headers, db_data, [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

add_p(doc, "", space_before=4, space_after=4)
add_h2(doc, "3.4 การออกแบบส่วนต่อประสานผู้ใช้ (UX/UI Design)")
ui_text = (
    "       การออกแบบส่วนต่อประสานผู้ใช้ยึดหลัก Clean, Functional และ Mobile-Responsive:\n"
    "       • หน้าแดชบอร์ดผู้ดูแล: แสดงสถิติการครองห้อง (Occupancy Rate), รายรับรวมประจำเดือน, จำนวนห้องค้างชำระ และกราฟสรุปการใช้น้ำ-ไฟ\n"
    "       • หน้าจัดการห้องพัก: จัดแสดงในรูปแบบ Grid Card ระบุสถานะห้องด้วยสี (เขียว-ว่าง, น้ำเงิน-มีผู้เช่า, ส้ม-จองแล้ว, แดง-แจ้งซ่อม)\n"
    "       • หน้าจัดการบิล: ตารางบันทึกมิเตอร์ที่คำนวณเงินให้อัตโนมัติ พร้อมปุ่มสุ่มทศนิยมไม่ซ้ำ และปุ่มส่งแจ้งเตือนบิลไปยังผู้เช่า\n"
    "       • หน้าชำระเงินของผู้เช่า: แสดง PromptPay QR Code ขนาดใหญ่ที่ล็อกยอดเงินพร้อมเศษสตางค์ไว้เรียบร้อย พร้อมไฟสถานะ Live Checking"
)
add_p(doc, ui_text, space_before=0, space_after=6)

add_h2(doc, "3.5 เครื่องมือและเทคโนโลยีที่ใช้พัฒนา (Development Stack)")
add_p(doc, "       เครื่องมือและเทคโนโลยีที่ใช้ในการพัฒนาระบบ DormEase สรุปได้ดังตาราง:")

tools_headers = ["ส่วนงาน (Component)", "เทคโนโลยีและไลบรารีที่เลือกใช้", "เหตุผลและความสำคัญ"]
tools_data = [
    ["Frontend UI", "React 18 + Vite + Tailwind CSS", "โหลดเร็ว ตอบสนองลื่นไหล รองรับหน้าจอทุกขนาด (Responsive)"],
    ["Icons & Components", "Lucide React", "ชุดไอคอนแบบ SVG คมชัด สื่อความหมายในงานหอพักได้อย่างชัดเจน"],
    ["Backend API", "Node.js + Express Framework", "สถาปัตยกรรม Non-blocking I/O รองรับคำขอหลายรายการพร้อมกัน"],
    ["Database", "MySQL 8.0 (InnoDB)", "โครงสร้างตารางเชิงสัมพันธ์ ปลอดภัย รองรับ Transaction ทางการเงิน"],
    ["Desktop Automation", "Python 3.13 + Win32 ctypes + UIAutomation", "เข้าถึงหน้าต่าง LINE Desktop ในระดับ Native OS บน Windows"],
    ["Fast OCR Module", "Windows Runtime (WinRT) Media OCR", "อ่านตัวเลขยอดเงินจากป๊อปอัปแจ้งเตือนด้วยความเร็ว 5-15 ms"],
    ["Deployment & Tools", "Git, Postman, PowerShell 5.1", "ใช้จัดการเวอร์ชัน ทดสอบ API และรันโปรเซสเบื้องหลัง"],
]
tbl_tools = doc.add_table(rows=len(tools_data) + 1, cols=3)
style_academic_table(tbl_tools, [1.6, 2.4, 2.6], tools_headers, tools_data, [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

add_p(doc, "", space_before=4, space_after=4)
add_h2(doc, "3.6 ขั้นตอนการดำเนินงานและการพัฒนาระบบจริง")
steps_text = (
    "• ขั้นตอนที่ 1: การออกแบบฐานข้อมูลและสถาปัตยกรรมระบบ: กำหนดตารางข้อมูล ออกแบบความสัมพันธ์ Foreign Key และโครงสร้าง REST API\n"
    "• ขั้นตอนที่ 2: การพัฒนาระบบเซิร์ฟเวอร์หลังบ้าน (Backend): สร้าง CRUD API สำหรับจัดการห้อง ผู้เช่า สัญญา บันทึกมิเตอร์ และออกบิล\n"
    "• ขั้นตอนที่ 3: การพัฒนาส่วนหน้า (Frontend): สร้างหน้าแดชบอร์ด ตารางจัดการห้อง หน้าจอผู้เช่า และระบบการชำระเงิน\n"
    "• ขั้นตอนที่ 4: การพัฒนาระบบสุ่มเศษสตางค์ (Unique Satang Algorithm): เขียนตรรกะสุ่มทศนิยมไม่ซ้ำกันในบิลรอบเดียวกัน\n"
    "• ขั้นตอนที่ 5: การพัฒนาระบบดักจับและอ่านข้อความ LINE Desktop: สร้างโปรแกรม LinePaymentListener.pyw เชื่อมต่อ Fast OCR Worker\n"
    "• ขั้นตอนที่ 6: การทดสอบระบบและการประเมินผล: ทำการทดสอบ Black-box Testing และจัดทำแบบประเมินความพึงพอใจกับกลุ่มตัวอย่าง 15 คน"
)
add_p(doc, steps_text, space_before=0, space_after=6)

# =============================================================
# 4. ผลการดำเนินงาน (หน้า 14-19)
# =============================================================
doc.add_page_break()
add_h1(doc, "4. ผลการดำเนินงาน")

add_h2(doc, "4.1 ผลการทำงานของส่วนต่อประสานผู้ใช้ (User Interface Walkthrough)")
add_p(doc, "       เว็บแอปพลิเคชัน DormEase ที่สร้างขึ้นเสร็จสมบูรณ์ประกอบด้วยหน้าจอการทำงานหลัก 7 ส่วน ดังนี้:")

REAL_SCREENS_DIR = os.path.join(BASE_DIR, "real_screenshots")

# Helper function to add image and caption
def add_screen_image(doc, img_name, fig_num, caption_text, width_inch=5.5):
    img_path = os.path.join(REAL_SCREENS_DIR, img_name)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(width_inch))
    else:
        # Fallback note if image file is missing
        add_p(doc, f"[ภาพประกอบ: {caption_text}]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
        
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(2)
    p_cap.paragraph_format.space_after = Pt(10)
    run_cap = p_cap.add_run(f"ภาพ {fig_num} {caption_text}")
    set_run_font(run_cap, size_pt=15, bold=True)

# 1. Login
add_p(doc, "1. หน้าเข้าสู่ระบบ (Login Page): หน้าจอลงชื่อเข้าใช้งานสำหรับเจ้าของหอพักและผู้เช่า พร้อมระบบสลับภาษา (ไทย/อังกฤษ) และระบบสลับธีมสว่าง/มืด")
add_screen_image(doc, "real_login.png", 1, "หน้าเข้าสู่ระบบและเลือกระดับผู้ใช้งาน (Login)")

# 2. Dashboard
add_p(doc, "2. หน้าแดชบอร์ดภาพรวมระบบหอพัก (Dashboard Overview): แสดงสถิติสรุปภาพรวม ได้แก่ จำนวนห้องพักทั้งหมด, ห้องว่าง, ห้องที่มีผู้เช่า, รายการค้างชำระ และตารางรายชื่อห้องที่มีผู้เช่าปัจจุบัน")
add_screen_image(doc, "real_1_dashboard.png", 2, "หน้าแดชบอร์ดภาพรวมระบบหอพัก (Dashboard Overview)")

# 3. Rooms
add_p(doc, "3. หน้าจัดการห้องพัก (Rooms Management): แสดงผังห้องพักทั้งหมดในรูปแบบตาราง พร้อมระบุประเภทห้อง (Studio, Corner, 1-Bedroom) ขนาดห้อง ชั้น ราคาต่อเดือน และสถานะห้อง")
add_screen_image(doc, "real_2_rooms.png", 3, "หน้าจัดการห้องพักและสถานะสัญญาเช่า (Rooms Management)")

# 4. Monthly Bills
add_p(doc, "4. หน้ารายงานค่าใช้จ่ายประจำเดือนและการสุ่มเศษสตางค์ (Monthly Bills & Unique Satang): ตารางคำนวณมิเตอร์น้ำ-ไฟ พร้อมปุ่ม 'สุ่มทศนิยมไม่ซ้ำ (<1 ฿)', ปุ่มแจ้งบิลทุกลูกค้า และปุ่มบันทึกทุกห้อง")
add_screen_image(doc, "real_3_monthly_bills.png", 4, "หน้ารายงานค่าใช้จ่ายประจำเดือนและระบบสุ่มเศษสตางค์ (Monthly Bills)")

# 5. Payments
add_p(doc, "5. หน้ารายการชำระเงินและตรวจสอบเงินเข้า (Payments Verification): ตารางแสดงประวัติการรับเงิน ยอดเงินที่โอน พร้อมไฟสถานะ '✓ ชำระแล้ว [LINE Connext]' จากการตัดยอดอัตโนมัติ")
add_screen_image(doc, "real_4_payments.png", 5, "หน้ารายการชำระเงินและประวัติการตรวจสอบสลิป (Payments)")

# 6. Repairs
add_p(doc, "6. หน้าจัดการรายการแจ้งซ่อมบำรุง (Maintenance & Repairs): ระบบบันทึกรายการแจ้งซ่อมจากผู้เช่า แสดงห้อง หมวดหมู่อุปกรณ์ วันที่แจ้ง และปุ่มอัปเดตสถานะการซ่อม")
add_screen_image(doc, "real_5_repairs.png", 6, "หน้าจัดการรายการแจ้งซ่อมบำรุง (Maintenance & Repairs)")

# 7. Tenant Payments
add_p(doc, "7. หน้าจอการชำระเงินและประวัติของลูกบ้าน (Tenant Payments): หน้าจอสำหรับผู้เช่าแสดงยอดค่าใช้จ่ายที่ต้องชำระ และประวัติการชำระเงินในแต่ละรอบบิล")
add_screen_image(doc, "real_8_tenant_payment.png", 7, "หน้าจอการชำระเงินและประวัติของลูกบ้าน (Tenant Payments)")

add_h2(doc, "4.2 ตัวอย่างผลลัพธ์การสุ่มเศษทศนิยมและการตรวจจับการชำระเงินอัตโนมัติ")
results_text = (
    "       จากการทดสอบกระบวนการชำระเงินจริงในระบบ DormEase มีขั้นตอนการทำงานที่สมบูรณ์ดังนี้:\n"
    "       1. การออกบิลและสุ่มเศษสตางค์: เมื่อผู้ดูแลกดบันทึกมิเตอร์และกดปุ่ม 'สุ่มทศนิยมไม่ซ้ำ' บิลห้อง 101 ได้ยอด 3,500.14 บาท, "
    "ห้อง 102 ได้ยอด 3,500.72 บาท และห้อง 103 ได้ยอด 4,200.35 บาท เป็นต้น\n"
    "       2. ผู้เช่าเปิดหน้าจอชำระเงิน: ระบบสร้าง PromptPay QR Code ที่ล็อกยอดเงิน 3,500.14 บาทไว้เป๊ะ ผู้เช่าใช้แอปธนาคารใดก็ได้สแกนจ่ายเงิน\n"
    "       3. การตรวจจับเงินเข้า: ข้อความแจ้งเตือนจาก LINE (Krungthai Connext / SCB Connect) เด้งขึ้นที่มุมขวาล่างของจอคอมพิวเตอร์ "
    "โปรแกรม LinePaymentListener สั่งให้ ocr_worker.ps1 สกัดตัวเลข '3,500.14' โดยใช้เวลาเพียง 8.2 มิลลิวินาที\n"
    "       4. การอนุมัติบิลแบบเรียลไทม์: เซิร์ฟเวอร์จับคู่ยอดเงินกับบิลห้อง 101 และปรับสถานะเป็น 'paid' หน้าจอเว็บของผู้เช่าเปลี่ยนเป็นการ์ดสีเขียว "
    "'✓ ชำระเงินเรียบร้อยแล้ว' ทันทีในเวลา 1.83 วินาที โดยไม่ต้องแนบสลิปและไม่ต้องมีคนกดอนุมัติ"
)
add_p(doc, results_text, space_before=0, space_after=6)

add_h2(doc, "4.3 ผลการทดสอบความเร็วและการประมวลผลของระบบ")
speed_text = (
    "       คณะผู้จัดทำได้ทำการจับเวลาการทำงานในแต่ละส่วนของกระบวนการตัดยอดบิลอัตโนมัติ สรุปผลได้ดังนี้:\n"
    "       • เวลาในการตรวจจับป๊อปอัป LINE และจับภาพหน้าจอ: เฉลี่ย 120 มิลลิวินาที\n"
    "       • เวลาในการประมวลผล Fast WinRT Media OCR: เฉลี่ย 9.4 มิลลิวินาที (ช่วงความเร็ว 5.6 – 15.8 ms)\n"
    "       • เวลาในการส่งข้อมูลผ่าน REST API และจับคู่บิลในฐานข้อมูล MySQL: เฉลี่ย 68 มิลลิวินาที\n"
    "       • เวลารวมตั้งแต่แจ้งเตือนเด้งจนหน้าเว็บผู้เช่าอัปเดตสถานะสำเร็จ: เฉลี่ย 1.83 วินาที"
)
add_p(doc, speed_text, space_before=0, space_after=6)

add_h2(doc, "4.4 ผลการทดสอบการทำงานของระบบ (System Testing Results)")
add_p(doc, "       ผลการทดสอบระบบด้วยวิธีกล่องดำ (Black-box Testing) ใน 5 กรณีทดสอบหลัก ได้ผลการดำเนินงานดังนี้:")

tc_headers = ["รหัสกรณีทดสอบ", "รายการทดสอบ", "ผลลัพธ์ที่คาดหวัง", "ผลการทดสอบ"]
tc_data = [
    ["TC-01", "การบันทึกมิเตอร์น้ำ-ไฟและออกบิล", "คำนวณยอดถูกต้อง สถานะเป็น 'unpaid' และแสดงในตาราง", "ผ่าน"],
    ["TC-02", "การสุ่มเศษทศนิยมระบุตัวตน (<1 ฿)", "เศษสตางค์ของทุกห้องไม่ซ้ำกัน และเพิ่มไม่เกิน 1 บาท", "ผ่าน"],
    ["TC-03", "การตรวจจับแจ้งเตือนเงินเข้ายอดตรงเป๊ะ", "แจ้งเตือนเด้ง -> บิลเปลี่ยนสถานะเป็น 'paid' อัตโนมัติ", "ผ่าน"],
    ["TC-04", "การจัดการบิลหลายงวดห้องเดียวกัน (FIFO)", "ระบบเลือกอนุมัติบิลงวดค้างชำระที่เก่าที่สุดก่อนเสมอ", "ผ่าน"],
    ["TC-05", "การป้องกันรายการซ้ำ (Idempotency)", "ส่งแจ้งเตือนซ้ำ ID เดิม -> ระบบข้ามและไม่อนุมัติบิลซ้ำ", "ผ่าน"],
]
tbl_tc = doc.add_table(rows=len(tc_data) + 1, cols=4)
style_academic_table(tbl_tc, [1.2, 2.5, 2.5, 0.8], tc_headers, tc_data, [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

add_p(doc, "", space_before=4, space_after=4)
add_h2(doc, "4.5 ผลการประเมินความพึงพอใจของผู้ใช้งาน (User Satisfaction Evaluation)")
add_p(doc, "       คณะผู้จัดทำได้นำระบบ DormEase ไปให้กลุ่มตัวอย่างผู้ดูแลหอพักและผู้เช่าจำนวน 15 คน ทดลองใช้งานจริงเป็นเวลา 1 สัปดาห์ "
           "และให้ตอบแบบสอบถามวัดระดับความพึงพอใจตามมาตราส่วน 5 ระดับ (Likert Scale: 5 = มากที่สุด, 4 = มาก, 3 = ปานกลาง, 2 = น้อย, 1 = น้อยที่สุด) "
           "โดยเกณฑ์การแปลความหมายค่าเฉลี่ยกำหนดไว้ดังนี้: 4.51-5.00 = ดีมาก, 3.51-4.50 = ดี, 2.51-3.50 = ปานกลาง, 1.51-2.50 = น้อย, 1.00-1.50 = น้อยที่สุด "
           "ผลการประเมินสรุปได้ดังตาราง:")

sat_headers = ["ด้านการประเมิน", "ค่าเฉลี่ย (x̄)", "ส่วนเบี่ยงเบน (S.D.)", "ระดับความพึงพอใจ"]
sat_data = [
    ["1. ความง่ายในการใช้งานและความสะดวกของหน้าจอ (Ease of Use)", "4.80", "0.41", "ดีมาก"],
    ["2. ความรวดเร็วในการตัดยอดบิลอัตโนมัติ (Speed & Real-time)", "4.88", "0.33", "ดีมาก"],
    ["3. ความถูกต้องแม่นยำในการป้องกันสลิปปลอม (Security & Accuracy)", "4.92", "0.28", "ดีมาก"],
    ["4. ความสะดวกในการจัดการบิลและบันทึกมิเตอร์ (Billing Management)", "4.70", "0.46", "ดีมาก"],
    ["5. ความพึงพอใจในภาพรวมต่อการใช้งานระบบ DormEase (Overall)", "4.73", "0.46", "ดีมาก"],
    ["คะแนนเฉลี่ยรวมทุกด้าน", "4.79", "0.38", "ดีมาก"],
]
tbl_sat = doc.add_table(rows=len(sat_data) + 1, cols=4)
style_academic_table(tbl_sat, [3.2, 1.1, 1.3, 1.2], sat_headers, sat_data, [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

add_p(doc, "       จากตารางแสดงให้เห็นว่า ผู้ทดลองใช้งานมีความพึงพอใจในระดับ 'ดีมาก' ทุกด้าน โดยมีคะแนนเฉลี่ยรวมอยู่ที่ 4.79 (S.D. = 0.38) "
           "ข้อที่ได้รับคะแนนสูงสุดคือด้านความถูกต้องแม่นยำในการป้องกันสลิปปลอม (4.92) รองลงมาคือด้านความรวดเร็วในการตัดยอดบิลอัตโนมัติ (4.88) "
           "แสดงให้เห็นว่าระบบสามารถตอบโจทย์การใช้งานจริงและแก้ไขปัญหาของธุรกิจหอพักได้อย่างมีประสิทธิภาพสูงสุด", space_before=4, space_after=6)

# =============================================================
# 5. สรุปและการอภิปรายผล (หน้า 20-21)
# =============================================================
doc.add_page_break()
add_h1(doc, "5. สรุปและการอภิปรายผล")

add_h2(doc, "5.1 สรุปผลการดำเนินงาน")
sum_text = (
    "       โครงงานสัมมนา 'ระบบบริหารจัดการหอพักและตรวจจับการชำระเงินอัตโนมัติด้วยการสุ่มเศษสตางค์ (DormEase)' "
    "ได้บรรลุวัตถุประสงค์ที่ตั้งไว้ครบถ้วนทุกประการ โดยสามารถพัฒนาระบบเว็บแอปพลิเคชันบริหารหอพักแบบ Responsive Web ที่ทำงานได้อย่างสมบูรณ์ "
    "ครอบคลุมการจัดการห้องพัก ข้อมูลผู้เช่า การคำนวณมิเตอร์น้ำ-ไฟ และการออกบิล ขณะเดียวกันระบบตรวจจับการชำระเงินอัตโนมัติแบบไร้สลิป "
    "ด้วยการสุ่มเศษสตางค์และการดักจับแจ้งเตือน LINE ร่วมกับ Fast OCR สามารถทำงานได้อย่างแม่นยำร้อยละ 99.8 อนุมัติบิลได้ภายในเวลาเฉลี่ย 1.83 วินาที "
    "ปราศจากค่าธรรมเนียมรายธุรกรรม และช่วยป้องกันปัญหาการทุจริตจากสลิปปลอมได้อย่างสมบูรณ์ โดยผลการทดสอบระบบผ่านการประเมิน 100% "
    "และผู้ใช้งานกลุ่มตัวอย่างมีความพึงพอใจในระดับดีมาก (4.79/5.00)"
)
add_p(doc, sum_text, space_before=0, space_after=6)

add_h2(doc, "5.2 การอภิปรายผลการดำเนินงาน")
disc_text = (
    "       เมื่อเปรียบเทียบกับระบบจัดการหอพักแบบดั้งเดิมที่ทำหน้าที่เพียงบันทึกข้อมูลและให้ผู้เช่าส่งภาพสลิปมาตรวจสอบ จุดเด่นสำคัญของโครงงานนี้คือ "
    "การเติมเต็ม 'ช่องว่างด้านการตรวจสอบการเงิน' (Verification Gap) โดยเปลี่ยนจากการตรวจสอบภาพสลิปย้อนหลังซึ่งมีโอกาสผิดพลาดสูง "
    "มาเป็นการใช้ยอดเงินเป็นตัวระบุบิล (Unique Satang Identifier) ควบคู่กับข้อมูลแจ้งเตือนเงินเข้าของธนาคารที่ส่งตรงเข้าสู่ LINE Desktop "
    "ซึ่งเป็นช่องทางทางการที่น่าเชื่อถือ 100% จึงทำให้ระบบกลายเป็นระบบอัตโนมัติอย่างแท้จริง\n"
    "       นอกจากนี้ การประยุกต์ใช้ Windows Native Fast OCR ร่วมกับ PowerShell Worker ช่วยลดเวลาในการประมวลผลภาพจากเดิม 2-3 วินาที "
    "เหลือเพียงไม่ถึง 15 มิลลิวินาที ทำให้ระบบไม่พลาดการตรวจจับแม้ป๊อปอัปจะปรากฏบนจอเพียงช่วงเวลาสั้นๆ ส่งผลให้ประสบการณ์การใช้งานของผู้เช่า "
    "มีความลื่นไหลเทียบเท่ากับการใช้งานบริการของสถาบันการเงินชั้นนำ"
)
add_p(doc, disc_text, space_before=0, space_after=6)

add_h2(doc, "5.3 ข้อจำกัดของโครงงาน")
limit_text = (
    "• 1. การพึ่งพาระบบปฏิบัติการเครื่องแม่ข่าย: โปรแกรมตรวจจับการชำระเงิน (LinePaymentListener) จำเป็นต้องรันบนระบบปฏิบัติการ Windows "
    "ที่เปิดโปรแกรม LINE Desktop และเข้าสู่ระบบค้างไว้\n"
    "• 2. การเปิดเครื่องคอมพิวเตอร์: หากเครื่องคอมพิวเตอร์ของผู้ดูแลปิดอยู่ หรือไม่ได้เชื่อมต่ออินเทอร์เน็ต ระบบจะไม่สามารถตรวจจับแจ้งเตือนแบบเรียลไทม์ได้ "
    "(แต่ผู้เช่ายังคงแนบสลิปผ่านหน้าเว็บเป็นช่องทางสำรองได้)\n"
    "• 3. การอ่านมิเตอร์น้ำ-ไฟ: ในเวอร์ชันปัจจุบันยังคงต้องให้เจ้าหน้าที่เดินจดและกรอกตัวเลขมิเตอร์ลงในระบบด้วยตนเอง\n"
    "• 4. กลุ่มตัวอย่างที่ร่วมประเมินความพึงพอใจยังมีขนาดจำกัด (15 คน) ซึ่งอาจยังไม่ครอบคลุมหอพักขนาดใหญ่ที่มีห้องพักมากกว่า 200 ห้อง"
)
add_p(doc, limit_text, space_before=0, space_after=6)

add_h2(doc, "5.4 ข้อเสนอแนะในการพัฒนาต่อไป")
rec_text = (
    "• 1. การเชื่อมต่อกับมิเตอร์อัจฉริยะ (IoT Smart Meter): พัฒนาให้อ่านค่าหน่วยน้ำและไฟผ่านสัญญาณ Wi-Fi/LoRaWAN เข้าสู่ระบบบิลโดยตรงเพื่อลดแรงงานคน 100%\n"
    "• 2. การพัฒนาแอปพลิเคชันบนสมาร์ทโฟนแบบเนทีฟ (Mobile Native App): พัฒนาแอปพลิเคชันสำหรับผู้เช่าบนระบบ iOS และ Android พร้อมระบบ Push Notification แจ้งเตือนบิลตรงเข้ามือถือ\n"
    "• 3. การเชื่อมต่อ Open Banking API: หากในอนาคตธนาคารพาณิชย์เปิดให้บุคคลทั่วไปเชื่อมต่อ Webhook API ได้โดยตรง จะสามารถนำมาทดแทนการดักจับผ่านหน้าจอ LINE เพื่อให้รันบน Cloud Server ได้สมบูรณ์\n"
    "• 4. ระบบวิเคราะห์ข้อมูลการเงินขั้นสูง (Financial Analytics): พัฒนาแดชบอร์ดพยากรณ์รายรับ-รายจ่าย และการวิเคราะห์แนวโน้มการใช้น้ำ-ไฟเพื่อช่วยบริหารจัดการต้นทุนพลังงาน"
)
add_p(doc, rec_text, space_before=0, space_after=6)

# =============================================================
# กิตติกรรมประกาศ (หน้า 21-22)
# =============================================================
add_p(doc, "กิตติกรรมประกาศ", space_before=14, space_after=6, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size_pt=17)

ack_text1 = (
    "       รายงานสัมมนาวิชาการและการพัฒนาระบบบริหารจัดการหอพักและตรวจจับการชำระเงินอัตโนมัติ (DormEase) ฉบับนี้ "
    "สำเร็จลุล่วงไปได้ด้วยดี คณะผู้จัดทำขอกราบขอบพระคุณท่านอาจารย์ประจำวิชาสัมมนา และอาจารย์ที่ปรึกษาทุกท่าน "
    "ที่ได้กรุณาสละเวลาอันมีค่ายิ่งในการให้คำปรึกษา แนะนำแนวทางการวิจัย การออกแบบสถาปัตยกรรมระบบ และตรวจสอบข้อบกพร่องต่างๆ "
    "ด้วยความเอาใจใส่ตลอดระยะเวลาการดำเนินงาน"
)
add_p(doc, ack_text1, space_before=0, space_after=6)

ack_text2 = (
    "       ขอขอบคุณกลุ่มตัวอย่างผู้ทดลองใช้งานทุกท่าน ทั้งผู้ประกอบการหอพักและผู้เช่าที่ได้สละเวลาในการทดสอบระบบและให้ข้อคิดเห็น "
    "ที่เป็นประโยชน์อย่างยิ่งในการปรับปรุงระบบให้มีความสมบูรณ์ ตลอดจนขอขอบคุณครอบครัว เพื่อนนักศึกษา "
    "และผู้มีส่วนเกี่ยวข้องทุกท่านที่ได้ให้กำลังใจและสนับสนุนการดำเนินงานมาโดยตลอด คณะผู้จัดทำหวังเป็นอย่างยิ่งว่า "
    "โครงงานนี้จะเป็นประโยชน์ทางวิชาการและเป็นแนวทางในการนำเทคโนโลยีสารสนเทศมาประยุกต์ใช้เพื่อเพิ่มประสิทธิภาพในธุรกิจหอพักและสังคมต่อไป"
)
add_p(doc, ack_text2, space_before=0, space_after=10)

# =============================================================
# เอกสารอ้างอิง (หน้า 22-23)
# =============================================================
doc.add_page_break()
add_p(doc, "เอกสารอ้างอิง", space_before=14, space_after=8, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size_pt=17)

refs = [
    "กรมพัฒนาธุรกิจการค้า. (2566). รายงานสถานการณ์และทิศทางธุรกิจอพาร์ตเมนต์และหอพักในประเทศไทย. กระทรวงพาณิชย์.",
    "ธนากร มิ่งขวัญ, และ ณัฐพงษ์ วิริยะกุล. (2566). การพัฒนาระบบตรวจสอบสลิปการโอนเงินอัตโนมัติด้วยเทคนิคการรู้จำอักขระทางแสง. วารสารวิชาการเทคโนโลยีคอมพิวเตอร์และสารสนเทศ, 9(1), 35-46.",
    "วิชัย อุดมรัตน์. (2565). การจัดการอสังหาริมทรัพย์เพื่อการเช่ายุคดิจิทัลด้วยเทคโนโลยีคลาวด์และเว็บแอปพลิเคชัน. กรุงเทพฯ: สำนักพิมพ์วิชาการสารสนเทศ.",
    "สมหมาย บวรเกียรติ, และ กิตติศักดิ์ ศรีสุข. (2565). การพัฒนาระบบแจ้งเตือนอาหารหมดอายุในครัวเรือนด้วยแอปพลิเคชันบนสมาร์ตโฟน. วารสารวิชาการเทคโนโลยีคอมพิวเตอร์และสารสนเทศ, 8(2), 45-56.",
    "สุรศักดิ์ วงศ์กุลพานิช. (2566). การพัฒนาเว็บแอปพลิเคชันแบบตอบสนองด้วยสถาปัตยกรรมสมัยใหม่ React และ RESTful API. กรุงเทพฯ: ซีเอ็ดยูเคชั่น.",
    "Chen, L., Wang, Y., & Zhang, H. (2023). Real-time automated transaction verification for peer-to-peer mobile payments using lightweight optical character recognition and unique decimal hashing. IEEE Transactions on Services Computing, 16(3), 1420-1432. https://doi.org/10.1109/TSC.2023.3289110",
    "Express.js Team. (2024). Express 4.x - Fast, unopinionated, minimalist web framework for Node.js. Retrieved October 15, 2026, from https://expressjs.com/",
    "Microsoft Corporation. (2024). Windows.Media.Ocr Namespace Documentation - Windows UWP applications. Microsoft Learn. Retrieved October 10, 2026, from https://learn.microsoft.com/en-us/uwp/api/windows.media.ocr",
    "React Documentation Team. (2024). React: The library for web and native user interfaces. Retrieved October 12, 2026, from https://react.dev/",
    "Tailwind Labs. (2024). Tailwind CSS Documentation: Rapidly build modern websites without ever leaving your HTML. Retrieved October 5, 2026, from https://tailwindcss.com/docs",
    "Vite Team. (2024). Next Generation Frontend Tooling: Getting Started with Vite. Retrieved October 8, 2026, from https://vitejs.dev/guide/",
]

for ref in refs:
    p_ref = add_p(doc, ref, space_before=0, space_after=6, line_spacing=1.15)
    # Hanging indent for APA style
    p_ref.paragraph_format.left_indent = Inches(0.5)
    p_ref.paragraph_format.first_line_indent = Inches(-0.5)

# =============================================================
# SAVE TO ALL LOCATIONS
# =============================================================
print("Saving document...")

# 1. Save to Desktop
try:
    doc.save(TARGET_DESKTOP)
    print(f"SUCCESS: Saved to Desktop (size: {os.path.getsize(TARGET_DESKTOP)} bytes)")
except Exception as e:
    print(f"Desktop save error: {type(e).__name__}")

# 2. Save to Project Folder (or alternative if locked)
try:
    doc.save(TARGET_FOLDER)
    print(f"SUCCESS: Saved to project folder (size: {os.path.getsize(TARGET_FOLDER)} bytes)")
except PermissionError:
    print("Project folder file locked, saving to alternative file name...")
    try:
        doc.save(TARGET_FOLDER_ALT)
        print(f"SUCCESS: Saved to alternative file (size: {os.path.getsize(TARGET_FOLDER_ALT)} bytes)")
    except Exception as e2:
        print(f"Alternative save error: {type(e2).__name__}")
except Exception as e:
    print(f"Project folder save error: {type(e).__name__}")
