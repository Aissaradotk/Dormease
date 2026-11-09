# -*- coding: utf-8 -*-
import os
import time
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "real_screenshots")

edge_options = Options()
edge_options.add_argument("--headless=new")
edge_options.add_argument("--window-size=1440,900")
edge_options.add_argument("--disable-gpu")
edge_options.add_argument("--no-sandbox")

driver = webdriver.Edge(options=edge_options)

try:
    print("Loading Login page...")
    driver.get("http://localhost:5173/login")
    time.sleep(4.5)

    print("Logging in as Tenant...")
    email_el = driver.find_element(By.XPATH, "//input[@type='email']")
    pass_el = driver.find_element(By.XPATH, "//input[@type='password']")
    email_el.clear()
    email_el.send_keys("demo_tenant@dormease.com")
    pass_el.clear()
    pass_el.send_keys("password123")
    
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    time.sleep(4.0)

    # Tenant Home
    p_thome = os.path.join(OUTPUT_DIR, "real_7_tenant_home.png")
    driver.save_screenshot(p_thome)
    print(f"Captured: {p_thome} (URL: {driver.current_url})")

    # Tenant Payments
    print("Clicking Tenant Payments...")
    try:
        link_pay = driver.find_element(By.XPATH, "//a[@href='/my-payments']")
        link_pay.click()
    except:
        driver.get("http://localhost:5173/my-payments")
        
    time.sleep(4.0)
    p_tpay = os.path.join(OUTPUT_DIR, "real_8_tenant_payment.png")
    driver.save_screenshot(p_tpay)
    print(f"Captured: {p_tpay}")

    print("TENANT SCREENSHOTS CAPTURED!")

finally:
    driver.quit()
