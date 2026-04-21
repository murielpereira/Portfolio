from playwright.sync_api import sync_playwright
import time
import os

def test_calculator():
    os.makedirs('/home/jules/verification/screenshots', exist_ok=True)
    os.makedirs('/home/jules/verification/videos', exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir='/home/jules/verification/videos/')
        page = context.new_page()

        # Route external requests to avoid timeouts
        page.route("**/*googlesyndication.com*", lambda route: route.abort())
        page.route("**/*gstatic.com*", lambda route: route.abort())
        page.route("**/*fonts.googleapis.com*", lambda route: route.abort())

        try:
            print("Navigating to calculator...")
            page.goto('http://localhost:8000/projetos/calculadora/calculadora.html')
            page.wait_for_selector('.calculadora')

            print("Clicking buttons to test audio and calculation...")
            page.click('button[id="7"]')
            page.click('button[id="+"]')
            page.click('button[id="5"]')
            page.click('button[id="="]')

            time.sleep(2)

            print("Taking screenshot...")
            page.screenshot(path='/home/jules/verification/screenshots/calculator_test.png')

            result = page.input_value('#resultado')
            print(f"Calculation result: {result}")
            if result == '12':
                print("Calculation is correct!")
            else:
                print("Calculation is incorrect!")

            # Quick rapid clicking test
            for i in range(5):
                 page.click('button[id="1"]')

            time.sleep(1)

        except Exception as e:
            print(f"Error during test: {e}")

        finally:
            context.close()
            browser.close()
            print("Test completed.")

if __name__ == '__main__':
    test_calculator()
