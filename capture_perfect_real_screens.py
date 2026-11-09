# -*- coding: utf-8 -*-
import os
import time
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "real_screenshots")
os.makedirs(OUTPUT_DIR, exist_ok=True)

edge_options = Options()
edge_options.add_argument("--headless=new")
edge_options.add_argument("--window-size=1440,900")
edge_options.add_argument("--disable-gpu")
edge_options.add_argument("--no-sandbox")

print("Launching Edge browser...")
driver = webdriver.Edge(options=edge_options)

try:
    print("1. Loading Login page...")
    driver.get("http://localhost:5173/login")
    time.sleep(4.5) # Wait for initial IntroScreen
    
    # Capture Login Page
    p_login = os.path.join(OUTPUT_DIR, "real_login.png")
    driver.save_screenshot(p_login)
    print(f"Captured: {p_login}")

    # Log in as Owner
    print("2. Submitting Owner credentials...")
    email_el = driver.find_element(By.XPATH, "//input[@type='email']")
    pass_el = driver.find_element(By.XPATH, "//input[@type='password']")
    email_el.clear()
    email_el.send_keys("demo_owner@dormease.com")
    pass_el.clear()
    pass_el.send_keys("password123")
    
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    time.sleep(4.0) # Wait for dashboard

    # 1. Dashboard
    p_dash = os.path.join(OUTPUT_DIR, "real_1_dashboard.png")
    driver.save_screenshot(p_dash)
    print(f"Captured: {p_dash} (URL: {driver.current_url})")

    # 2. Rooms (via client-side link)
    print("3. Clicking Rooms menu...")
    link_rooms = driver.find_element(By.XPATH, "//a[@href='/rooms']")
    link_rooms.click()
    time.sleep(2.5)
    p_rooms = os.path.join(OUTPUT_DIR, "real_2_rooms.png")
    driver.save_screenshot(p_rooms)
    print(f"Captured: {p_rooms}")

    # 3. Monthly Bills
    print("4. Clicking Monthly Bills menu...")
    link_bills = driver.find_element(By.XPATH, "//a[@href='/monthly-bills']")
    link_bills.click()
    time.sleep(2.5)
    p_bills = os.path.join(OUTPUT_DIR, "real_3_monthly_bills.png")
    driver.save_screenshot(p_bills)
    print(f"Captured: {p_bills}")

    # 4. Payments
    print("5. Clicking Payments menu...")
    link_pay = driver.find_element(By.XPATH, "//a[@href='/payments']")
    link_pay.click()
    time.sleep(2.5)
    p_pay = os.path.join(OUTPUT_DIR, "real_4_payments.png")
    driver.save_screenshot(p_pay)
    print(f"Captured: {p_pay}")

    # 5. Repairs
    print("6. Clicking Repairs menu...")
    link_rep = driver.find_element(By.XPATH, "//a[@href='/repairs']")
    link_rep.click()
    time.sleep(2.5)
    p_rep = os.path.join(OUTPUT_DIR, "real_5_repairs.png")
    driver.save_screenshot(p_rep)
    print(f"Captured: {p_rep}")

    # 6. Notifications
    print("7. Clicking Notifications menu...")
    link_notif = driver.find_element(By.XPATH, "//a[@href='/notifications']")
    link_notif.click()
    time.sleep(2.5)
    p_notif = os.path.join(OUTPUT_DIR, "real_6_notifications.png")
    driver.save_screenshot(p_notif)
    print(f"Captured: {p_notif}")

    print("ALL 6 REAL SCREENSHOTS CAPTURED BEAUTIFULLY!")

finally:
    driver.quit()
