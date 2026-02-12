import os
from playwright.sync_api import sync_playwright

# Set HOME environment variable explicitly to avoid the error
os.environ["HOME"] = os.path.expanduser("~")

def take_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Navigating to http://localhost:4173...")
        page.goto("http://localhost:4173")
        page.wait_for_load_state("networkidle")
        print("Taking screenshot...")
        page.screenshot(path="screenshot_preview.png", full_page=True)
        browser.close()
        print("Screenshot saved to screenshot_preview.png")

if __name__ == "__main__":
    take_screenshot()
