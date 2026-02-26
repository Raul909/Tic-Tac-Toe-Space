from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Login
            page.fill('input[placeholder="Enter callsign"]', "Player1")
            page.fill('input[placeholder="••••••••"]', "password")
            page.click('button[type="submit"]')

            # Wait for transition
            try:
                page.wait_for_selector('text=LAUNCH ROOM', timeout=2000)
                print("Logged in successfully")
            except:
                print("Login timed out. Attempting to Register...")
                # Try switching to Register tab
                page.click('text=REGISTER') # Click tab
                time.sleep(1)
                page.fill('input[placeholder="Choose callsign"]', "Player1")
                page.fill('input[placeholder="Set access code"]', "password")
                # Use specific selector for visible submit button if possible, or index
                # The register form is visible now.
                # page.click('button[type="submit"]') might match the hidden login button if not careful?
                # Playwright click usually clicks visible.
                page.click('button[type="submit"]:visible')

                page.wait_for_selector('text=LAUNCH ROOM', timeout=5000)
                print("Registered successfully")


            time.sleep(2)
            page.screenshot(path="tictactoe/verification_lobby.png")
            print("Lobby screenshot taken")

            # Click HOST TOURNAMENT
            page.click('text=HOST TOURNAMENT')
            time.sleep(2)
            page.screenshot(path="tictactoe/verification_tournament.png")
            print("Tournament Lobby screenshot taken")

            # Abort
            page.click('text=ABORT')
            time.sleep(2)

            # Click VIEW LEADERBOARD
            page.click('text=VIEW LEADERBOARD')
            time.sleep(2)
            page.screenshot(path="tictactoe/verification_leaderboard.png")
            print("Leaderboard screenshot taken")

            print("Verification Complete")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="tictactoe/verification_error.png")

        browser.close()

if __name__ == "__main__":
    run()
