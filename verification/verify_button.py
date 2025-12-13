
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_button_loading(page: Page):
    # 1. Arrange: Go to the test page.
    # Note: Ensure the server is running on port 3001
    page.goto("http://localhost:3001/test-button")

    # 2. Assert: Check if buttons are visible
    # Wait for the page to load
    page.wait_for_selector("h1:has-text('Button UX Test')")

    # Check for a specific loading button
    loading_button = page.get_by_role("button", name="Loading Default")
    expect(loading_button).to_be_visible()
    expect(loading_button).to_be_disabled()

    # 3. Screenshot
    page.screenshot(path="verification/button_verification.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_button_loading(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
