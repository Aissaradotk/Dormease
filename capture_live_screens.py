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

print("Launching Edge driver...")
driver = webdriver.Edge(options=edge_options)

try:
    print("1. Opening Login page...")
    driver.get("http://localhost:5173/login")
    time.sleep(4.5) # Wait for IntroScreen animation
    
    # Save Login screenshot
    path_login = os.path.join(OUTPUT_DIR, "1_login.png")
    driver.save_screenshot(path_login)
    print(f"Captured: {path_login}")

    # Fill login form
    print("2. Logging in as owner...")
    email_input = driver.find_element(By.XPATH, "//input[@type='email']")
    pass_input = driver.find_element(By.XPATH, "//input[@type='password']")
    email_input.clear()
    email_input.send_keys("demo_owner@dormease.com")
    pass_input.clear()
    pass_input.send_keys("password123")
    
    # Submit form
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    time.sleep(3.5) # Wait for redirect to /dashboard
    
    # Dashboard
    path_dash = os.path.join(OUTPUT_DIR, "2_dashboard.png")
    driver.save_screenshot(path_dash)
    print(f"Captured: {path_dash} (Current URL: {driver.current_url})")

    # Rooms
    print("3. Navigating to /rooms...")
    driver.get("http://localhost:5173/rooms")
    time.sleep(2.5)
    path_rooms = os.path.join(OUTPUT_DIR, "3_rooms.png")
    driver.save_screenshot(path_rooms)
    print(f"Captured: {path_rooms}")

    # Monthly Bills
    print("4. Navigating to /monthly-bills...")
    driver.get("http://localhost:5173/monthly-bills")
    time.sleep(2.5)
    path_bills = os.path.join(OUTPUT_DIR, "4_bills.png")
    driver.save_screenshot(path_bills)
    print(f"Captured: {path_bills}")

    # Payments
    print("5. Navigating to /payments...")
    driver.get("http://localhost:5173/payments")
    time.sleep(2.5)
    path_payments = os.path.join(OUTPUT_DIR, "5_payments.png")
    driver.save_screenshot(path_payments)
    print(f"Captured: {path_payments}")

    # Repairs
    print("6. Navigating to /repairs...")
    driver.get("http://localhost:5173/repairs")
    time.sleep(2.5)
    path_repairs = os.path.join(OUTPUT_DIR, "6_repairs.png")
    driver.save_screenshot(path_repairs)
    print(f"Captured: {path_repairs}")

    # Notifications
    print("7. Navigating to /notifications...")
    driver.get("http://localhost:5173/notifications")
    time.sleep(2.5)
    path_notif = os.path.join(OUTPUT_DIR, "7_notifications.png")
    driver.save_screenshot(path_notif)
    print(f"Captured: {path_notif}")

    print("ALL SCREENSHOTS CAPTURED SUCCESSFULLY!")

finally:
    driver.quit()
