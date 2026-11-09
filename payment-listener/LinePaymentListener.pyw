# -*- coding: utf-8 -*-
"""
DormEase - LINE Desktop & Multi-Bank Payment Notification Listener (System Tray App)
ตรวจจับการแจ้งเตือนเงินเข้าจากหน้าต่างป๊อปอัปสีขาวของ LINE Desktop บน Windows
(เฉพาะไลน์แจ้งเตือนของธนาคาร: Krungthai Connext, SCB Connect, KBank Live, BBL, ttb, BAY, GSB, PromptPay)
และส่งยอดเงินไปตัดยอดบิลในระบบหอพัก DormEase อัตโนมัติ (ไม่มีจอดำ PowerShell ซ่อนข้างนาฬิกา)
"""

import os
import sys
import time
import json
import re
import tempfile
import threading
import subprocess
import urllib.request
import urllib.error
import webbrowser
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

import pystray
from PIL import Image, ImageDraw
import uiautomation as auto
import ctypes
from ctypes import wintypes

user32 = ctypes.windll.user32
gdi32 = ctypes.windll.gdi32

try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except Exception:
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

# ==============================================================================
# 1. การตั้งค่าและตัวแปรระบบ
# ==============================================================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, "config.json")
LOG_FILE = os.path.join(SCRIPT_DIR, "listener.log")
PROCESSED_FILE = os.path.join(SCRIPT_DIR, "processed_ids.txt")
OCR_HELPER_FILE = os.path.join(SCRIPT_DIR, "ocr_helper.ps1")

DEFAULT_CONFIG = {
    "api_url": "http://119.59.102.161:3007/api/payment/notification",
    "api_key": "dormease_secret_key_2026",
    "target_app_keywords": ["LINE", "LINE Desktop", "line"],
    "target_senders": ["Krungthai", "SCB", "KBank", "BBL", "ttb", "Krungsri", "GSB", "PromptPay", "Connext"],
    "source_name": "line_desktop_bank",
    "poll_interval_seconds": 1.5
}

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                return {**DEFAULT_CONFIG, **cfg}
        except:
            pass
    return DEFAULT_CONFIG

config = load_config()

# ==============================================================================
# 2. Multi-Bank Parser Engine (รองรับทุกธนาคารไทย)
# ==============================================================================
BANK_KEYWORDS = {
    "krungthai": ["krungthai", "กรุงไทย", "connext", "ktb", "krung thai"],
    "scb": ["scb", "ไทยพาณิชย์", "แม่มณี", "scb connect", "easy"],
    "kbank": ["kbank", "กสิกร", "k plus", "k-plus", "k+", "kbank live", "kasikorn"],
    "bbl": ["bbl", "กรุงเทพ", "bangkok bank", "bualuang"],
    "ttb": ["ttb", "ทีทีบี", "tmb", "thanachart", "ttb touch"],
    "krungsri": ["krungsri", "กรุงศรี", "bay", "uchoise", "krungsri simple"],
    "gsb": ["gsb", "ออมสิน", "mymo"],
    "promptpay": ["promptpay", "พร้อมเพย์"]
}

def detect_bank(msg):
    if not msg:
        return "auto"
    m = msg.lower()
    for bank_code, kws in BANK_KEYWORDS.items():
        if any(k in m for k in kws):
            return bank_code
    return "other_bank"

def extract_amount(msg, is_bank_context=False):
    if not msg:
        return None
    
    # ตรวจสอบว่าไม่ใช่การแจ้งเตือนเงินออก
    is_money_out = any(k in msg for k in ["โอนออก", "ถอนเงิน", "ชำระค่าบริการให้", "หักบัญชี", "จ่ายบิล", "เงินออก"])
    if is_money_out:
        return None

    is_bank = (detect_bank(msg) != "other_bank") or is_bank_context
    has_deposit = any(k in msg for k in [
        "เงินเข้า", "รับเงิน", "รับโอน", "โอนเข้า", "ยอดเงินเข้า", "ได้รับเงิน",
        "เข้าบัญชี", "deposit", "received", "+", "connext", "promptpay"
    ]) or is_bank
    if not has_deposit:
        return None

    patterns = [
        r"(?:เงินเข้า|รับเงิน|โอนเข้า|ยอดเงินเข้า|ได้รับเงิน|รับโอน|โอนสำเร็จ|ยอดเงิน|จำนวน|deposit|received)\s*[:\s]*([0-9,]+(?:\.[0-9]{2})?)\s*(?:บาท|บ\.|THB)?",
        r"([0-9,]+(?:\.[0-9]{2})?)\s*(?:บาท|บ\.|THB)",
        r"(?:฿|\+)\s*([0-9,]+(?:\.[0-9]{2})?)",
        r"(?<![-\d])([0-9]{1,6}\.[0-9]{2})(?![-\d])"
    ]
    for p in patterns:
        m = re.search(p, msg, re.IGNORECASE)
        if m:
            clean = m.group(1).replace(",", "")
            try:
                val = float(clean)
                if val > 0:
                    return val
            except:
                pass
    return None

def get_process_name_by_pid(pid):
    """ระบุชื่อไฟล์กระบวนการ (เช่น LINE.exe) จาก Process ID"""
    try:
        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        hProcess = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
        if not hProcess:
            return ""
        buf = ctypes.create_unicode_buffer(1024)
        size = wintypes.DWORD(1024)
        ctypes.windll.kernel32.QueryFullProcessImageNameW(hProcess, 0, buf, ctypes.byref(size))
        ctypes.windll.kernel32.CloseHandle(hProcess)
        return os.path.basename(buf.value).lower()
    except Exception:
        return ""


# ==============================================================================
# 3. Windows Native Capture & OCR Engine
# ==============================================================================
def capture_screen_rect(x, y, w, h, filepath):
    """จับภาพพื้นที่หน้าจอบน Desktop โดยตรงจาก Screen DC"""
    try:
        hdcScreen = user32.GetDC(0)
        hdcMem = gdi32.CreateCompatibleDC(hdcScreen)
        hbm = gdi32.CreateCompatibleBitmap(hdcScreen, w, h)
        gdi32.SelectObject(hdcMem, hbm)

        SRCCOPY = 0x00CC0020
        ret = gdi32.BitBlt(hdcMem, 0, 0, w, h, hdcScreen, x, y, SRCCOPY)
        if not ret:
            user32.ReleaseDC(0, hdcScreen)
            gdi32.DeleteDC(hdcMem)
            gdi32.DeleteObject(hbm)
            return False

        bmpinfo = bytearray(40)
        ctypes.c_int32.from_buffer(bmpinfo, 0).value = 40
        ctypes.c_int32.from_buffer(bmpinfo, 4).value = w
        ctypes.c_int32.from_buffer(bmpinfo, 8).value = -h
        ctypes.c_int16.from_buffer(bmpinfo, 12).value = 1
        ctypes.c_int16.from_buffer(bmpinfo, 14).value = 32

        buffer = bytearray(w * h * 4)
        gdi32.GetDIBits(hdcMem, hbm, 0, h, (ctypes.c_char * len(buffer)).from_buffer(buffer), bytes(bmpinfo), 0)

        user32.ReleaseDC(0, hdcScreen)
        gdi32.DeleteDC(hdcMem)
        gdi32.DeleteObject(hbm)

        img = Image.frombuffer('RGBA', (w, h), bytes(buffer), 'raw', 'BGRA', 0, 1)
        img.convert('RGB').save(filepath)
        return True
    except Exception:
        return False

def capture_window_to_file(hwnd, filepath):
    """จับภาพหน้าต่าง Win32/Qt โดยใช้ Screen DC BitBlt (รองรับ Hardware Acceleration) หรือ PrintWindow"""
    try:
        rect = wintypes.RECT()
        user32.GetWindowRect(hwnd, ctypes.byref(rect))
        w = rect.right - rect.left
        h = rect.bottom - rect.top
        if w <= 10 or h <= 10:
            return False

        # พยายามจับภาพจาก Screen DC ก่อน
        if user32.IsWindowVisible(hwnd) and capture_screen_rect(rect.left, rect.top, w, h, filepath):
            return True

        # Fallback: PrintWindow
        hwndDC = user32.GetWindowDC(hwnd)
        mfcDC = gdi32.CreateCompatibleDC(hwndDC)
        saveBitMap = gdi32.CreateCompatibleBitmap(hwndDC, w, h)
        gdi32.SelectObject(mfcDC, saveBitMap)
        user32.PrintWindow(hwnd, mfcDC, 2) # PW_RENDERFULLCONTENT

        bmpinfo = bytearray(40)
        ctypes.c_int32.from_buffer(bmpinfo, 0).value = 40
        ctypes.c_int32.from_buffer(bmpinfo, 4).value = w
        ctypes.c_int32.from_buffer(bmpinfo, 8).value = -h
        ctypes.c_int16.from_buffer(bmpinfo, 12).value = 1
        ctypes.c_int16.from_buffer(bmpinfo, 14).value = 32

        buffer = bytearray(w * h * 4)
        gdi32.GetDIBits(mfcDC, saveBitMap, 0, h, (ctypes.c_char * len(buffer)).from_buffer(buffer), bytes(bmpinfo), 0)

        user32.ReleaseDC(hwnd, hwndDC)
        gdi32.DeleteDC(mfcDC)
        gdi32.DeleteObject(saveBitMap)

        img = Image.frombuffer('RGBA', (w, h), bytes(buffer), 'raw', 'BGRA', 0, 1)
        img.convert('RGB').save(filepath)
        return True
    except Exception:
        return False

class FastOcrWorker:
    def __init__(self):
        self.proc = None
        self.lock = threading.Lock()
        self._start_worker()

    def _start_worker(self):
        worker_script = os.path.join(SCRIPT_DIR, "ocr_worker.ps1")
        if not os.path.exists(worker_script):
            return
        try:
            creationflags = 0x08000000 # CREATE_NO_WINDOW
            cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", worker_script]
            self.proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                encoding="utf-8",
                creationflags=creationflags
            )
            # รอสัญญาณเริ่มต้นพร้อมทำงาน
            ready = self.proc.stdout.readline()
        except Exception:
            self.proc = None

    def ocr_image(self, filepath):
        if not os.path.exists(filepath):
            return ""
        with self.lock:
            if not self.proc or self.proc.poll() is not None:
                self._start_worker()
            if not self.proc:
                # Fallback ไปใช้ powershell แบบเดิมหาก worker มีปัญหา
                try:
                    cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", OCR_HELPER_FILE, "-ImagePath", filepath]
                    res = subprocess.run(cmd, capture_output=True, timeout=5)
                    return res.stdout.decode("utf-8", errors="replace").strip()
                except Exception:
                    return ""
            try:
                self.proc.stdin.write(os.path.abspath(filepath) + "\n")
                self.proc.stdin.flush()
                lines = []
                while True:
                    line = self.proc.stdout.readline()
                    if not line:
                        break
                    line = line.strip()
                    if line == "---END_OCR---":
                        break
                    if line:
                        lines.append(line)
                return " ".join(lines)
            except Exception:
                try:
                    self.proc.terminate()
                except:
                    pass
                self.proc = None
                return ""

fast_ocr = FastOcrWorker()

def ocr_image_file(filepath):
    """เรียก Windows Media OCR API เพื่ออ่านข้อความจากรูปภาพป๊อปอัป (ทำงานแบบ persistent ~5-15ms)"""
    return fast_ocr.ocr_image(filepath)

def create_tray_image():
    """สร้างไอคอน System Tray โล่สีเขียว DormEase"""
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((4, 4, 60, 60), fill="#059669", outline="#047857", width=2)
    draw.polygon([(18, 33), (27, 45), (46, 19), (42, 16), (27, 39), (22, 30)], fill="#FFFFFF")
    return img

# ==============================================================================
# 4. Listener Engine & Scanner
# ==============================================================================
class PaymentListenerService:
    def __init__(self, on_log_callback=None, on_match_callback=None):
        self.is_running = False
        self.processed_ids = set()
        self.on_log = on_log_callback
        self.on_match = on_match_callback
        self.scan_thread = None
        self.toast_thread = None
        self.load_processed_cache()

    def load_processed_cache(self):
        if os.path.exists(PROCESSED_FILE):
            try:
                with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            self.processed_ids.add(line)
            except:
                pass

    def mark_processed(self, notif_id):
        self.processed_ids.add(notif_id)
        try:
            with open(PROCESSED_FILE, "a", encoding="utf-8") as f:
                f.write(f"{notif_id}\n")
        except:
            pass

    def log(self, text, level="INFO"):
        ts = datetime.now().strftime("%H:%M:%S")
        formatted = f"[{ts}] [{level}] {text}"
        try:
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(f"{formatted}\n")
        except:
            pass
        if self.on_log:
            try:
                self.on_log(formatted)
            except Exception:
                pass

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.scan_thread = threading.Thread(target=self._scan_loop, daemon=True)
            self.scan_thread.start()
            self.toast_thread = threading.Thread(target=self._toast_loop, daemon=True)
            self.toast_thread.start()
            self.log("🚀 เริ่มต้นระบบตรวจจับ LINE Desktop (ป๊อปอัปขาว & ทุกแอปธนาคาร)", "START")

    def stop(self):
        self.is_running = False
        self.log("⏹️ หยุดระบบตรวจจับเรียบร้อยแล้ว", "STOP")

    def send_to_api(self, raw_message, amount=None, bank=None, notif_id=None):
        if not notif_id:
            notif_id = f"LINE-{int(time.time())}-{abs(hash(raw_message)) % 100000}"

        if notif_id in self.processed_ids:
            return None

        if not amount:
            amount = extract_amount(raw_message)

        if not amount or amount <= 0:
            self.log(f"ข้ามข้อความ (ไม่พบยอดเงิน): {raw_message[:45]}...", "SKIP")
            return None

        detected_bank = bank or detect_bank(raw_message)

        payload = {
            "source": config.get("source_name", "line_desktop_bank"),
            "bank": detected_bank,
            "amount": amount,
            "raw_message": raw_message,
            "notification_id": notif_id,
            "notification_time": datetime.now().isoformat()
        }

        api_url = config.get("api_url", "http://119.59.102.161:3007/api/payment/notification")
        api_key = config.get("api_key", "dormease_secret_key_2026")

        self.log(f"💰 ตรวจพบเงินเข้า {amount:,.2f} บาท ({detected_bank.upper()}) กำลังส่งไปยังระบบ...", "DETECT")

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                api_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "x-api-key": api_key
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_body = json.loads(resp.read().decode("utf-8"))

                self.mark_processed(notif_id)

                status = res_body.get("status")
                if status == "PAID":
                    room = res_body.get("room_number", "-")
                    tenant = res_body.get("tenant_name", "-")
                    period = res_body.get("period", "")
                    msg = f"✓ อนุมัติสำเร็จ! บิลห้อง {room} ({tenant}) งวด {period} ยอด {amount:,.2f} ฿ สถานะ PAID"
                    self.log(msg, "SUCCESS")
                    if self.on_match:
                        self.on_match(res_body, amount)
                elif status == "duplicate":
                    self.log("รายการนี้เคยตัดยอดไปแล้ว (ข้ามเพื่อป้องกันซ้ำ)", "DUPLICATE")
                elif status == "MANUAL_REVIEW":
                    msg = res_body.get("message") or f"ยอดเงิน {amount:,.2f} ฿ ส่งให้เจ้าหน้าที่ตรวจสอบด้วยตนเอง"
                    self.log(msg, "REVIEW")
                else:
                    self.log(f"ผลลัพธ์: {res_body.get('message', status)}", "INFO")

                return res_body
        except Exception as e:
            self.log(f"เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: {e}", "ERROR")
            return None

    def _scan_loop(self):
        """ลูปตรวจจับหน้าต่างป๊อปอัปสีขาวของ LINE Desktop ที่มุมขวาล่างของหน้าจอ"""
        # ผูกกับ Interactive Desktop หากรันในบริบทพิเศษ
        try:
            hdesk = user32.OpenDesktopW("default", 0, False, 0x01FF)
            if hdesk:
                user32.SetThreadDesktop(hdesk)
        except Exception:
            pass

        # ใช้ UIAutomationInitializerInThread เพื่อป้องกัน COM Error ใน Thread
        try:
            with auto.UIAutomationInitializerInThread():
                self._run_scan_inner()
        except Exception as e:
            self.log(f"ข้อผิดพลาด COM Initializer: {e}", "WARN")
            self._run_scan_inner()

    def _run_scan_inner(self):
        screen_w = user32.GetSystemMetrics(0)
        screen_h = user32.GetSystemMetrics(1)
        
        # เก็บสถานะของแต่ละ HWND เพื่อจับ transition และไม่บล็อกถาวร
        active_toast_states = {}

        while self.is_running:
            try:
                # ตรวจสอบและ attach Desktop ให้ thread เสมอ
                hdesk = None
                try:
                    hwinst = user32.OpenWindowStationW("WinSta0", False, 0x037F)
                    if hwinst:
                        user32.SetProcessWindowStation(hwinst)
                    hdesk = user32.OpenDesktopW("default", 0, False, 0x01FF)
                    if hdesk:
                        user32.SetThreadDesktop(hdesk)
                except Exception:
                    pass

                candidate_hwnds = []
                seen_hwnds = set()

                def inspect_hwnd(hwnd):
                    if hwnd in seen_hwnds:
                        return
                    seen_hwnds.add(hwnd)

                    if not user32.IsWindowVisible(hwnd):
                        return

                    rect = wintypes.RECT()
                    user32.GetWindowRect(hwnd, ctypes.byref(rect))
                    w = rect.right - rect.left
                    h = rect.bottom - rect.top

                    # ป๊อปอัปแจ้งเตือนของ LINE Desktop มีขนาดกะทัดรัด (กว้าง 60-600, สูง 25-350)
                    if w < 60 or w > 600 or h < 25 or h > 350:
                        return

                    pid = wintypes.DWORD()
                    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                    proc_name = get_process_name_by_pid(pid.value)

                    cls_buf = ctypes.create_unicode_buffer(256)
                    user32.GetClassNameW(hwnd, cls_buf, 256)
                    cls_name = cls_buf.value
                    cls_lower = cls_name.lower()

                    title_buf = ctypes.create_unicode_buffer(256)
                    user32.GetWindowTextW(hwnd, title_buf, 256)
                    title_name = title_buf.value
                    title_lower = title_name.lower()

                    # ต้องเป็น process line.exe หรือชื่อหน้าต่าง/คลาสที่เกี่ยวข้องกับ LINE หรือ ToolTip
                    is_line = (proc_name == "line.exe" or "line" in proc_name or "line" in title_lower or
                               "qt663" in cls_lower or "tooltipsavebits" in cls_lower or "tooltip" in cls_lower or "toast" in cls_lower)
                    if not is_line:
                        return

                    candidate_hwnds.append((hwnd, cls_name, title_name, (rect.left, rect.top, rect.right, rect.bottom)))

                def enum_cb(hwnd, lparam):
                    inspect_hwnd(hwnd)
                    return True

                WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
                cb_func = WNDENUMPROC(enum_cb)
                if hdesk:
                    user32.EnumDesktopWindows(hdesk, cb_func, 0)
                user32.EnumWindows(cb_func, 0)

                now = time.time()

                # ล้างสถานะ HWND ที่ปิด/ซ่อนไปแล้วเกิน 20 วินาที
                candidate_hwnd_set = {item[0] for item in candidate_hwnds}
                for h in list(active_toast_states.keys()):
                    if isinstance(h, int) and (h not in candidate_hwnd_set or not user32.IsWindowVisible(h)):
                        if now - active_toast_states[h].get("sent_time", now) > 20:
                            del active_toast_states[h]

                # ตรวจจับข้อความและยอดเงินจากหน้าต่างป๊อปอัปที่แสดงอยู่
                for hwnd, cls_name, title_name, rect_coords in candidate_hwnds:
                    # หาก HWND นี้เคยส่งข้อมูลไปแล้วขณะที่ยังแสดงอยู่บนหน้าจอ ข้ามทันที (ป้องกันส่งซ้ำ)
                    if hwnd in active_toast_states and active_toast_states[hwnd].get("sent"):
                        continue

                    # 1. ลองดึงข้อความผ่าน UI Automation
                    extracted_texts = []
                    if title_name and title_name.lower() != "line":
                        extracted_texts.append(title_name)
                    try:
                        ctrl = auto.ControlFromHandle(hwnd)
                        if ctrl:
                            if ctrl.Name and ctrl.Name not in extracted_texts:
                                extracted_texts.append(ctrl.Name)
                            for ch in ctrl.GetChildren():
                                if ch.Name and ch.Name not in extracted_texts:
                                    extracted_texts.append(ch.Name)
                    except Exception:
                        pass

                    full_text = " ".join(extracted_texts).strip()

                    # 2. หาก UI Automation ไม่พบข้อความยอดเงิน -> ใช้ Fast OCR ภาพหน้าต่างป๊อปอัป (~5-15ms)
                    amt_candidate = extract_amount(full_text, is_bank_context=("line" in cls_name.lower() or "line" in title_name.lower()))
                    if not amt_candidate:
                        tmp_img = os.path.join(tempfile.gettempdir(), f"dormease_toast_{hwnd}.png")
                        try:
                            if capture_window_to_file(hwnd, tmp_img):
                                ocr_text = ocr_image_file(tmp_img)
                                if ocr_text:
                                    full_text = (full_text + " " + ocr_text).strip()
                        finally:
                            if os.path.exists(tmp_img):
                                try:
                                    os.remove(tmp_img)
                                except:
                                    pass

                    # 3. วิเคราะห์ยอดเงินและธนาคาร
                    amt = extract_amount(full_text, is_bank_context=True)
                    if not amt or amt <= 0:
                        continue

                    detected_bank = detect_bank(full_text)
                    text_hash = hash(full_text)

                    # ป้องกันการส่งซ้ำสำหรับยอดเดียวกันภายใน 15 วินาที
                    amt_key = f"amt_{amt:.2f}"
                    last_amt_time = active_toast_states.get(amt_key, {}).get("sent_time", 0)
                    if now - last_amt_time < 15:
                        continue

                    # สร้าง Notification ID
                    notif_id = f"LINE-{int(now)}-{int(amt * 100)}-{abs(text_hash) % 100000}"

                    # ส่งข้อมูลไปยัง Backend API เพื่อตัดยอดบิล
                    self.send_to_api(full_text, amount=amt, bank=detected_bank, notif_id=notif_id)

                    # บันทึกว่าป๊อปอัป HWND นี้ถูกส่งแล้ว
                    active_toast_states[hwnd] = {
                        "sent": True,
                        "last_hash": text_hash,
                        "last_amt": amt,
                        "sent_time": now
                    }
                    active_toast_states[amt_key] = {
                        "sent_time": now
                    }

            except Exception:
                pass

            time.sleep(0.4)

    def _toast_loop(self):
        """ลูปตรวจจับ Windows UserNotificationListener (กรณีมีแจ้งเตือน Action Center / Toast)"""
        ps_script = os.path.join(SCRIPT_DIR, "payment_listener.ps1")
        if not os.path.exists(ps_script):
            return

        # เริ่มต้น subprocess payment_listener.ps1 แบบไม่มีหน้าต่าง (ซ่อนเบื้องหลัง)
        try:
            creationflags = 0x08000000 # CREATE_NO_WINDOW
            cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", f"& '{ps_script}' *>&1"]
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                creationflags=creationflags,
                text=True,
                encoding="utf-8",
                errors="replace"
            )

            while self.is_running and proc.poll() is None:
                line = proc.stdout.readline()
                if line:
                    line_s = line.strip()
                    if any(k in line_s for k in ["[DETECTED]", "[SUCCESS]", "[REVIEW]", "[MATCHED", "PAID", "[PARSER]"]):
                        self.log(line_s, "TOAST")
                time.sleep(0.2)

            if proc.poll() is None:
                proc.terminate()
        except Exception:
            pass

# ==============================================================================
# 5. หน้าต่าง GUI ควบคุม (Dashboard GUI)
# ==============================================================================
class ListenerAppGUI:
    def __init__(self, service):
        self.service = service
        self.root = None
        self.tray_icon = None
        self.setup_gui()
        self.setup_tray()

    def setup_gui(self):
        self.root = tk.Tk()
        self.root.title("💬 DormEase — LINE & Multi-Bank Payment Listener")
        self.root.geometry("680x560")
        self.root.minsize(580, 480)
        self.root.configure(bg="#f8faf9")

        # Header Frame
        header = tk.Frame(self.root, bg="#0f5144", height=75)
        header.pack(fill=tk.X)
        header.pack_propagate(False)

        title_lbl = tk.Label(
            header,
            text="🏠 DormEase — LINE Desktop Payment Listener",
            font=("Segoe UI", 15, "bold"),
            fg="#ffffff",
            bg="#0f5144"
        )
        title_lbl.pack(anchor="w", padx=20, pady=(12, 2))

        sub_lbl = tk.Label(
            header,
            text="ตรวจจับการแจ้งเตือนเงินเข้า LINE Desktop ป๊อปอัปสีขาว • เฉพาะไลน์แจ้งเตือนของธนาคารเท่านั้น",
            font=("Segoe UI", 9),
            fg="#a9cfc4",
            bg="#0f5144"
        )
        sub_lbl.pack(anchor="w", padx=20)

        # Status & Quick Controls Bar
        ctrl_bar = tk.Frame(self.root, bg="#ffffff", height=50, bd=1, relief=tk.SOLID)
        ctrl_bar.pack(fill=tk.X, padx=16, pady=12)

        self.status_lbl = tk.Label(
            ctrl_bar,
            text="🟢 สถานะ: กำลังตรวจจับอัตโนมัติ (Active)",
            font=("Segoe UI", 10, "bold"),
            fg="#059669",
            bg="#ffffff"
        )
        self.status_lbl.pack(side=tk.LEFT, padx=14, pady=12)

        btn_min = tk.Button(
            ctrl_bar,
            text="📌 ย่อลง System Tray ข้างนาฬิกา",
            font=("Segoe UI", 9, "bold"),
            bg="#e8f3ef",
            fg="#0f5144",
            bd=0,
            padx=10,
            pady=4,
            cursor="hand2",
            command=self.minimize_to_tray
        )
        btn_min.pack(side=tk.RIGHT, padx=10, pady=8)

        # Quick Test Bar
        test_frame = tk.LabelFrame(self.root, text=" 🧪 จำลองทดสอบเงินเข้า (ทุกแอปธนาคาร) ", font=("Segoe UI", 9, "bold"), bg="#f8faf9", fg="#374151")
        test_frame.pack(fill=tk.X, padx=16, pady=(0, 10))

        test_btns = [
            ("KTB Connext (1.00 ฿)", "Krungthai Connext: เงินเข้า: 1.00 บาท เข้าบัญชี 099-614-4478", "krungthai", 1.0),
            ("KTB Connext (3,500 ฿)", "Krungthai Connext: เงินเข้า 3,500.00 บาท", "krungthai", 3500),
            ("SCB Connect (4,500 ฿)", "SCB Connect: เงินเข้าบัญชี จำนวน 4,500.00 บาท", "scb", 4500),
            ("KBank Live (3,850 ฿)", "KBank Live: รับเงินโอน 3,850.00 บาท", "kbank", 3850),
            ("พร้อมเพย์ (1.00 ฿)", "PromptPay: รับเงินพร้อมเพย์ 1.00 บาท", "promptpay", 1.0),
        ]

        btn_row = tk.Frame(test_frame, bg="#f8faf9")
        btn_row.pack(fill=tk.X, padx=10, pady=8)

        for label, msg, bank, amt in test_btns:
            b = tk.Button(
                btn_row,
                text=label,
                font=("Segoe UI", 8),
                bg="#ffffff",
                fg="#1f2937",
                bd=1,
                padx=6,
                pady=4,
                cursor="hand2",
                command=lambda m=msg, a=amt, bk=bank: self.service.send_to_api(m, amount=a, bank=bk)
            )
            b.pack(side=tk.LEFT, padx=3)

        # Activity Log Area
        log_frame = tk.LabelFrame(self.root, text=" 📋 บันทึกการทำงานเรียลไทม์ (Live Activity Log) ", font=("Segoe UI", 9, "bold"), bg="#f8faf9", fg="#374151")
        log_frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=(0, 12))

        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            font=("Consolas", 9),
            bg="#ffffff",
            fg="#1f2937",
            wrap=tk.WORD,
            bd=0
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        # Bottom Bar
        bottom_bar = tk.Frame(self.root, bg="#f8faf9")
        bottom_bar.pack(fill=tk.X, padx=16, pady=(0, 10))

        btn_web = tk.Button(
            bottom_bar,
            text="🌐 เปิดหน้าบิลหอพัก DormEase",
            font=("Segoe UI", 9),
            bg="#0f5144",
            fg="#ffffff",
            bd=0,
            padx=12,
            pady=5,
            cursor="hand2",
            command=lambda: webbrowser.open("http://localhost:5173/monthly-bills")
        )
        btn_web.pack(side=tk.LEFT)

        btn_clear = tk.Button(
            bottom_bar,
            text="ล้างประวัติหน้าจอ",
            font=("Segoe UI", 9),
            bg="#e5e7eb",
            fg="#374151",
            bd=0,
            padx=8,
            pady=5,
            cursor="hand2",
            command=lambda: self.log_text.delete("1.0", tk.END)
        )
        btn_clear.pack(side=tk.RIGHT)

        # ตั้งค่า Event ปิดหน้าต่างให้ย่อลง Tray แทนการปิดโปรแกรม
        self.root.protocol("WM_DELETE_WINDOW", self.minimize_to_tray)

    def setup_tray(self):
        icon_img = create_tray_image()

        menu = pystray.Menu(
            pystray.MenuItem("📊 เปิดหน้าต่างควบคุม (Dashboard)", self.show_window, default=True),
            pystray.MenuItem("🟢 ตรวจจับอัตโนมัติ: ทำงานอยู่", None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("🧪 ทดสอบจำลองเงินเข้า 1.00 บาท", lambda: self.service.send_to_api("Krungthai Connext: เงินเข้า: 1.00 บาท", 1.0, "krungthai")),
            pystray.MenuItem("🌐 เปิดหน้าเว็บ DormEase", lambda: webbrowser.open("http://localhost:5173/monthly-bills")),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("❌ ปิดโปรแกรม (Exit)", self.exit_app)
        )

        self.tray_icon = pystray.Icon(
            "DormEase_Listener",
            icon_img,
            "DormEase — LINE Payment Listener (ทุกธนาคาร)",
            menu
        )

    def append_log(self, text):
        if self.root:
            def do_append():
                self.log_text.insert(tk.END, text + "\n")
                self.log_text.see(tk.END)
            self.root.after(0, do_append)

    def on_payment_match(self, res, amount):
        if self.tray_icon:
            room = res.get("room_number", "")
            tenant = res.get("tenant_name", "")
            title = f"✓ อนุมัติสำเร็จ! บิลห้อง {room}"
            msg = f"ยอดเงิน {amount:,.2f} ฿ ({tenant}) สถานะ PAID เรียบร้อยแล้ว"
            try:
                self.tray_icon.notify(msg, title)
            except:
                pass

    def minimize_to_tray(self):
        self.root.withdraw()
        if self.tray_icon:
            try:
                self.tray_icon.notify(
                    "โปรแกรมกำลังทำงานเงียบๆ ที่ System Tray ข้างนาฬิกา",
                    "DormEase Payment Listener"
                )
            except:
                pass

    def show_window(self):
        if self.root:
            self.root.after(0, lambda: (self.root.deiconify(), self.root.lift(), self.root.focus_force()))

    def exit_app(self):
        self.service.stop()
        if self.tray_icon:
            self.tray_icon.stop()
        if self.root:
            self.root.after(0, self.root.destroy)

    def run(self):
        tray_thread = threading.Thread(target=self.tray_icon.run, daemon=True)
        tray_thread.start()
        self.service.start()
        self.root.mainloop()

# ==============================================================================
# 6. Main Entry Point
# ==============================================================================
if __name__ == "__main__":
    service = PaymentListenerService()
    app = ListenerAppGUI(service)

    service.on_log = app.append_log
    service.on_match = app.on_payment_match

    app.run()
