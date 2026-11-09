# -*- coding: utf-8 -*-
"""
DormEase Premium Animated Canva-Ready Presentation Generator (.pptx)
Generates 25 high-impact, professional slides following the exact academic outline.
Widescreen 16:9 (13.333" x 7.5"), modern futuristic SaaS dark/light palette,
real embedded UI screenshots, card glassmorphism layouts, and data visualizations.
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "real_screenshots")
DESKTOP_DIR = os.path.join(os.environ.get('USERPROFILE', r'C:\Users\LOQ'), 'Desktop')

OUTPUT_PPTX_DESKTOP = os.path.join(DESKTOP_DIR, "DormEase_Presentation_Canva.pptx")
OUTPUT_PPTX_LOCAL = os.path.join(BASE_DIR, "DormEase_Presentation_Canva.pptx")

# -------------------------------------------------------------
# Color Palette (Futuristic SaaS & Deep Digital)
# -------------------------------------------------------------
BG_DEEP_NAVY    = RGBColor(11, 16, 38)     # #0B1026
BG_MIDNIGHT     = RGBColor(17, 28, 68)     # #111C44
BG_LIGHT_SLIDE  = RGBColor(240, 244, 252)  # #F0F4FC
CARD_BG_DARK    = RGBColor(21, 31, 69)     # #151F45
CARD_BG_LIGHT   = RGBColor(255, 255, 255)  # #FFFFFF
CARD_BORDER_CYAN= RGBColor(0, 217, 255)    # #00D9FF
CARD_BORDER_BLUE= RGBColor(56, 123, 255)   # #387BFF
CARD_BORDER_DARK= RGBColor(34, 49, 102)    # #223166

COLOR_WHITE     = RGBColor(255, 255, 255)
COLOR_SOFT_GRAY = RGBColor(210, 220, 240)
COLOR_MUTED     = RGBColor(140, 160, 200)
COLOR_TEXT_DARK = RGBColor(15, 23, 42)
COLOR_TEXT_SUB  = RGBColor(71, 85, 105)

NEON_CYAN       = RGBColor(0, 217, 255)    # #00D9FF
ELECTRIC_BLUE   = RGBColor(56, 123, 255)   # #387BFF
PURPLE_GLOW     = RGBColor(134, 93, 255)   # #865DFF
EMERALD_GREEN   = RGBColor(16, 185, 129)   # #10B981
ROSE_RED        = RGBColor(244, 63, 94)    # #F43F5E
AMBER_GOLD      = RGBColor(245, 158, 11)   # #F59E0B

FONT_HEAD = "Prompt"
FONT_BODY = "TH Sarabun New"
FONT_ENG  = "Inter"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

# -------------------------------------------------------------
# Helper Functions for Shapes & Styling
# -------------------------------------------------------------
def set_slide_background(slide, color=BG_DEEP_NAVY):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_header(slide, tag_text, title_text, subtitle_text="", is_light=False):
    # Header Tag Pill
    tag_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(2.8), Inches(0.35))
    tag_box.fill.solid()
    tag_box.fill.fore_color.rgb = ELECTRIC_BLUE if not is_light else RGBColor(224, 235, 255)
    tag_box.line.color.rgb = NEON_CYAN if not is_light else ELECTRIC_BLUE
    tag_box.line.width = Pt(1)
    tf_tag = tag_box.text_frame
    tf_tag.word_wrap = True
    p_tag = tf_tag.paragraphs[0]
    p_tag.alignment = PP_ALIGN.CENTER
    r_tag = p_tag.add_run()
    r_tag.text = tag_text.upper()
    r_tag.font.name = FONT_ENG
    r_tag.font.size = Pt(11)
    r_tag.font.bold = True
    r_tag.font.color.rgb = COLOR_WHITE if not is_light else ELECTRIC_BLUE

    # Title
    t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.5), Inches(0.8))
    tf = t_box.text_frame
    tf.word_wrap = True
    tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = title_text
    r.font.name = FONT_HEAD
    r.font.size = Pt(28)
    r.font.bold = True
    r.font.color.rgb = COLOR_WHITE if not is_light else COLOR_TEXT_DARK

    if subtitle_text:
        p_sub = tf.add_paragraph()
        r_sub = p_sub.add_run()
        r_sub.text = subtitle_text
        r_sub.font.name = FONT_HEAD
        r_sub.font.size = Pt(14)
        r_sub.font.color.rgb = NEON_CYAN if not is_light else ELECTRIC_BLUE

def add_card(slide, left, top, width, height, bg_color=CARD_BG_DARK, border_color=CARD_BORDER_DARK, border_width=1):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(border_width)
    else:
        card.line.fill.background()
    return card

def add_browser_mockup(slide, img_path, left, top, width, height):
    # Outer frame
    frame = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    frame.fill.solid()
    frame.fill.fore_color.rgb = RGBColor(15, 23, 42)
    frame.line.color.rgb = CARD_BORDER_CYAN
    frame.line.width = Pt(1.5)

    # Browser top bar (height ~ 0.35 in)
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.35))
    bar.fill.solid()
    bar.fill.fore_color.rgb = RGBColor(30, 41, 59)
    bar.line.fill.background()

    # Window dots (Red, Yellow, Green)
    for i, dot_color in enumerate([ROSE_RED, AMBER_GOLD, EMERALD_GREEN]):
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, left + Inches(0.12 + i * 0.16), top + Inches(0.11), Inches(0.12), Inches(0.12))
        dot.fill.solid()
        dot.fill.fore_color.rgb = dot_color
        dot.line.fill.background()

    # Address bar mockup
    addr = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.8), top + Inches(0.06), width - Inches(1.6), Inches(0.22))
    addr.fill.solid()
    addr.fill.fore_color.rgb = RGBColor(15, 23, 42)
    addr.line.fill.background()
    p_addr = addr.text_frame.paragraphs[0]
    p_addr.alignment = PP_ALIGN.LEFT
    r_addr = p_addr.add_run()
    r_addr.text = "🔒 https://dormease.local/app"
    r_addr.font.name = FONT_ENG
    r_addr.font.size = Pt(9)
    r_addr.font.color.rgb = RGBColor(148, 163, 184)

    # Image inside mockup
    if os.path.exists(img_path):
        slide.shapes.add_picture(img_path, left + Inches(0.04), top + Inches(0.36), width - Inches(0.08), height - Inches(0.40))

# =============================================================
# SLIDE 01: Opening / Hero
# =============================================================
s1 = prs.slides.add_slide(blank_layout)
set_slide_background(s1, BG_DEEP_NAVY)

# Glow background accent
glow = s1.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.5), Inches(1.5), Inches(6.5), Inches(4.5))
glow.fill.solid()
glow.fill.fore_color.rgb = RGBColor(20, 35, 90)
glow.line.fill.background()

# Hero Badge
badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.8), Inches(1.1), Inches(5.7), Inches(0.45))
badge.fill.solid()
badge.fill.fore_color.rgb = CARD_BG_DARK
badge.line.color.rgb = NEON_CYAN
badge.line.width = Pt(1.5)
p_b = badge.text_frame.paragraphs[0]
p_b.alignment = PP_ALIGN.CENTER
r_b = p_b.add_run()
r_b.text = "✨ SENIOR ACADEMIC PROJECT DEFENSE • KU SRIRACHA"
r_b.font.name = FONT_ENG
r_b.font.size = Pt(13)
r_b.font.bold = True
r_b.font.color.rgb = NEON_CYAN

# Main Title Thai
t1_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(1.6))
tf1 = t1_box.text_frame
tf1.word_wrap = True
p1 = tf1.paragraphs[0]
p1.alignment = PP_ALIGN.CENTER
r1 = p1.add_run()
r1.text = "ระบบบริหารจัดการหอพักและตรวจจับการชำระเงินอัตโนมัติ\nด้วยการสุ่มเศษสตางค์"
r1.font.name = FONT_HEAD
r1.font.size = Pt(36)
r1.font.bold = True
r1.font.color.rgb = COLOR_WHITE

# English Title
p1_en = tf1.add_paragraph()
p1_en.alignment = PP_ALIGN.CENTER
r1_en = p1_en.add_run()
r1_en.text = "Smart Dormitory Management and Automated Payment Verification System: DormEase"
r1_en.font.name = FONT_ENG
r1_en.font.size = Pt(18)
r1_en.font.color.rgb = NEON_CYAN

# Authors Card
auth_card = add_card(s1, Inches(2.2), Inches(4.2), Inches(8.9), Inches(1.6), CARD_BG_DARK, CARD_BORDER_BLUE, 1.5)
tf_auth = auth_card.text_frame
tf_auth.word_wrap = True
p_a1 = tf_auth.paragraphs[0]
p_a1.alignment = PP_ALIGN.CENTER
r_a1 = p_a1.add_run()
r_a1.text = "คณะผู้จัดทำโครงงาน"
r_a1.font.name = FONT_HEAD
r_a1.font.size = Pt(15)
r_a1.font.bold = True
r_a1.font.color.rgb = AMBER_GOLD

p_a2 = tf_auth.add_paragraph()
p_a2.alignment = PP_ALIGN.CENTER
r_a2 = p_a2.add_run()
r_a2.text = "นวพรรษ เนียมศรี  •  วิศิษฏ์ มาลาอบ  •  ชินวุธ สารศิริ"
r_a2.font.name = FONT_HEAD
r_a2.font.size = Pt(20)
r_a2.font.bold = True
r_a2.font.color.rgb = COLOR_WHITE

p_a3 = tf_auth.add_paragraph()
p_a3.alignment = PP_ALIGN.CENTER
r_a3 = p_a3.add_run()
r_a3.text = "ภาควิชาวิทยาการเทคโนโลยีและดิจิทัล คณะวิทยาศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา"
r_a3.font.name = FONT_HEAD
r_a3.font.size = Pt(15)
r_a3.font.color.rgb = COLOR_SOFT_GRAY

# Bottom Feature Pills
pill_texts = ["🚀 Zero Gateway Fee", "⚡ 1.83s Real-time Verification", "🔒 100% Anti-Slip Spoofing", "📱 Modern Responsive SaaS"]
for idx, pt in enumerate(pill_texts):
    pl = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.6 + idx * 2.6), Inches(6.2), Inches(2.4), Inches(0.45))
    pl.fill.solid()
    pl.fill.fore_color.rgb = RGBColor(16, 26, 60)
    pl.line.color.rgb = CARD_BORDER_DARK
    pl.line.width = Pt(1)
    pp = pl.text_frame.paragraphs[0]
    pp.alignment = PP_ALIGN.CENTER
    rp = pp.add_run()
    rp.text = pt
    rp.font.name = FONT_HEAD
    rp.font.size = Pt(12)
    rp.font.bold = True
    rp.font.color.rgb = NEON_CYAN

# =============================================================
# SLIDE 02: Project Overview
# =============================================================
s2 = prs.slides.add_slide(blank_layout)
set_slide_background(s2, BG_DEEP_NAVY)
add_header(s2, "Executive Summary", "DormEase คืออะไร?", "ระบบจัดการหอพักครบวงจร ผสานนวัตกรรมตัดยอดบิลอัตโนมัติด้วยเศษสตางค์ระบุตัวตน")

# Left Column: Overview Description
card_intro = add_card(s2, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.8), CARD_BG_DARK, CARD_BORDER_BLUE, 1)
tf_ci = card_intro.text_frame
tf_ci.word_wrap = True
tf_ci.margin_left = tf_ci.margin_right = tf_ci.margin_top = Inches(0.4)

p_ci_t = tf_ci.paragraphs[0]
r_ci_t = p_ci_t.add_run()
r_ci_t.text = "นิยามและความเป็นมาของ DormEase"
r_ci_t.font.name = FONT_HEAD
r_ci_t.font.size = Pt(20)
r_ci_t.font.bold = True
r_ci_t.font.color.rgb = NEON_CYAN

p_ci_b = tf_ci.add_paragraph()
r_ci_b = p_ci_b.add_run()
r_ci_b.text = (
    "\n• เว็บแอปพลิเคชันบริหารจัดการหอพักยุคใหม่ พัฒนาบนสถาปัตยกรรม Three-Tier Architecture "
    "เพื่อตอบสนองการใช้งานของเจ้าของหอพักและผู้เช่าอย่างครบวงจร\n\n"
    "• จุดเปลี่ยนนวัตกรรม: เปลี่ยนกระบวนการตรวจสอบสลิปแบบเดิม (Manual & Reactive) "
    "สู่ระบบตรวจจับการแจ้งเตือนเงินเข้าของธนาคารแบบอัตโนมัติ (Proactive Event-Driven)\n\n"
    "• หัวใจหลัก: ใช้อัลกอริทึมสุ่มเศษสตางค์ไม่ซ้ำกัน (< 1 บาท) ทำให้ 'ยอดเงิน' กลายเป็นรหัสระบุบิลเฉพาะตัว "
    "จับคู่ผ่าน Windows Native OCR ได้ภายใน 1.83 วินาที โดยไม่ต้องพึ่งพาสลิปและไร้ค่าธรรมเนียม Gateway"
)
r_ci_b.font.name = FONT_HEAD
r_ci_b.font.size = Pt(15)
r_ci_b.font.color.rgb = COLOR_WHITE

# Right Column: 4 Core Pillars
pillars = [
    ("🏢 All-in-One Management", "จัดการห้องพัก สัญญา ผู้เช่า มิเตอร์น้ำ-ไฟ และใบแจ้งหนี้แบบเบ็ดเสร็จ", ELECTRIC_BLUE),
    ("🎲 Unique Satang Identifier", "สุ่มทศนิยมระดับสตางค์ไม่ซ้ำในรอบบิล ระบุตัวตนผู้โอนได้แม่นยำ 100%", PURPLE_GLOW),
    ("⚡ Zero-Cost Slip-less Verification", "ดักจับแจ้งเตือนเงินเข้าธนาคารผ่าน LINE Desktop ตัดยอดทันที ไร้ค่าธรรมเนียม", EMERALD_GREEN),
    ("🛡️ 100% Anti-Fraud Protection", "ป้องกันสลิปปลอม สลิปตัดต่อ และการส่งสลิปซ้ำอย่างเด็ดขาดด้วยระบบ Event-based", AMBER_GOLD),
]
for idx, (p_title, p_desc, col) in enumerate(pillars):
    c_p = add_card(s2, Inches(6.8), Inches(1.9 + idx * 1.25), Inches(5.7), Inches(1.1), CARD_BG_DARK, col, 1.2)
    tf_p = c_p.text_frame
    tf_p.word_wrap = True
    tf_p.margin_left = Inches(0.25)
    tf_p.margin_top = Inches(0.15)
    
    pp1 = tf_p.paragraphs[0]
    rp1 = pp1.add_run()
    rp1.text = p_title
    rp1.font.name = FONT_HEAD
    rp1.font.size = Pt(16)
    rp1.font.bold = True
    rp1.font.color.rgb = col
    
    pp2 = tf_p.add_paragraph()
    rp2 = pp2.add_run()
    rp2.text = p_desc
    rp2.font.name = FONT_HEAD
    rp2.font.size = Pt(13)
    rp2.font.color.rgb = COLOR_SOFT_GRAY

# =============================================================
# SLIDE 03: Problem Statement
# =============================================================
s3 = prs.slides.add_slide(blank_layout)
set_slide_background(s3, BG_DEEP_NAVY)
add_header(s3, "Problem Discovery", "ปัญหาการบริหารหอพักแบบเดิม (Pain Points)", "กระบวนการทำงานแบบ Manual ก่อให้เกิดความล่าช้า ข้อผิดพลาด และความเสียหายทางการเงิน")

problems = [
    ("1. การจดมิเตอร์น้ำ-ไฟด้วยมือ\n(Manual Meter Reading)",
     "• ผู้ดูแลต้องเดินจดตัวเลขมิเตอร์ทุกห้อง\n• เกิดข้อผิดพลาดจากการอ่านเลขและคำนวณเงิน\n• เสียเวลาในการคีย์ข้อมูลลงตารางคำนวณ\n• การออกบิลล่าช้า ผู้เช่าได้รับบิลไม่ตรงเวลา",
     ROSE_RED, "❌"),
    ("2. ภาระการตรวจสลิปโอนเงิน\n(Manual Slip Bottleneck)",
     "• สิ้นเดือนสลิปเข้าพร้อมกันหลายสิบ/ร้อยห้อง\n• ต้องเปิดดูรูปสลิปเทียบกับสเตทเมนต์ทีละใบ\n• ผู้เช่าต้องรอผู้ดูแลมากดอนุมัติหลายชั่วโมง\n• ส่งผลให้งานบริการและงานซ่อมบำรุงหยุดชะงัก",
     AMBER_GOLD, "⏳"),
    ("3. ความเสี่ยงสลิปปลอมและการทุจริต\n(Slip Spoofing & Fraud)",
     "• ปัจจุบันมีแอปแต่งภาพสร้างสลิปปลอมเนียนมาก\n• มีการนำสลิปงวดเก่ามาวนส่งซ้ำ (Replay Attack)\n• หอพักขาดระบบตรวจสอบอัตโนมัติระดับธนาคาร\n• สร้างความเสียหายทางการเงินโดยตรงแก่เจ้าของ",
     PURPLE_GLOW, "⚠️"),
]

for idx, (p_title, p_desc, col, icon) in enumerate(problems):
    card = add_card(s3, Inches(0.8 + idx * 4.0), Inches(1.9), Inches(3.7), Inches(4.8), CARD_BG_DARK, col, 1.5)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.3)
    
    p_ic = tf.paragraphs[0]
    p_ic.alignment = PP_ALIGN.CENTER
    r_ic = p_ic.add_run()
    r_ic.text = icon
    r_ic.font.size = Pt(36)
    
    p_t = tf.add_paragraph()
    p_t.alignment = PP_ALIGN.CENTER
    r_t = p_t.add_run()
    r_t.text = p_title
    r_t.font.name = FONT_HEAD
    r_t.font.size = Pt(17)
    r_t.font.bold = True
    r_t.font.color.rgb = col
    
    p_b = tf.add_paragraph()
    r_b = p_b.add_run()
    r_b.text = "\n" + p_desc
    r_b.font.name = FONT_HEAD
    r_b.font.size = Pt(14)
    r_b.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 04: Proposed Solution (Before vs After)
# =============================================================
s4 = prs.slides.add_slide(blank_layout)
set_slide_background(s4, BG_DEEP_NAVY)
add_header(s4, "Transformation", "DormEase แก้ปัญหาอย่างไร? (Before vs After)", "เปลี่ยนจากความล่าช้าในอดีตสู่ระบบอัตโนมัติเต็มรูปแบบ (Zero-Cost Automated Flow)")

# Before Card
c_before = add_card(s4, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.8), RGBColor(30, 20, 35), ROSE_RED, 1.5)
tf_bef = c_before.text_frame
tf_bef.word_wrap = True
tf_bef.margin_left = tf_bef.margin_right = tf_bef.margin_top = Inches(0.35)

p_bt = tf_bef.paragraphs[0]
r_bt = p_bt.add_run()
r_bt.text = "🔴 BEFORE: ระบบหอพักแบบดั้งเดิม"
r_bt.font.name = FONT_HEAD
r_bt.font.size = Pt(20)
r_bt.font.bold = True
r_bt.font.color.rgb = ROSE_RED

bef_points = (
    "\n• บันทึกมิเตอร์ด้วยกระดาษ คีย์ซ้ำซ้อน มีโอกาสผิดพลาดสูง\n\n"
    "• ผู้เช่าโอนเงินแล้วต้องแคปรูปสลิป ส่งผ่านแชท LINE ส่วนตัว\n\n"
    "• เจ้าของหอพักต้องเปิดดูรูปทีละใบแล้วเช็กยอดเงินในแอปธนาคาร\n\n"
    "• ใช้เวลาอนุมัติบิลนาน 2 - 24 ชั่วโมงต่อห้อง\n\n"
    "• เสี่ยงรับสลิปปลอมแปลงหรือสลิปตัดต่อวันที่โดยไม่รู้ตัว\n\n"
    "• หากติดตั้ง Payment Gateway ธนาคาร มีค่าธรรมเนียม 1.5 - 3%"
)
p_bb = tf_bef.add_paragraph()
r_bb = p_bb.add_run()
r_bb.text = bef_points
r_bb.font.name = FONT_HEAD
r_bb.font.size = Pt(14.5)
r_bb.font.color.rgb = COLOR_WHITE

# After Card
c_after = add_card(s4, Inches(6.8), Inches(1.9), Inches(5.7), Inches(4.8), RGBColor(16, 32, 45), NEON_CYAN, 1.5)
tf_aft = c_after.text_frame
tf_aft.word_wrap = True
tf_aft.margin_left = tf_aft.margin_right = tf_aft.margin_top = Inches(0.35)

p_at = tf_aft.paragraphs[0]
r_at = p_at.add_run()
r_at.text = "🟢 AFTER: ระบบ DormEase ยุคใหม่"
r_at.font.name = FONT_HEAD
r_at.font.size = Pt(20)
r_at.font.bold = True
r_at.font.color.rgb = NEON_CYAN

aft_points = (
    "\n• ระบบคำนวณค่าน้ำ-ค่าไฟให้อัตโนมัติ พร้อมสุ่มเศษสตางค์ไม่ซ้ำ\n\n"
    "• ผู้เช่าสแกน PromptPay QR Code ล็อกยอดตรงเป๊ะ ไม่ต้องแนบสลิป\n\n"
    "• เมื่อเงินเข้า ธนาคารแจ้งเตือนผ่าน LINE Desktop ทันที\n\n"
    "• Fast WinRT OCR อ่านยอดเงินเสร็จใน 9.4 ms ตัดยอดบิลอัตโนมัติ\n\n"
    "• อนุมัติสำเร็จเฉลี่ยใน 1.83 วินาที หน้าเว็บอัปเดตสถานะทันที\n\n"
    "• ต้นทุนค่าธรรมเนียมธุรกรรมเป็นศูนย์ (Zero Transaction Cost 100%)"
)
p_ab = tf_aft.add_paragraph()
r_ab = p_ab.add_run()
r_ab.text = aft_points
r_ab.font.name = FONT_HEAD
r_ab.font.size = Pt(14.5)
r_ab.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 05: Project Objectives
# =============================================================
s5 = prs.slides.add_slide(blank_layout)
set_slide_background(s5, BG_DEEP_NAVY)
add_header(s5, "Project Goals", "วัตถุประสงค์ของโครงงาน", "4 เป้าหมายหลักในการพัฒนาเพื่อแก้ปัญหาการบริหารจัดการหอพักอย่างยั่งยืน")

objs = [
    ("01", "ออกแบบและพัฒนาเว็บแอปพลิเคชันบริหารหอพัก (Responsive)",
     "สร้างระบบจัดการหอพักที่รองรับทั้ง Desktop และ Mobile ด้วย React 18, Vite, Tailwind CSS และ Node.js เพื่ออำนวยความสะดวกแก่ผู้ดูแลและผู้เช่า",
     ELECTRIC_BLUE),
    ("02", "พัฒนาระบบคำนวณมิเตอร์และสุ่มเศษสตางค์ไม่ซ้ำ (Unique Satang)",
     "สร้างอัลกอริทึม Fisher-Yates สุ่มเศษทศนิยมระดับสตางค์ (< 1 บาท) ให้แต่ละบิลไม่ซ้ำกัน เพื่อใช้ยอดเงินเป็นตัวระบุบิลเฉพาะตัว (Unique Fingerprint)",
     PURPLE_GLOW),
    ("03", "พัฒนาระบบตรวจจับเงินเข้าอัตโนมัติด้วย Fast Native OCR",
     "สร้างโปรแกรม LinePaymentListener.pyw ร่วมกับ Windows Media OCR อ่านยอดเงินแจ้งเตือนจาก LINE Desktop เพื่ออนุมัติบิลแบบเรียลไทม์ไร้สลิป",
     NEON_CYAN),
    ("04", "ทดสอบการทำงานแบบกล่องดำและประเมินความพึงพอใจ",
     "ดำเนินการทดสอบ Black-box Testing ใน 5 กรณีหลัก และเก็บข้อมูลแบบสอบถามความพึงพอใจ 5 ด้านจากกลุ่มตัวอย่างผู้ใช้งานจริง 15 คน",
     EMERALD_GREEN),
]

for idx, (num, title, desc, col) in enumerate(objs):
    card = add_card(s5, Inches(0.8), Inches(1.9 + idx * 1.25), Inches(11.7), Inches(1.1), CARD_BG_DARK, col, 1.2)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_top = Inches(0.15)
    
    p = tf.paragraphs[0]
    r_n = p.add_run()
    r_n.text = num + "  "
    r_n.font.name = FONT_ENG
    r_n.font.size = Pt(22)
    r_n.font.bold = True
    r_n.font.color.rgb = col
    
    r_t = p.add_run()
    r_t.text = title
    r_t.font.name = FONT_HEAD
    r_t.font.size = Pt(17)
    r_t.font.bold = True
    r_t.font.color.rgb = COLOR_WHITE
    
    p2 = tf.add_paragraph()
    r_d = p2.add_run()
    r_d.text = desc
    r_d.font.name = FONT_HEAD
    r_d.font.size = Pt(13.5)
    r_d.font.color.rgb = COLOR_SOFT_GRAY

# =============================================================
# SLIDE 06: Scope & Users (Role-Based Access)
# =============================================================
s6 = prs.slides.add_slide(blank_layout)
set_slide_background(s6, BG_DEEP_NAVY)
add_header(s6, "System Boundary", "ขอบเขตของระบบและกลุ่มผู้ใช้งาน (User Scope)", "การแบ่งแยกสิทธิ์และพื้นที่การทำงานอย่างเด็ดขาดด้วย Role-Based Access Control (RBAC)")

# Admin / Owner Card
c_admin = add_card(s6, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.8), CARD_BG_DARK, ELECTRIC_BLUE, 1.5)
tf_adm = c_admin.text_frame
tf_adm.word_wrap = True
tf_adm.margin_left = tf_adm.margin_right = tf_adm.margin_top = Inches(0.35)

p_at = tf_adm.paragraphs[0]
r_at = p_at.add_run()
r_at.text = "👑 ผู้ดูแล / เจ้าของหอพัก (Admin / Owner)"
r_at.font.name = FONT_HEAD
r_at.font.size = Pt(19)
r_at.font.bold = True
r_at.font.color.rgb = ELECTRIC_BLUE

admin_features = (
    "\n• Dashboard สรุปอัตราครองห้อง รายรับ และบิลค้างชำระ\n"
    "• ผังห้องพัก (Rooms): เพิ่ม แก้ไข กำหนดราคา และสถานะห้อง\n"
    "• ทะเบียนผู้เช่า (Tenants): จัดการสัญญาเช่า และข้อมูลลูกบ้าน\n"
    "• บิลรายเดือน (Monthly Bills): บันทึกมิเตอร์น้ำ-ไฟ คำนวณเงิน\n"
    "• ปุ่มสุ่มทศนิยมไม่ซ้ำ (<1 ฿) และปุ่มแจ้งบิลทุกลูกค้าด้วย 1-Click\n"
    "• การเงิน (Payments): ตรวจสอบรายการโอน และสลิปที่แนบ\n"
    "• ระบบจัดการงานแจ้งซ่อมบำรุง และบันทึกประวัติการย้ายออก"
)
p_ab = tf_adm.add_paragraph()
r_ab = p_ab.add_run()
r_ab.text = admin_features
r_ab.font.name = FONT_HEAD
r_ab.font.size = Pt(14)
r_ab.font.color.rgb = COLOR_WHITE

# Tenant Card
c_tenant = add_card(s6, Inches(6.8), Inches(1.9), Inches(5.7), Inches(4.8), CARD_BG_DARK, EMERALD_GREEN, 1.5)
tf_ten = c_tenant.text_frame
tf_ten.word_wrap = True
tf_ten.margin_left = tf_ten.margin_right = tf_ten.margin_top = Inches(0.35)

p_tt = tf_ten.paragraphs[0]
r_tt = p_tt.add_run()
r_tt.text = "🏠 ผู้เช่าห้องพัก / ลูกบ้าน (Tenant)"
r_tt.font.name = FONT_HEAD
r_tt.font.size = Pt(19)
r_tt.font.bold = True
r_tt.font.color.rgb = EMERALD_GREEN

tenant_features = (
    "\n• ห้องของฉัน (My Room): ดูรายละเอียดสัญญาและข้อมูลห้อง\n"
    "• ใบแจ้งหนี้ (My Bills): ตรวจสอบค่าเช่า ค่าน้ำ-ค่าไฟรายเดือน\n"
    "• หน้าชำระเงิน (Payments): สแกน PromptPay QR ล็อกยอดเป๊ะ\n"
    "• ระบบตรวจสถานะเงินเข้าแบบเรียลไทม์ (Silent Polling 3s)\n"
    "• ปุ่มสำรอง 'ฉันโอนเงินแล้ว' และช่องทางแนบสลิป P2P\n"
    "• แจ้งซ่อมออนไลน์ (Repairs): ส่งคำขอซ่อมพร้อมติดตามสถานะ\n"
    "• ขอย้ายออกล่วงหน้า และดาวน์โหลดใบเสร็จรับเงิน (e-Receipt)"
)
p_tb = tf_ten.add_paragraph()
r_tb = p_tb.add_run()
r_tb.text = tenant_features
r_tb.font.name = FONT_HEAD
r_tb.font.size = Pt(14)
r_tb.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 07: Key Features Grid
# =============================================================
s7 = prs.slides.add_slide(blank_layout)
set_slide_background(s7, BG_DEEP_NAVY)
add_header(s7, "Feature Matrix", "ภาพรวมฟังก์ชันหลักของระบบ (8 Core Features)", "ออกแบบครอบคลุมทุกวงจรชีวิตการดำเนินงานหอพัก (Full Dormitory Lifecycle)")

features_8 = [
    ("🔐 Authentication & RBAC", "ระบบล็อกอินแยกสิทธิ์ ปลอดภัยด้วย JWT Token และ Bcrypt Password Hash", ELECTRIC_BLUE),
    ("📊 Live Executive Dashboard", "สรุปสถานะห้องพัก อัตราครองห้อง รายรับ และแจ้งเตือนกิจกรรมแบบเรียลไทม์", NEON_CYAN),
    ("🏢 Room & Contract Matrix", "ตารางจัดการห้องพัก ประเภทห้อง ราคา สัญญาเช่า และประวัติการเข้าพัก", PURPLE_GLOW),
    ("⚡ Smart Meter & Billing", "บันทึกมิเตอร์น้ำ-ไฟ คำนวณบิลอัตโนมัติ และแจ้งเตือนลูกบ้านในคลิกเดียว", AMBER_GOLD),
    ("🎲 Unique Satang Generator", "สุ่มทศนิยมไม่ซ้ำ (<1 ฿) ด้วย Fisher-Yates ระบุตัวตนผู้โอนได้ 100%", EMERALD_GREEN),
    ("🤖 Fast OCR Auto-Verification", "ดักจับแจ้งเตือน LINE สกัดยอดใน 9.4 ms และอนุมัติบิลใน 1.83 วินาที ไร้สลิป", ELECTRIC_BLUE),
    ("🔧 Online Maintenance Hub", "ระบบแจ้งซ่อมออนไลน์ กำหนดระดับความเร่งด่วน และติดตามสถานะงานซ่อม", ROSE_RED),
    ("🧾 e-Receipt & Payment Log", "บันทึกประวัติการเงิน ออกใบเสร็จรับเงินอิเล็กทรอนิกส์ และรายงานสรุป", COLOR_WHITE),
]

for idx, (f_title, f_desc, col) in enumerate(features_8):
    row = idx // 4
    col_idx = idx % 4
    left = Inches(0.8 + col_idx * 2.95)
    top = Inches(1.9 + row * 2.45)
    
    card = add_card(s7, left, top, Inches(2.8), Inches(2.25), CARD_BG_DARK, col, 1.2)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.2)
    
    p1 = tf.paragraphs[0]
    r1 = p1.add_run()
    r1.text = f_title
    r1.font.name = FONT_HEAD
    r1.font.size = Pt(14)
    r1.font.bold = True
    r1.font.color.rgb = col
    
    p2 = tf.add_paragraph()
    r2 = p2.add_run()
    r2.text = "\n" + f_desc
    r2.font.name = FONT_HEAD
    r2.font.size = Pt(12.5)
    r2.font.color.rgb = COLOR_SOFT_GRAY

# =============================================================
# SLIDE 08: Technology Stack
# =============================================================
s8 = prs.slides.add_slide(blank_layout)
set_slide_background(s8, BG_DEEP_NAVY)
add_header(s8, "Tech Architecture", "เทคโนโลยีที่ใช้พัฒนา (Technology Stack)", "คัดสรรเครื่องมือประสิทธิภาพสูงระดับ Modern Industry Standard")

tech_categories = [
    ("🎨 Frontend Tier", [("React 18", "SPA Framework"), ("Vite 6", "Lightning Bundler"), ("Tailwind CSS", "Utility UI Styling"), ("Lucide Icons", "Crisp Vector Icons")], ELECTRIC_BLUE),
    ("⚙️ Backend Tier", [("Node.js 20", "Event-Driven Engine"), ("Express.js", "RESTful API Gateway"), ("JWT Bearer", "Stateless Security"), ("Bcrypt.js", "Password Hashing")], PURPLE_GLOW),
    ("🗄️ Database Tier", [("MySQL 8.0", "Relational Database"), ("InnoDB Engine", "ACID Compliance"), ("Connection Pool", "High Concurrency"), ("Optimized Index", "Sub-10ms Queries")], NEON_CYAN),
    ("⚡ Desktop Engine", [("Python 3.13", "Background Client"), ("Win32 ctypes", "Native Hook API"), ("WinRT Media OCR", "5-15ms Native OCR"), ("PowerShell Worker", "Persistent Process")], EMERALD_GREEN),
]

for idx, (cat_title, tech_list, col) in enumerate(tech_categories):
    card = add_card(s8, Inches(0.8 + idx * 2.95), Inches(1.9), Inches(2.8), Inches(4.8), CARD_BG_DARK, col, 1.5)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.25)
    
    p1 = tf.paragraphs[0]
    p1.alignment = PP_ALIGN.CENTER
    r1 = p1.add_run()
    r1.text = cat_title
    r1.font.name = FONT_HEAD
    r1.font.size = Pt(17)
    r1.font.bold = True
    r1.font.color.rgb = col
    
    for t_name, t_sub in tech_list:
        p_t = tf.add_paragraph()
        r_tn = p_t.add_run()
        r_tn.text = "\n" + t_name
        r_tn.font.name = FONT_ENG
        r_tn.font.size = Pt(15)
        r_tn.font.bold = True
        r_tn.font.color.rgb = COLOR_WHITE
        
        p_s = tf.add_paragraph()
        r_ts = p_s.add_run()
        r_ts.text = t_sub
        r_ts.font.name = FONT_HEAD
        r_ts.font.size = Pt(12)
        r_ts.font.color.rgb = COLOR_MUTED

# =============================================================
# SLIDE 09: System Architecture
# =============================================================
s9 = prs.slides.add_slide(blank_layout)
set_slide_background(s9, BG_DEEP_NAVY)
add_header(s9, "Engineering Design", "สถาปัตยกรรมระบบโดยรวม (Three-Tier Architecture)", "โครงสร้างการทำงานแบบแยกส่วนระหว่าง Client, Server, Database และ Windows Desktop Daemon")

tiers = [
    ("1. PRESENTATION TIER (ส่วนหน้า)",
     "• React 18 + Vite + Tailwind CSS\n• Responsive Web: เข้าใช้งานผ่าน Browser ทุกแพลตฟอร์ม\n• Owner Dashboard & Tenant Portal\n• ระบบ Silent Polling อัปเดตสถานะบิลทุก 3 วินาที",
     ELECTRIC_BLUE),
    ("2. APPLICATION & LOGIC TIER (เซิร์ฟเวอร์ & ตัวตรวจจับ)",
     "• Node.js & Express RESTful API Gateway (Port 3007)\n• ตรรกะคำนวณบิล และ Fisher-Yates Unique Satang Generator\n• LinePaymentListener.pyw (Windows Background Process)\n• Persistent PowerShell Worker + Windows Native Media OCR",
     NEON_CYAN),
    ("3. DATA TIER (ฐานข้อมูล)",
     "• MySQL 8.0 Database (InnoDB Storage Engine)\n• ตาราง: dorm_users, dorm_rooms, dorm_bills, dorm_payments\n• Transaction Safety & Indexing เพื่อการสืบค้นความเร็วสูง\n• บันทึก Log การตรวจจับการชำระเงินทุกรายการอย่างแม่นยำ",
     PURPLE_GLOW),
]

for idx, (t_title, t_desc, col) in enumerate(tiers):
    c = add_card(s9, Inches(0.8), Inches(1.9 + idx * 1.6), Inches(11.7), Inches(1.4), CARD_BG_DARK, col, 1.5)
    tf = c.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_top = Inches(0.18)
    
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = t_title
    r.font.name = FONT_HEAD
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = col
    
    p2 = tf.add_paragraph()
    r2 = p2.add_run()
    r2.text = t_desc
    r2.font.name = FONT_HEAD
    r2.font.size = Pt(13)
    r2.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 10: Database Design (Schema)
# =============================================================
s10 = prs.slides.add_slide(blank_layout)
set_slide_background(s10, BG_DEEP_NAVY)
add_header(s10, "Data Modeling", "การออกแบบฐานข้อมูล (Database Schema Design)", "โครงสร้างตารางเชิงสัมพันธ์ (Relational Database) รองรับความถูกต้องทางการเงิน 100%")

tables = [
    ("dorm_users", "id, email, password, role, full_name, phone", "1 User : 1 ข้อมูลผู้เช่า / เจ้าของหอ", ELECTRIC_BLUE),
    ("dorm_rooms", "id, room_number, room_type, price, status", "1 ห้อง : N บิลรายเดือน", NEON_CYAN),
    ("dorm_tenants", "id, user_id, room_id, lease_start, lease_end", "เชื่อมโยง User และ Room เข้าด้วยกัน", PURPLE_GLOW),
    ("dorm_bills", "id, room_id, period, total_amount, unique_satang, status", "บันทึกยอดเงินพร้อมเศษสตางค์ระบุตัวตน", AMBER_GOLD),
    ("dorm_payments", "id, bill_id, amount, payment_method, verified_at", "ประวัติการชำระเงินและเวลาที่ยืนยัน", EMERALD_GREEN),
    ("dorm_repairs", "id, room_id, title, status, priority, created_at", "ข้อมูลแจ้งซ่อมบำรุงผูกกับห้องพัก", ROSE_RED),
]

for idx, (tname, tfields, trel, col) in enumerate(tables):
    row = idx // 2
    c_idx = idx % 2
    c = add_card(s10, Inches(0.8 + c_idx * 5.95), Inches(1.9 + row * 1.6), Inches(5.75), Inches(1.4), CARD_BG_DARK, col, 1.2)
    tf = c.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.15)
    
    p1 = tf.paragraphs[0]
    r1 = p1.add_run()
    r1.text = "🗃️ Table: " + tname
    r1.font.name = FONT_ENG
    r1.font.size = Pt(16)
    r1.font.bold = True
    r1.font.color.rgb = col
    
    p2 = tf.add_paragraph()
    r2 = p2.add_run()
    r2.text = "Fields: " + tfields
    r2.font.name = FONT_ENG
    r2.font.size = Pt(12.5)
    r2.font.color.rgb = COLOR_WHITE
    
    p3 = tf.add_paragraph()
    r3 = p3.add_run()
    r3.text = "Relation: " + trel
    r3.font.name = FONT_HEAD
    r3.font.size = Pt(12)
    r3.font.color.rgb = COLOR_MUTED

# =============================================================
# SLIDE 11: UI - Login Page
# =============================================================
s11 = prs.slides.add_slide(blank_layout)
set_slide_background(s11, BG_DEEP_NAVY)
add_header(s11, "User Interface", "หน้าจอเข้าสู่ระบบ (Login & Authentication)", "ระบบรักษาความปลอดภัย ยืนยันตัวตน และสลับสิทธิ์การใช้งานตามบทบาท")

add_browser_mockup(s11, os.path.join(SCREENSHOTS_DIR, "real_login.png"), Inches(0.8), Inches(1.85), Inches(7.5), Inches(4.9))

# Callout Card
callout11 = add_card(s11, Inches(8.6), Inches(1.85), Inches(3.9), Inches(4.9), CARD_BG_DARK, ELECTRIC_BLUE, 1.5)
tf11 = callout11.text_frame
tf11.word_wrap = True
tf11.margin_left = tf11.margin_right = tf11.margin_top = Inches(0.3)

p_c11_t = tf11.paragraphs[0]
r_c11_t = p_c11_t.add_run()
r_c11_t.text = "ฟังก์ชันสำคัญหน้าล็อกอิน"
r_c11_t.font.name = FONT_HEAD
r_c11_t.font.size = Pt(19)
r_c11_t.font.bold = True
r_c11_t.font.color.rgb = NEON_CYAN

p_c11_b = tf11.add_paragraph()
r_c11_b = p_c11_b.add_run()
r_c11_b.text = (
    "\n• Role-Based Access Control:\n"
    "  ระบบจำแนกระหว่างเจ้าของหอพัก (Owner) และผู้เช่า (Tenant) อัตโนมัติ\n\n"
    "• Security Standard:\n"
    "  รหัสผ่านเข้ารหัสด้วย Bcrypt Hash 10 Salt Rounds และออก JWT Bearer Token\n\n"
    "• Multi-Language Support:\n"
    "  สลับภาษาไทย (TH) และอังกฤษ (ENG) ได้ทันทีที่มุมบนขวา\n\n"
    "• Theme Switcher:\n"
    "  รองรับโหมดมืด (Dark Mode) และโหมดสว่าง (Light Mode)"
)
r_c11_b.font.name = FONT_HEAD
r_c11_b.font.size = Pt(13.5)
r_c11_b.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 12: UI - Admin Dashboard
# =============================================================
s12 = prs.slides.add_slide(blank_layout)
set_slide_background(s12, BG_DEEP_NAVY)
add_header(s12, "User Interface", "หน้าแดชบอร์ดผู้ดูแลหอพัก (Dashboard Overview)", "ภาพรวมสถานะห้องพัก อัตราการครองห้อง และกิจกรรมล่าสุดของหอพัก")

add_browser_mockup(s12, os.path.join(SCREENSHOTS_DIR, "real_1_dashboard.png"), Inches(0.8), Inches(1.85), Inches(7.5), Inches(4.9))

callout12 = add_card(s12, Inches(8.6), Inches(1.85), Inches(3.9), Inches(4.9), CARD_BG_DARK, EMERALD_GREEN, 1.5)
tf12 = callout12.text_frame
tf12.word_wrap = True
tf12.margin_left = tf12.margin_right = tf12.margin_top = Inches(0.3)

p_c12_t = tf12.paragraphs[0]
r_c12_t = p_c12_t.add_run()
r_c12_t.text = "สถิติจริงจากระบบ (Live Metrics)"
r_c12_t.font.name = FONT_HEAD
r_c12_t.font.size = Pt(19)
r_c12_t.font.bold = True
r_c12_t.font.color.rgb = EMERALD_GREEN

p_c12_b = tf12.add_paragraph()
r_c12_b = p_c12_b.add_run()
r_c12_b.text = (
    "\n• Metric Cards ด้านบน:\n"
    "  แสดงจำนวนห้องทั้งหมด (6 ห้อง), ห้องว่าง (0 ห้อง), ห้องมีผู้เช่า (6 ห้อง) และรายการค้างชำระ (37 รายการ)\n\n"
    "• Quick Action Sidebar:\n"
    "  ปุ่มโทรด่วนฉุกเฉิน 24 ชม., กล่องค้นหาเมนูด่วน และการจัดกลุ่มหมวดหมู่อย่างเป็นระเบียบ\n\n"
    "• Active Tenant List:\n"
    "  ตารางแสดงสถานะผู้เช่าห้อง 101–333 พร้อมปุ่มเข้าดูข้อมูลห้องพักได้ทันที"
)
r_c12_b.font.name = FONT_HEAD
r_c12_b.font.size = Pt(13.5)
r_c12_b.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 13: UI - Room Management
# =============================================================
s13 = prs.slides.add_slide(blank_layout)
set_slide_background(s13, BG_DEEP_NAVY)
add_header(s13, "User Interface", "หน้าจัดการห้องพักและสถานะสัญญา (Rooms Management)", "ตารางผังห้องพัก ข้อมูลพื้นที่ ขนาดห้อง อัตราค่าเช่า และสถานะการเช่า")

add_browser_mockup(s13, os.path.join(SCREENSHOTS_DIR, "real_2_rooms.png"), Inches(0.8), Inches(1.85), Inches(7.5), Inches(4.9))

callout13 = add_card(s13, Inches(8.6), Inches(1.85), Inches(3.9), Inches(4.9), CARD_BG_DARK, PURPLE_GLOW, 1.5)
tf13 = callout13.text_frame
tf13.word_wrap = True
tf13.margin_left = tf13.margin_right = tf13.margin_top = Inches(0.3)

p_c13_t = tf13.paragraphs[0]
r_c13_t = p_c13_t.add_run()
r_c13_t.text = "การบริหารผังห้องพัก"
r_c13_t.font.name = FONT_HEAD
r_c13_t.font.size = Pt(19)
r_c13_t.font.bold = True
r_c13_t.font.color.rgb = PURPLE_GLOW

p_c13_b = tf13.add_paragraph()
r_c13_b = p_c13_b.add_run()
r_c13_b.text = (
    "\n• Room Types & Pricing:\n"
    "  รองรับห้อง Studio (24 ตร.ม.), Corner Studio (26 ตร.ม.) และ 1-Bedroom (32 ตร.ม.) กำหนดราคาแยกตามชั้น\n\n"
    "• Visual Status Badges:\n"
    "  แสดงสถานะ 'ไม่ว่าง' (มีผู้เช่า) สีแดงชัดเจน หรือ 'ว่าง' สีเขียว\n\n"
    "• Quick Action Controls:\n"
    "  ปุ่ม '+ เพิ่มห้อง', ปุ่ม 'แก้ไข', ปุ่ม 'ลบ' และตัวกรองค้นหาตามหมายเลขห้องพัก"
)
r_c13_b.font.name = FONT_HEAD
r_c13_b.font.size = Pt(13.5)
r_c13_b.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 14: UI - Monthly Billing
# =============================================================
s14 = prs.slides.add_slide(blank_layout)
set_slide_background(s14, BG_DEEP_NAVY)
add_header(s14, "User Interface", "หน้าจัดการบิลและบันทึกมิเตอร์ (Monthly Bills)", "ระบบคำนวณค่าน้ำ-ค่าไฟอัตโนมัติ พร้อมปุ่มสุ่มเศษสตางค์ไม่ซ้ำกัน")

add_browser_mockup(s14, os.path.join(SCREENSHOTS_DIR, "real_3_monthly_bills.png"), Inches(0.8), Inches(1.85), Inches(7.5), Inches(4.9))

callout14 = add_card(s14, Inches(8.6), Inches(1.85), Inches(3.9), Inches(4.9), CARD_BG_DARK, AMBER_GOLD, 1.5)
tf14 = callout14.text_frame
tf14.word_wrap = True
tf14.margin_left = tf14.margin_right = tf14.margin_top = Inches(0.3)

p_c14_t = tf14.paragraphs[0]
r_c14_t = p_c14_t.add_run()
r_c14_t.text = "นวัตกรรมหน้าบิลรายเดือน"
r_c14_t.font.name = FONT_HEAD
r_c14_t.font.size = Pt(19)
r_c14_t.font.bold = True
r_c14_t.font.color.rgb = AMBER_GOLD

p_c14_b = tf14.add_paragraph()
r_c14_b = p_c14_b.add_run()
r_c14_b.text = (
    "\n• 🎲 ปุ่ม 'สุ่มทศนิยมไม่ซ้ำ (<1 ฿)':\n"
    "  สร้างเศษสตางค์เฉพาะตัวให้แต่ละบิล เช่น .64 ฿, .65 ฿, .92 ฿, .41 ฿\n\n"
    "• 📢 ปุ่ม 'แจ้งบิลทุกลูกค้า':\n"
    "  ส่งบิลเข้าบัญชีลูกบ้านทุกคนได้ในคลิกเดียว\n\n"
    "• ⚡ ปุ่ม 'จำลองเงินเข้า':\n"
    "  ทดสอบการจำลองโอนเงินแบบเสมือนจริง\n\n"
    "• สถานะบิล Real-time:\n"
    "  แสดงป้าย '✓ ชำระแล้ว' หรือ 'ยังไม่ชำระ' ทันทีเมื่อเงินเข้า"
)
r_c14_b.font.name = FONT_HEAD
r_c14_b.font.size = Pt(13.5)
r_c14_b.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 15: Unique Satang Innovation (HIGHLIGHT SLIDE)
# =============================================================
s15 = prs.slides.add_slide(blank_layout)
set_slide_background(s15, BG_DEEP_NAVY)
add_header(s15, "Core Breakthrough", "นวัตกรรมสุ่มเศษสตางค์ระบุตัวตน (Unique Satang Identifier)", "เปลี่ยน 'ยอดเงินโอน' ให้กลายเป็นรหัสระบุบิลเฉพาะตัว (Unique Payment Fingerprint)")

satang_examples = [
    ("ห้อง 101 (Room 101)", "ยอดค่าเช่าพื้นฐาน: ฿3,500.00\nเศษสตางค์สุ่มได้: +0.14 ฿", "฿3,500.14", ELECTRIC_BLUE),
    ("ห้อง 102 (Room 102)", "ยอดค่าเช่าพื้นฐาน: ฿3,500.00\nเศษสตางค์สุ่มได้: +0.72 ฿", "฿3,500.72", NEON_CYAN),
    ("ห้อง 103 (Room 103)", "ยอดค่าเช่าพื้นฐาน: ฿4,200.00\nเศษสตางค์สุ่มได้: +0.35 ฿", "฿4,200.35", PURPLE_GLOW),
]

for idx, (r_name, r_calc, r_total, col) in enumerate(satang_examples):
    c = add_card(s15, Inches(0.8 + idx * 4.0), Inches(1.9), Inches(3.7), Inches(2.5), CARD_BG_DARK, col, 1.5)
    tf = c.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.25)
    
    p1 = tf.paragraphs[0]
    p1.alignment = PP_ALIGN.CENTER
    r1 = p1.add_run()
    r1.text = r_name
    r1.font.name = FONT_HEAD
    r1.font.size = Pt(18)
    r1.font.bold = True
    r1.font.color.rgb = col
    
    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    r2 = p2.add_run()
    r2.text = "\n" + r_calc
    r2.font.name = FONT_HEAD
    r2.font.size = Pt(13)
    r2.font.color.rgb = COLOR_SOFT_GRAY
    
    p3 = tf.add_paragraph()
    p3.alignment = PP_ALIGN.CENTER
    r3 = p3.add_run()
    r3.text = "\n" + r_total
    r3.font.name = FONT_ENG
    r3.font.size = Pt(28)
    r3.font.bold = True
    r3.font.color.rgb = COLOR_WHITE

# Explanation Box Below
exp_box = add_card(s15, Inches(0.8), Inches(4.7), Inches(11.7), Inches(2.0), CARD_BG_DARK, EMERALD_GREEN, 1.2)
tf_exp = exp_box.text_frame
tf_exp.word_wrap = True
tf_exp.margin_left = tf_exp.margin_right = Inches(0.4)
tf_exp.margin_top = Inches(0.25)

p_et = tf_exp.paragraphs[0]
r_et = p_et.add_run()
r_et.text = "💡 ทำไมระบบนี้ถึงตัดปัญหา 'สลิปปลอม' และ 'ค่าธรรมเนียม' ได้ 100%?"
r_et.font.name = FONT_HEAD
r_et.font.size = Pt(17)
r_et.font.bold = True
r_et.font.color.rgb = EMERALD_GREEN

p_eb = tf_exp.add_paragraph()
r_eb = p_eb.add_run()
r_eb.text = (
    "1. Fisher-Yates Randomization: สุ่มเศษสตางค์ 0.01 ถึง 0.99 บาท แบบไม่ซ้ำกันในรอบบิลเดียวกัน ทำให้ทุกบิลมียอดเงินที่ต่างกันแน่นอน\n"
    "2. Self-Identifying Amount: เมื่อมีเงินโอนเข้า เช่น 3,500.14 บาท ระบบค้นหาบิลที่ยอดตรงกันได้ทันทีใน 68 ms โดยไม่ต้องอ่านชื่อผู้โอน\n"
    "3. Zero Slip Dependency: ผู้เช่าไม่ต้องแคปสลิปมาแนบ หมดปัญหาการนำสลิปเก่ามาใช้ซ้ำ หรือการตัดต่อตัวเลขในรูปภาพสลิปอย่างเด็ดขาด"
)
r_eb.font.name = FONT_HEAD
r_eb.font.size = Pt(13.5)
r_eb.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 16: Automated Payment Workflow (CORE INNOVATION FLOW)
# =============================================================
s16 = prs.slides.add_slide(blank_layout)
set_slide_background(s16, BG_DEEP_NAVY)
add_header(s16, "Automated Pipeline", "กระบวนการตรวจจับและตัดยอดบิลอัตโนมัติ (End-to-End Workflow)", "การประสานงานอัตโนมัติ 8 ขั้นตอน จากออกบิลจนถึงอนุมัติสำเร็จภายใน 1.83 วินาที")

steps_8 = [
    ("1. ออกบิลค่าเช่า", "บันทึกมิเตอร์น้ำ-ไฟ คำนวณเงิน"),
    ("2. สุ่มเศษสตางค์", "ได้ยอดเฉพาะ เช่น 3,500.14 ฿"),
    ("3. PromptPay QR", "สร้าง QR ล็อกยอดพร้อมสแกน"),
    ("4. ผู้เช่าโอนเงิน", "สแกนจ่ายผ่าน Mobile Banking"),
    ("5. LINE แจ้งเตือน", "Krungthai/SCB Connext เด้งบนจอ"),
    ("6. Fast Native OCR", "WinRT OCR สกัดยอดใน 9.4 ms"),
    ("7. จับคู่บิลใน DB", "ค้นหาบิล unpaid ยอดตรงเป๊ะ"),
    ("8. อนุมัติสำเร็จ!", "บิลเปลี่ยนเป็น 'paid' ใน 1.83s"),
]

for idx, (st_name, st_desc) in enumerate(steps_8):
    row = idx // 4
    c_idx = idx % 4
    left = Inches(0.8 + c_idx * 2.95)
    top = Inches(1.9 + row * 2.45)
    
    col = NEON_CYAN if idx in [1, 5, 7] else ELECTRIC_BLUE
    c = add_card(s16, left, top, Inches(2.8), Inches(2.25), CARD_BG_DARK, col, 1.2)
    tf = c.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.2)
    
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = f"STEP 0{idx+1}"
    r.font.name = FONT_ENG
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = col
    
    p2 = tf.add_paragraph()
    r2 = p2.add_run()
    r2.text = "\n" + st_name
    r2.font.name = FONT_HEAD
    r2.font.size = Pt(16)
    r2.font.bold = True
    r2.font.color.rgb = COLOR_WHITE
    
    p3 = tf.add_paragraph()
    r3 = p3.add_run()
    r3.text = "\n" + st_desc
    r3.font.name = FONT_HEAD
    r3.font.size = Pt(12.5)
    r3.font.color.rgb = COLOR_SOFT_GRAY

# =============================================================
# SLIDE 17: UI - Payment Verification & Tenant UI
# =============================================================
s17 = prs.slides.add_slide(blank_layout)
set_slide_background(s17, BG_DEEP_NAVY)
add_header(s17, "Live Verification", "หน้ารายการชำระเงินและหน้าจอผู้เช่า (Payments Verification)", "การยืนยันยอดเงินอัตโนมัติพร้อมไฟสถานะ [LINE Connext] และหน้าชำระเงินของลูกบ้าน")

# Two mockups side-by-side
add_browser_mockup(s17, os.path.join(SCREENSHOTS_DIR, "real_4_payments.png"), Inches(0.8), Inches(1.85), Inches(5.7), Inches(4.9))
add_browser_mockup(s17, os.path.join(SCREENSHOTS_DIR, "real_8_tenant_payment.png"), Inches(6.8), Inches(1.85), Inches(5.7), Inches(4.9))

# =============================================================
# SLIDE 18: UI - Maintenance Management
# =============================================================
s18 = prs.slides.add_slide(blank_layout)
set_slide_background(s18, BG_DEEP_NAVY)
add_header(s18, "Operations", "หน้าจัดการรายการแจ้งซ่อมบำรุง (Maintenance & Repairs)", "ระบบรับเรื่องแจ้งซ่อม ติดตามสถานะงานช่าง และประวัติการแก้ไขอุปกรณ์ชำรุด")

add_browser_mockup(s18, os.path.join(SCREENSHOTS_DIR, "real_5_repairs.png"), Inches(0.8), Inches(1.85), Inches(7.5), Inches(4.9))

callout18 = add_card(s18, Inches(8.6), Inches(1.85), Inches(3.9), Inches(4.9), CARD_BG_DARK, ROSE_RED, 1.5)
tf18 = callout18.text_frame
tf18.word_wrap = True
tf18.margin_left = tf18.margin_right = tf18.margin_top = Inches(0.3)

p_c18_t = tf18.paragraphs[0]
r_c18_t = p_c18_t.add_run()
r_c18_t.text = "ระบบบริหารงานแจ้งซ่อม"
r_c18_t.font.name = FONT_HEAD
r_c18_t.font.size = Pt(19)
r_c18_t.font.bold = True
r_c18_t.font.color.rgb = ROSE_RED

p_c18_b = tf18.add_paragraph()
r_c18_b = p_c18_b.add_run()
r_c18_b.text = (
    "\n• รายการแจ้งซ่อมจริงในระบบ:\n"
    "  แสดงรายการแจ้งปัญหา เช่น 'ไฟเสีย', 'ไฟดับ', 'แอร์' พร้อมระบุห้อง 201, 202, 333\n\n"
    "• ข้อมูลผู้แจ้งชัดเจน:\n"
    "  บันทึกชื่อผู้แจ้ง เบอร์โทรติดต่อ วันเวลาที่แจ้งปัญหา\n\n"
    "• Workflow ติดตามสถานะ:\n"
    "  มีปุ่ม 'แก้ไขแล้ว' เพื่อปิดงานซ่อม และปุ่ม 'จัดการงานซ่อม' สำหรับมอบหมายงานช่าง\n\n"
    "• หมวดหมู่อุปกรณ์:\n"
    "  จำแนกประเภทงาน เช่น ไฟฟ้า, ประปา, แอร์, เฟอร์นิเจอร์"
)
r_c18_b.font.name = FONT_HEAD
r_c18_b.font.size = Pt(13.5)
r_c18_b.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 19: Performance Results (QUANTITATIVE BENCHMARK)
# =============================================================
s19 = prs.slides.add_slide(blank_layout)
set_slide_background(s19, BG_DEEP_NAVY)
add_header(s19, "Empirical Benchmarks", "ผลการทดสอบประสิทธิภาพของระบบ (Performance Results)", "สถิติผลการวัดประสิทธิภาพจริงที่รายงานโครงงานระบุจากการทดสอบซ้ำหลายครั้ง")

benchmarks = [
    ("⚡ 1.83 วินาที", "Average Payment Confirmation", "ความเร็วเฉลี่ยตั้งแต่ป๊อปอัป LINE เด้ง จนกระทั่งหน้าเว็บผู้เช่าเปลี่ยนเป็น 'ชำระแล้ว'", NEON_CYAN),
    ("🎯 99.8%", "Reported Accuracy Rate", "ความถูกต้องแม่นยำในการจับคู่ยอดเงินและตัดยอดบิล โดยไม่พบกรณีจับคู่ผิดห้อง", EMERALD_GREEN),
    ("⏱️ 9.4 ms", "Average WinRT Fast OCR Latency", "เวลาเฉลี่ยในการสกัดตัวเลขยอดเงินด้วยโมดูล Windows Native OCR (ช่วงความเร็ว 5.6 – 15.8 ms)", PURPLE_GLOW),
    ("💰 0.00 บาท", "Transaction Fee (Zero-Cost)", "ต้นทุนค่าธรรมเนียมรายธุรกรรมเป็นศูนย์ แตกต่างจาก Payment Gateway ทั่วไปที่คิด 1.5 - 3%", AMBER_GOLD),
]

for idx, (val, title, desc, col) in enumerate(benchmarks):
    c = add_card(s19, Inches(0.8 + idx * 2.95), Inches(1.9), Inches(2.8), Inches(4.8), CARD_BG_DARK, col, 1.5)
    tf = c.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.25)
    
    p1 = tf.paragraphs[0]
    p1.alignment = PP_ALIGN.CENTER
    r1 = p1.add_run()
    r1.text = val
    r1.font.name = FONT_HEAD
    r1.font.size = Pt(26)
    r1.font.bold = True
    r1.font.color.rgb = col
    
    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    r2 = p2.add_run()
    r2.text = "\n" + title
    r2.font.name = FONT_ENG
    r2.font.size = Pt(14)
    r2.font.bold = True
    r2.font.color.rgb = COLOR_WHITE
    
    p3 = tf.add_paragraph()
    r3 = p3.add_run()
    r3.text = "\n" + desc
    r3.font.name = FONT_HEAD
    r3.font.size = Pt(13)
    r3.font.color.rgb = COLOR_SOFT_GRAY

# =============================================================
# SLIDE 20: System Testing (Black-box Results)
# =============================================================
s20 = prs.slides.add_slide(blank_layout)
set_slide_background(s20, BG_DEEP_NAVY)
add_header(s20, "Verification & Quality", "ผลการทดสอบการทำงานของระบบ (Black-box Testing)", "ผลการทดสอบ 5 กรณีทดสอบหลัก (TC-01 ถึง TC-05) ผ่านการประเมิน 100% (5/5 Cases Passed)")

tcases = [
    ("TC-01", "การบันทึกมิเตอร์น้ำ-ไฟและออกบิล", "กรอกเลขมิเตอร์ใหม่", "คำนวณยอดถูกต้อง สถานะ 'unpaid'", "ผ่าน (Passed)", EMERALD_GREEN),
    ("TC-02", "การสุ่มเศษทศนิยมระบุตัวตน (<1 ฿)", "กดปุ่มสุ่มทศนิยม", "เศษสตางค์ทุกห้องไม่ซ้ำกัน และเพิ่ม < 1 บาท", "ผ่าน (Passed)", EMERALD_GREEN),
    ("TC-03", "การตรวจจับแจ้งเตือนเงินเข้ายอดตรงเป๊ะ", "แจ้งเตือนเด้ง 3,500.14 ฿", "บิลห้อง 101 เปลี่ยนเป็น 'paid' อัตโนมัติ", "ผ่าน (Passed)", EMERALD_GREEN),
    ("TC-04", "การจัดการบิลหลายงวดห้องเดียวกัน (FIFO)", "แจ้งเตือนเงินเข้า 1.00 ฿", "ระบบเลือกอนุมัติบิลงวดที่เก่าที่สุดก่อน", "ผ่าน (Passed)", EMERALD_GREEN),
    ("TC-05", "การป้องกันรายการโอนซ้ำ (Idempotency)", "ส่งแจ้งเตือนซ้ำ ID เดิม", "ระบบประมวลผลครั้งเดียว ข้ามรายการซ้ำ", "ผ่าน (Passed)", EMERALD_GREEN),
]

for idx, (code, title, inp, exp, res, col) in enumerate(tcases):
    c = add_card(s20, Inches(0.8), Inches(1.9 + idx * 0.98), Inches(11.7), Inches(0.85), CARD_BG_DARK, col, 1)
    tf = c.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.12)
    
    p = tf.paragraphs[0]
    r_c = p.add_run()
    r_c.text = f"[{code}] "
    r_c.font.name = FONT_ENG
    r_c.font.size = Pt(14)
    r_c.font.bold = True
    r_c.font.color.rgb = NEON_CYAN
    
    r_t = p.add_run()
    r_t.text = f"{title}  |  ข้อมูลเข้า: {inp}  -->  ผล: {exp}"
    r_t.font.name = FONT_HEAD
    r_t.font.size = Pt(13)
    r_t.font.color.rgb = COLOR_WHITE
    
    r_r = p.add_run()
    r_r.text = f"   [{res}]"
    r_r.font.name = FONT_HEAD
    r_r.font.size = Pt(14)
    r_r.font.bold = True
    r_r.font.color.rgb = col

# =============================================================
# SLIDE 21: User Satisfaction Evaluation
# =============================================================
s21 = prs.slides.add_slide(blank_layout)
set_slide_background(s21, BG_DEEP_NAVY)
add_header(s21, "User Evaluation", "ผลการประเมินความพึงพอใจของผู้ใช้งาน (User Satisfaction)", "ประเมินโดยกลุ่มตัวอย่างผู้ดูแลหอพักและผู้เช่า 15 คน ตามมาตราส่วน Likert Scale 5 ระดับ")

sat_items = [
    ("1. ความง่ายในการใช้งานและความสะดวกของหน้าจอ (Ease of Use)", 4.80, "0.41", "ดีมาก"),
    ("2. ความรวดเร็วในการตัดยอดบิลอัตโนมัติ (Speed & Real-time)", 4.88, "0.33", "ดีมาก"),
    ("3. ความถูกต้องแม่นยำในการป้องกันสลิปปลอม (Security & Accuracy)", 4.92, "0.28", "ดีมาก (สูงสุด)"),
    ("4. ความสะดวกในการจัดการบิลและบันทึกมิเตอร์ (Billing Management)", 4.70, "0.46", "ดีมาก"),
    ("5. ความพึงพอใจในภาพรวมต่อการใช้งานระบบ DormEase (Overall)", 4.73, "0.46", "ดีมาก"),
]

for idx, (title, score, sd, level) in enumerate(sat_items):
    c = add_card(s21, Inches(0.8), Inches(1.9 + idx * 0.95), Inches(8.5), Inches(0.82), CARD_BG_DARK, CARD_BORDER_DARK, 1)
    tf = c.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.12)
    
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = f"{title}\nค่าเฉลี่ย: {score:.2f} / 5.00  (S.D. = {sd})  •  ระดับ: {level}"
    r.font.name = FONT_HEAD
    r.font.size = Pt(13)
    r.font.color.rgb = COLOR_WHITE
    
    # Progress Bar background
    bar_bg = s21.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.5), Inches(1.9 + idx * 0.95 + 0.25), Inches(3.0), Inches(0.25))
    bar_bg.fill.solid()
    bar_bg.fill.fore_color.rgb = RGBColor(30, 41, 59)
    bar_bg.line.fill.background()
    
    # Progress Bar fill
    bar_w = Inches(3.0 * (score / 5.0))
    bar_fill = s21.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.5), Inches(1.9 + idx * 0.95 + 0.25), bar_w, Inches(0.25))
    bar_fill.fill.solid()
    bar_fill.fill.fore_color.rgb = NEON_CYAN if idx == 2 else ELECTRIC_BLUE
    bar_fill.line.fill.background()

# Total Summary Banner
tot_box = add_card(s21, Inches(0.8), Inches(6.1), Inches(11.7), Inches(0.75), CARD_BG_DARK, AMBER_GOLD, 1.5)
tf_tot = tot_box.text_frame
p_tot = tf_tot.paragraphs[0]
p_tot.alignment = PP_ALIGN.CENTER
r_tot = p_tot.add_run()
r_tot.text = "⭐ คะแนนเฉลี่ยรวมทุกด้าน: 4.79 จาก 5.00 คะแนน (S.D. = 0.38) อยู่ในระดับ 'ดีมาก' สูงสุด"
r_tot.font.name = FONT_HEAD
r_tot.font.size = Pt(17)
r_tot.font.bold = True
r_tot.font.color.rgb = AMBER_GOLD

# =============================================================
# SLIDE 22: Benefits & Business Value
# =============================================================
s22 = prs.slides.add_slide(blank_layout)
set_slide_background(s22, BG_DEEP_NAVY)
add_header(s22, "Impact & Value", "คุณประโยชน์และคุณค่าของระบบ (Benefits & Value)", "ผลกระทบเชิงบวกในการยกระดับประสิทธิภาพธุรกิจหอพักและประสบการณ์ของผู้เช่า")

benefits = [
    ("⏱️ ลดภาระงานได้ > 85%", "ลดเวลาในการจดมิเตอร์น้ำ-ไฟ ออกใบแจ้งหนี้ และตรวจสลิปโอนเงิน ทำให้ผู้ดูแลมีเวลาดูแลบริการลูกบ้านมากขึ้น", ELECTRIC_BLUE),
    ("🛡️ กำจัดการทุจริต 100%", "ป้องกันสลิปปลอมแปลง สลิปตัดต่อวันที่ และการวนใช้สลิปเก่าซ้ำได้อย่างสมบูรณ์ด้วยการตรวจสอบระดับ Transaction", EMERALD_GREEN),
    ("💸 ประหยัดต้นทุน 0 บาท", "ไม่มีค่าธรรมเนียมรายธุรกรรม 1.5 - 3% และไม่มีค่าบริการรายเดือนขั้นต่ำเหมือน Payment Gateway ของสถาบันการเงิน", AMBER_GOLD),
    ("📱 ประสบการณ์ลูกบ้านยุคใหม่", "ผู้เช่าสแกน PromptPay QR ล็อกยอดเป๊ะ ได้รับการอนุมัติบิลใน 1.83 วินาที ไม่ต้องรอคอยและไม่ต้องส่งสลิป", NEON_CYAN),
]

for idx, (b_title, b_desc, col) in enumerate(benefits):
    c = add_card(s22, Inches(0.8 + idx * 2.95), Inches(1.9), Inches(2.8), Inches(4.8), CARD_BG_DARK, col, 1.5)
    tf = c.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.25)
    
    p1 = tf.paragraphs[0]
    p1.alignment = PP_ALIGN.CENTER
    r1 = p1.add_run()
    r1.text = b_title
    r1.font.name = FONT_HEAD
    r1.font.size = Pt(18)
    r1.font.bold = True
    r1.font.color.rgb = col
    
    p2 = tf.add_paragraph()
    r2 = p2.add_run()
    r2.text = "\n" + b_desc
    r2.font.name = FONT_HEAD
    r2.font.size = Pt(14)
    r2.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 23: Limitations & Future Development
# =============================================================
s23 = prs.slides.add_slide(blank_layout)
set_slide_background(s23, BG_DEEP_NAVY)
add_header(s23, "Roadmap", "ข้อจำกัดและแนวทางการพัฒนาต่อ (Limitations & Roadmap)", "การวิเคราะห์ข้อจำกัดปัจจุบันพร้อมทิศทางการวิจัยและต่อยอดในอนาคต")

# Left: Limitations
c_lim = add_card(s23, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.8), CARD_BG_DARK, ROSE_RED, 1.5)
tf_l = c_lim.text_frame
tf_l.word_wrap = True
tf_l.margin_left = tf_l.margin_right = tf_l.margin_top = Inches(0.35)

p_lt = tf_l.paragraphs[0]
r_lt = p_lt.add_run()
r_lt.text = "⚠️ ข้อจำกัดของระบบปัจจุบัน (Limitations)"
r_lt.font.name = FONT_HEAD
r_lt.font.size = Pt(19)
r_lt.font.bold = True
r_lt.font.color.rgb = ROSE_RED

lim_points = (
    "\n1. การพึ่งพาระบบปฏิบัติการเครื่องแม่ข่าย:\n"
    "   โปรแกรมตรวจจับเงินเข้าต้องรันบน Windows ที่เปิดโปรแกรม LINE Desktop ไว้\n\n"
    "2. การเปิดเครื่องคอมพิวเตอร์:\n"
    "   หากเครื่องคอมพิวเตอร์ปิดอยู่ จะไม่สามารถตรวจจับ Real-time ได้ (แต่มีระบบแนบสลิปสำรอง)\n\n"
    "3. การอ่านมิเตอร์น้ำ-ไฟ:\n"
    "   ในเวอร์ชันปัจจุบันยังต้องให้เจ้าหน้าที่เดินจดและกรอกตัวเลขมิเตอร์ด้วยมือ"
)
p_lb = tf_l.add_paragraph()
r_lb = p_lb.add_run()
r_lb.text = lim_points
r_lb.font.name = FONT_HEAD
r_lb.font.size = Pt(14)
r_lb.font.color.rgb = COLOR_WHITE

# Right: Future Roadmap
c_fut = add_card(s23, Inches(6.8), Inches(1.9), Inches(5.7), Inches(4.8), CARD_BG_DARK, NEON_CYAN, 1.5)
tf_f = c_fut.text_frame
tf_f.word_wrap = True
tf_f.margin_left = tf_f.margin_right = tf_f.margin_top = Inches(0.35)

p_ft = tf_f.paragraphs[0]
r_ft = p_ft.add_run()
r_ft.text = "🚀 แนวทางการพัฒนาต่อยอด (Future Roadmap)"
r_ft.font.name = FONT_HEAD
r_ft.font.size = Pt(19)
r_ft.font.bold = True
r_ft.font.color.rgb = NEON_CYAN

fut_points = (
    "\n1. IoT Smart Meter Integration:\n"
    "   เชื่อมต่อมิเตอร์น้ำ-ไฟอัจฉริยะผ่าน Wi-Fi/LoRaWAN คีย์หน่วยเข้าบิลอัตโนมัติ 100%\n\n"
    "2. Native Mobile Application:\n"
    "   พัฒนาแอปสำหรับผู้เช่าบน iOS และ Android พร้อมระบบ Push Notifications ตรงเข้ามือถือ\n\n"
    "3. Open Banking API:\n"
    "   เชื่อมต่อ Webhook ของธนาคารโดยตรงในอนาคตเพื่อให้ทำงานบน Cloud 100%\n\n"
    "4. AI Predictive Analytics:\n"
    "   พยากรณ์การใช้พลังงานและแนวโน้มการเงินของหอพัก"
)
p_fb = tf_f.add_paragraph()
r_fb = p_fb.add_run()
r_fb.text = fut_points
r_fb.font.name = FONT_HEAD
r_fb.font.size = Pt(14)
r_fb.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 24: Conclusion
# =============================================================
s24 = prs.slides.add_slide(blank_layout)
set_slide_background(s24, BG_DEEP_NAVY)
add_header(s24, "Conclusion", "สรุปผลการดำเนินงานโครงงาน (Conclusion)", "ความสำเร็จในการผสานเว็บเทคโนโลยีสมัยใหม่เข้ากับนวัตกรรมตรวจจับเงินเข้าอัตโนมัติ")

c_con = add_card(s24, Inches(0.8), Inches(1.9), Inches(11.7), Inches(4.8), CARD_BG_DARK, ELECTRIC_BLUE, 1.5)
tf_c = c_con.text_frame
tf_c.word_wrap = True
tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = Inches(0.5)

p_ct = tf_c.paragraphs[0]
r_ct = p_ct.add_run()
r_ct.text = "DormEase — Smart Dormitory Management System"
r_ct.font.name = FONT_HEAD
r_ct.font.size = Pt(24)
r_ct.font.bold = True
r_ct.font.color.rgb = NEON_CYAN

con_text = (
    "\n✔ บรรลุวัตถุประสงค์ครบถ้วน 100%:\n"
    "  พัฒนาเว็บแอปพลิเคชันบริหารหอพักครบวงจร (ห้องพัก สัญญา บิล การชำระเงิน และงานซ่อม) สำเร็จสมบูรณ์\n\n"
    "✔ พิสูจน์ความสำเร็จของนวัตกรรม Unique Satang + Fast OCR:\n"
    "  สามารถอนุมัติบิลได้รวดเร็วเฉลี่ย 1.83 วินาที มีความแม่นยำ 99.8% และปราศจากค่าธรรมเนียมธุรกรรม\n\n"
    "✔ การยอมรับในระดับสูงมากจากกลุ่มตัวอย่างผู้ใช้จริง:\n"
    "  คะแนนความพึงพอใจเฉลี่ยรวม 4.79 จาก 5.00 คะแนน (S.D. = 0.38) โดยเฉพาะด้านความปลอดภัยในการป้องกันสลิปปลอม (4.92)\n\n"
    "✔ พร้อมนำไปต่อยอดเชิงพาณิชย์และใช้งานจริง:\n"
    "  ช่วยยกระดับการบริหารจัดการหอพักของไทยสู่ระบบดิจิทัลที่ทันสมัย คุ้มค่า และยั่งยืนอย่างแท้จริง"
)
p_cb = tf_c.add_paragraph()
r_cb = p_cb.add_run()
r_cb.text = con_text
r_cb.font.name = FONT_HEAD
r_cb.font.size = Pt(16)
r_cb.font.color.rgb = COLOR_WHITE

# =============================================================
# SLIDE 25: Closing & Q&A
# =============================================================
s25 = prs.slides.add_slide(blank_layout)
set_slide_background(s25, BG_DEEP_NAVY)

# Glow background accent
glow25 = s25.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.0), Inches(1.5), Inches(7.3), Inches(4.5))
glow25.fill.solid()
glow25.fill.fore_color.rgb = RGBColor(25, 45, 110)
glow25.line.fill.background()

c_close = add_card(s25, Inches(1.8), Inches(1.4), Inches(9.7), Inches(4.8), CARD_BG_DARK, NEON_CYAN, 2)
tf_cl = c_close.text_frame
tf_cl.word_wrap = True
tf_cl.margin_top = Inches(0.5)

p_ty = tf_cl.paragraphs[0]
p_ty.alignment = PP_ALIGN.CENTER
r_ty = p_ty.add_run()
r_ty.text = "THANK YOU"
r_ty.font.name = FONT_ENG
r_ty.font.size = Pt(44)
r_ty.font.bold = True
r_ty.font.color.rgb = COLOR_WHITE

p_sub_ty = tf_cl.add_paragraph()
p_sub_ty.alignment = PP_ALIGN.CENTER
r_sub_ty = p_sub_ty.add_run()
r_sub_ty.text = "DormEase — Smart Dormitory, Smarter Payments"
r_sub_ty.font.name = FONT_ENG
r_sub_ty.font.size = Pt(20)
r_sub_ty.font.color.rgb = NEON_CYAN

p_qa = tf_cl.add_paragraph()
p_qa.alignment = PP_ALIGN.CENTER
r_qa = p_qa.add_run()
r_qa.text = "\nขอขอบพระคุณคณะกรรมการและอาจารย์ทุกท่าน\nQuestions & Answers (Q&A)"
r_qa.font.name = FONT_HEAD
r_qa.font.size = Pt(22)
r_qa.font.bold = True
r_qa.font.color.rgb = AMBER_GOLD

p_meta = tf_cl.add_paragraph()
p_meta.alignment = PP_ALIGN.CENTER
r_meta = p_meta.add_run()
r_meta.text = "\nนวพรรษ เนียมศรี  •  วิศิษฏ์ มาลาอบ  •  ชินวุธ สารศิริ\nภาควิชาวิทยาการเทคโนโลยีและดิจิทัล คณะวิทยาศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา"
r_meta.font.name = FONT_HEAD
r_meta.font.size = Pt(14)
r_meta.font.color.rgb = COLOR_SOFT_GRAY

# =============================================================
# SAVE PRESENTATION
# =============================================================
print("Saving presentation...")

# 1. Save to Desktop
try:
    prs.save(OUTPUT_PPTX_DESKTOP)
    print(f"SUCCESS: Saved presentation to Desktop -> {OUTPUT_PPTX_DESKTOP} ({os.path.getsize(OUTPUT_PPTX_DESKTOP)} bytes)")
except Exception as e:
    print(f"Desktop save error: {e}")

# 2. Save to local project directory
try:
    prs.save(OUTPUT_PPTX_LOCAL)
    print(f"SUCCESS: Saved presentation to Project -> {OUTPUT_PPTX_LOCAL} ({os.path.getsize(OUTPUT_PPTX_LOCAL)} bytes)")
except Exception as e:
    print(f"Local save error: {e}")
