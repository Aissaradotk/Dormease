# -*- coding: utf-8 -*-
"""
DormEase - เครื่องมือจำลองการแจ้งเตือนเงินเข้า LINE / ธนาคาร (Windows Desktop)
จำลอง Windows Toast Notification และส่งยอดเงินเข้า Backend เพื่ออนุมัติบิลอัตโนมัติ
"""

import sys
import os
import json
import urllib.request
import urllib.error
import subprocess
import threading
import webbrowser
import tkinter as tk
from tkinter import ttk, messagebox

API_BASE = "http://119.59.102.161:3007"
WEB_URL = "http://localhost:5173/monthly-bills"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SIMULATE_PS1 = os.path.join(SCRIPT_DIR, "simulate_toast.ps1")

class PaymentSimulatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("💬 DormEase - จำลองการแจ้งเตือนเงินเข้า LINE / ธนาคาร")
        self.root.geometry("640x720")
        self.root.resizable(False, False)
        self.root.configure(bg="#f4f6f9")

        # Set App Icon if available
        try:
            self.root.iconbitmap(default="")
        except:
            pass

        self.amount_var = tk.StringVar(value="3700.00")
        self.bank_var = tk.StringVar(value="Krungthai Connext")
        self.status_var = tk.StringVar(value="พร้อมทดสอบการแจ้งเตือนเงินเข้า")
        self.backend_status = tk.StringVar(value="⏳ กำลังตรวจสอบสถานะเซิร์ฟเวอร์...")

        self.setup_ui()
        self.check_backend_async()
        self.fetch_unpaid_bills_async()

    def setup_ui(self):
        # Header Frame
        header = tk.Frame(self.root, bg="#06C755", height=90)
        header.pack(fill=tk.X)
        header.pack_propagate(False)

        title_lbl = tk.Label(
            header,
            text="💬 LINE • Krungthai Connext",
            font=("Segoe UI", 16, "bold"),
            fg="#ffffff",
            bg="#06C755"
        )
        title_lbl.pack(anchor="w", padx=20, pady=(12, 2))

        subtitle_lbl = tk.Label(
            header,
            text="ระบบจำลองการเด้งแจ้งเตือนเงินเข้าบน Windows ➔ ส่งเข้าเว็บหอพักเพื่ออนุมัติบิลอัตโนมัติ",
            font=("Segoe UI", 10),
            fg="#e8fbee",
            bg="#06C755"
        )
        subtitle_lbl.pack(anchor="w", padx=20)

        # Connection Banner
        banner_frame = tk.Frame(self.root, bg="#ffffff", bd=1, relief=tk.SOLID)
        banner_frame.pack(fill=tk.X, padx=16, pady=10)

        self.conn_lbl = tk.Label(
            banner_frame,
            textvariable=self.backend_status,
            font=("Segoe UI", 9, "bold"),
            fg="#059669",
            bg="#ffffff",
            pady=6
        )
        self.conn_lbl.pack()

        # Main Content Frame
        main_frame = tk.Frame(self.root, bg="#f4f6f9")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=16)

        # Section 1: Presets
        sec1 = tk.LabelFrame(
            main_frame,
            text=" ⚡ 1. เลือกยอดยอดนิยมที่ต้องการทดสอบ ",
            font=("Segoe UI", 10, "bold"),
            bg="#ffffff",
            fg="#1e293b",
            padx=12,
            pady=10
        )
        sec1.pack(fill=tk.X, pady=(0, 10))

        presets_frame = tk.Frame(sec1, bg="#ffffff")
        presets_frame.pack(fill=tk.X)

        btn_p1 = tk.Button(
            presets_frame,
            text="🏠 ห้อง 333 (3,700 ฿)\nงวดเดือนปัจจุบัน",
            font=("Segoe UI", 9, "bold"),
            bg="#eff6ff",
            fg="#1d4ed8",
            activebackground="#dbeafe",
            bd=1,
            relief=tk.SOLID,
            cursor="hand2",
            padx=8,
            pady=6,
            command=lambda: self.set_amount("3700.00")
        )
        btn_p1.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=3)

        btn_p2 = tk.Button(
            presets_frame,
            text="🏠 ห้อง 202 (4,700 ฿)\nงวดประจำเดือน",
            font=("Segoe UI", 9, "bold"),
            bg="#eff6ff",
            fg="#1d4ed8",
            activebackground="#dbeafe",
            bd=1,
            relief=tk.SOLID,
            cursor="hand2",
            padx=8,
            pady=6,
            command=lambda: self.set_amount("4700.00")
        )
        btn_p2.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=3)

        btn_p3 = tk.Button(
            presets_frame,
            text="🛡️ ค่าแรกเข้า/ประกัน (6,500 ฿)\nย้ายเข้าใหม่",
            font=("Segoe UI", 9, "bold"),
            bg="#eff6ff",
            fg="#1d4ed8",
            activebackground="#dbeafe",
            bd=1,
            relief=tk.SOLID,
            cursor="hand2",
            padx=8,
            pady=6,
            command=lambda: self.set_amount("6500.00")
        )
        btn_p3.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=3)

        # Section 2: Input Amount & Bank
        sec2 = tk.LabelFrame(
            main_frame,
            text=" 💰 2. ข้อมูลการโอนเงิน (กำหนดเอง) ",
            font=("Segoe UI", 10, "bold"),
            bg="#ffffff",
            fg="#1e293b",
            padx=12,
            pady=10
        )
        sec2.pack(fill=tk.X, pady=(0, 10))

        row1 = tk.Frame(sec2, bg="#ffffff")
        row1.pack(fill=tk.X, pady=4)

        tk.Label(row1, text="ยอดเงินโอน (บาท):", font=("Segoe UI", 10), bg="#ffffff", width=18, anchor="w").pack(side=tk.LEFT)
        ent_amt = tk.Entry(row1, textvariable=self.amount_var, font=("Segoe UI", 12, "bold"), width=15, justify="center")
        ent_amt.pack(side=tk.LEFT, padx=6)
        tk.Label(row1, text="บาท (THB)", font=("Segoe UI", 9), bg="#ffffff", fg="#64748b").pack(side=tk.LEFT)

        row2 = tk.Frame(sec2, bg="#ffffff")
        row2.pack(fill=tk.X, pady=4)

        tk.Label(row2, text="ช่องทางการแจ้งเตือน:", font=("Segoe UI", 10), bg="#ffffff", width=18, anchor="w").pack(side=tk.LEFT)
        bank_combo = ttk.Combobox(
            row2,
            textvariable=self.bank_var,
            values=[
                "Krungthai Connext",
                "K PLUS (กสิกรไทย)",
                "SCB EASY (ไทยพาณิชย์)",
                "PromptPay (พร้อมเพย์)"
            ],
            state="readonly",
            font=("Segoe UI", 9),
            width=20
        )
        bank_combo.pack(side=tk.LEFT, padx=6)

        # Section 3: Unpaid Bills Box
        self.sec3 = tk.LabelFrame(
            main_frame,
            text=" 📋 บิลค้างชำระในระบบขณะนี้ (คลิกเพื่อเลือกยอด) ",
            font=("Segoe UI", 9, "bold"),
            bg="#ffffff",
            fg="#475569",
            padx=8,
            pady=6
        )
        self.sec3.pack(fill=tk.X, pady=(0, 10))

        self.bills_container = tk.Frame(self.sec3, bg="#ffffff")
        self.bills_container.pack(fill=tk.X)
        self.render_unpaid_bills([])

        # Big Fire Button
        self.btn_fire = tk.Button(
            main_frame,
            text="🔔 ยิงแจ้งเตือน LINE เด้งบนจอ Windows & อนุมัติทันที",
            font=("Segoe UI", 12, "bold"),
            bg="#06C755",
            fg="#ffffff",
            activebackground="#05a847",
            activeforeground="#ffffff",
            bd=0,
            cursor="hand2",
            padx=16,
            pady=12,
            command=self.trigger_simulation
        )
        self.btn_fire.pack(fill=tk.X, pady=(0, 10))

        # Result Display Box
        res_frame = tk.LabelFrame(
            main_frame,
            text=" 📊 ผลการตรวจสอบและอนุมัติในระบบ ",
            font=("Segoe UI", 9, "bold"),
            bg="#ffffff",
            fg="#475569",
            padx=12,
            pady=8
        )
        res_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 8))

        self.txt_result = tk.Text(
            res_frame,
            height=5,
            font=("Consolas", 10),
            bg="#f8fafc",
            fg="#0f172a",
            bd=0,
            wrap=tk.WORD,
            padx=8,
            pady=6
        )
        self.txt_result.pack(fill=tk.BOTH, expand=True)
        self.txt_result.insert(tk.END, "👉 กดปุ่ม 'ยิงแจ้งเตือน LINE' ด้านบนเพื่อเริ่มการทดสอบจำลอง\n")
        self.txt_result.config(state=tk.DISABLED)

        # Bottom Utilities Frame
        btm_frame = tk.Frame(self.root, bg="#f4f6f9")
        btm_frame.pack(fill=tk.X, padx=16, pady=(0, 12))

        btn_reset = tk.Button(
            btm_frame,
            text="🔄 รีเซ็ตบิลทดสอบทั้งหมด (333, 202, 101, ค่าแรกเข้า)",
            font=("Segoe UI", 9),
            bg="#ffffff",
            fg="#d97706",
            bd=1,
            relief=tk.SOLID,
            cursor="hand2",
            padx=8,
            pady=4,
            command=self.reset_demo_bill
        )
        btn_reset.pack(side=tk.LEFT)

        btn_open = tk.Button(
            btm_frame,
            text="🌐 เปิดดูเว็บหอพัก DormEase",
            font=("Segoe UI", 9, "bold"),
            bg="#ffffff",
            fg="#2563eb",
            bd=1,
            relief=tk.SOLID,
            cursor="hand2",
            padx=8,
            pady=4,
            command=lambda: webbrowser.open(WEB_URL)
        )
        btn_open.pack(side=tk.RIGHT)

    def set_amount(self, val):
        self.amount_var.set(val)

    def update_result_text(self, text, color="#0f172a"):
        self.txt_result.config(state=tk.NORMAL)
        self.txt_result.delete("1.0", tk.END)
        self.txt_result.insert(tk.END, text)
        self.txt_result.config(fg=color, state=tk.DISABLED)

    def check_backend_async(self):
        def worker():
            try:
                req = urllib.request.Request(f"{API_BASE}/api/payment/notification/status")
                with urllib.request.urlopen(req, timeout=3) as res:
                    if res.status == 200:
                        self.root.after(0, lambda: self.backend_status.set("🟢 ระบบ DormEase เชื่อมต่อสมบูรณ์ (Online: 119.59.102.161:3007)"))
                        return
            except:
                pass
            self.root.after(0, lambda: self.backend_status.set("⚠️ เซิร์ฟเวอร์ Backend กำลังรีสตาร์ท กรุณารอสักครู่..."))

        threading.Thread(target=worker, daemon=True).start()

    def fetch_unpaid_bills_async(self):
        def worker():
            try:
                req = urllib.request.Request(f"{API_BASE}/api/payment/notification/unpaid-bills")
                with urllib.request.urlopen(req, timeout=4) as res:
                    data = json.loads(res.read().decode("utf-8"))
                    bills = data.get("bills", [])
                    move_ins = data.get("move_in_payments", [])
                    self.root.after(0, lambda: self.render_unpaid_bills(bills, move_ins))
            except Exception as e:
                pass

        threading.Thread(target=worker, daemon=True).start()

    def render_unpaid_bills(self, bills, move_ins=None):
        for widget in self.bills_container.winfo_children():
            widget.destroy()

        if not bills and not move_ins:
            lbl = tk.Label(
                self.bills_container,
                text="ขณะนี้ไม่มีบิลค้างชำระ (สามารถกดปุ่ม 'รีเซ็ตบิลห้อง 333' ด้านล่างเพื่อเริ่มทดสอบ)",
                font=("Segoe UI", 9),
                fg="#64748b",
                bg="#ffffff"
            )
            lbl.pack(pady=4)
            return

        for b in bills:
            amt = float(b.get("total_amount", 0))
            room = b.get("room_number", "-")
            tenant = b.get("tenant_name") or "ผู้เช่า"
            period = b.get("period", "-")

            btn = tk.Button(
                self.bills_container,
                text=f"👉 ห้อง {room} ({tenant}) | งวด {period} | ยอด {amt:,.2f} ฿",
                font=("Segoe UI", 9),
                bg="#f1f5f9",
                fg="#0f172a",
                bd=0,
                anchor="w",
                cursor="hand2",
                padx=6,
                pady=2,
                command=lambda a=str(amt): self.set_amount(a)
            )
            btn.pack(fill=tk.X, pady=1)

        if move_ins:
            for m in move_ins:
                amt = float(m.get("paid_amount") or m.get("total_amount") or 0)
                room = m.get("room_number", "-")
                tenant = m.get("tenant_name") or "ผู้เช่าใหม่"
                btn = tk.Button(
                    self.bills_container,
                    text=f"👉 ค่าแรกเข้า ห้อง {room} ({tenant}) | ยอด {amt:,.2f} ฿ (รออนุมัติ)",
                    font=("Segoe UI", 9),
                    bg="#fef3c7",
                    fg="#92400e",
                    bd=0,
                    anchor="w",
                    cursor="hand2",
                    padx=6,
                    pady=2,
                    command=lambda a=str(amt): self.set_amount(a)
                )
                btn.pack(fill=tk.X, pady=1)

    def trigger_simulation(self):
        amt_str = self.amount_var.get().strip().replace(",", "")
        try:
            amt = float(amt_str)
            if amt <= 0:
                raise ValueError()
        except:
            messagebox.showerror("ยอดเงินไม่ถูกต้อง", "กรุณาระบุจำนวนเงินเป็นตัวเลขที่ถูกต้อง (เช่น 3700 หรือ 4000.00)")
            return

        bank = self.bank_var.get()
        self.btn_fire.config(state=tk.DISABLED, text="⏳ กำลังยิงการแจ้งเตือน...")
        self.update_result_text("กำลังส่งการแจ้งเตือนไปยัง Windows และระบบ DormEase...", "#2563eb")

        def worker():
            # 1. Fire Windows Toast Notification
            try:
                if os.path.exists(SIMULATE_PS1):
                    subprocess.run(
                        [
                            "powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
                            "-File", SIMULATE_PS1,
                            "-Amount", str(amt),
                            "-Bank", bank
                        ],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
            except Exception as e:
                print("Toast error:", e)

            # 2. Call Backend API
            api_res = None
            try:
                payload = json.dumps({
                    "amount": amt,
                    "source": "line_connext",
                    "bank": "krungthai" if "krungthai" in bank.lower() else "bank_transfer",
                    "raw_message": f"[{bank}] เงินเข้า {amt:,.2f} บาท จาก บัญชี xxx-x-xx123-x เข้าบัญชี 099-614-4478 (DormEase Residence)"
                }).encode("utf-8")

                req = urllib.request.Request(
                    f"{API_BASE}/api/payment/notification/test",
                    data=payload,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=8) as response:
                    api_res = json.loads(response.read().decode("utf-8"))
            except Exception as ex:
                api_res = {"status": "ERROR", "message": str(ex)}

            # Update UI on main thread
            self.root.after(0, lambda: self.handle_api_result(api_res, amt, bank))

        threading.Thread(target=worker, daemon=True).start()

    def handle_api_result(self, res, amt, bank):
        self.btn_fire.config(state=tk.NORMAL, text="🔔 ยิงแจ้งเตือน LINE เด้งบนจอ Windows & อนุมัติทันที")
        self.fetch_unpaid_bills_async()

        status = res.get("status")
        msg = res.get("message", "")
        room = res.get("room_number")
        tenant = res.get("tenant_name")
        pay_type = res.get("type")

        if status == "PAID":
            res_str = (
                f"🎉 [สำเร็จ 100%] ได้รับการอนุมัติอัตโนมัติแล้ว!\n"
                f"--------------------------------------------------\n"
                f"• การแจ้งเตือน: LINE ({bank}) -> เงินเข้า {amt:,.2f} บาท\n"
                f"• ประเภทรายการ: {'ค่าแรกเข้า / ประกันห้องพัก' if pay_type == 'MOVE_IN_PAYMENT' else 'บิลค่าห้องประจำเดือน'}\n"
                f"• ห้องพัก: {room or '-'}\n"
                f"• ผู้เช่า: {tenant or '-'}\n"
                f"• สถานะในเว็บ: ✓ ชำระแล้ว (PAID) อัตโนมัติทันที!\n"
                f"--------------------------------------------------\n"
                f"กดปุ่ม 'เปิดดูเว็บหอพัก DormEase' ด้านล่างเพื่อดูผลลัพธ์บนหน้าจอเว็บได้ทันที"
            )
            self.update_result_text(res_str, "#059669")
        elif status == "MANUAL_REVIEW":
            res_str = (
                f"⚠️ [เข้าคิวตรวจสอบ Manual Review]\n"
                f"--------------------------------------------------\n"
                f"• ยอดเงินที่แจ้ง: {amt:,.2f} บาท จาก {bank}\n"
                f"• ผลการตรวจ: ไม่พบบิลหรือค่าแรกเข้าที่ค้างชำระตรงกับยอดนี้\n"
                f"• สถานะในระบบ: บันทึกเข้าคิวตรวจสอบด้วยตนเองในระบบเรียบร้อยแล้ว\n"
                f"--------------------------------------------------\n"
                f"คำแนะนำ: กดปุ่ม 'รีเซ็ตบิลห้อง 333 (฿3,700)' ด้านล่าง แล้วยิงยอด 3,700 ฿ เพื่อทดสอบการอนุมัติสำเร็จ"
            )
            self.update_result_text(res_str, "#d97706")
        else:
            self.update_result_text(f"❌ เกิดข้อผิดพลาด: {msg}", "#dc2626")

    def reset_demo_bill(self):
        def worker():
            try:
                payload = json.dumps({"bill_id": "all"}).encode("utf-8")
                req = urllib.request.Request(
                    f"{API_BASE}/api/payment/notification/reset-demo",
                    data=payload,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=5) as res:
                    data = json.loads(res.read().decode("utf-8"))
                    self.root.after(0, lambda: self.on_reset_complete(data))
            except Exception as e:
                self.root.after(0, lambda: messagebox.showerror("ข้อผิดพลาด", f"ไม่สามารถรีเซ็ตบิลได้: {e}"))

        threading.Thread(target=worker, daemon=True).start()

    def on_reset_complete(self, data):
        self.amount_var.set("3700.00")
        self.fetch_unpaid_bills_async()
        self.update_result_text(
            "✅ รีเซ็ตบิลทดสอบทุกห้อง (333, 202, 101) และค่าแรกเข้า (6,500) เป็นสถานะ 'ยังไม่จ่าย' เรียบร้อยแล้ว!\n"
            "👉 ตอนนี้คุณสามารถคลิกเลือกบิลในรายการ หรือกดปุ่มสีเขียวด้านบนเพื่อทดสอบการแจ้งเตือนเงินเข้าได้ทันที",
            "#059669"
        )
        messagebox.showinfo("รีเซ็ตสำเร็จ", "รีเซ็ตบิลทดสอบทุกห้องกลับเป็น 'ยังไม่จ่าย' เรียบร้อยแล้ว\nพร้อมสำหรับการทดสอบการแจ้งเตือนเงินเข้าครับ!")

if __name__ == "__main__":
    root = tk.Tk()
    app = PaymentSimulatorApp(root)
    root.mainloop()
