const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Short username (max 16 chars)
  const username = `User${Math.floor(Math.random() * 100000)}`; // e.g., User54321 (9 chars)
  const password = 'password123';

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');

    console.log(`Attempting Registration as ${username}...`);

    // Click REGISTER tab
    await page.click('button:text-is("REGISTER")', { timeout: 5000 });

    // Fill Register Form
    await page.fill('input[placeholder="Choose callsign"]', username);
    await page.fill('input[placeholder="Set access code"]', password);

    // Click Register Submit Button
    await page.click('button:has-text("REGISTER OPERATOR")');
    console.log('Clicked Register Submit button.');

    console.log('Waiting for Lobby transition (LOGOUT button)...');
    await page.waitForSelector('button:has-text("LOGOUT")', { timeout: 10000 });
    console.log('Registered and logged in.');

    // Verify Lobby Elements
    await page.waitForSelector('button:has-text("HOST TOURNAMENT")', { state: 'visible' });
    await page.screenshot({ path: 'tictactoe/verification_lobby_v2.png' });
    console.log('Lobby verified.');

    // Test Sound Toggle
    console.log('Testing Sound Toggle...');
    const soundBtn = await page.locator('button.fixed.top-4.right-4');
    if (await soundBtn.count() > 0) {
        await soundBtn.click();
        console.log('Sound toggled.');
    } else {
        console.warn('Sound toggle button not found!');
    }

    // Test Leaderboard
    console.log('Testing Leaderboard...');
    await page.click('button:has-text("VIEW LEADERBOARD")');

    // Wait for Modal Title
    await page.waitForSelector('h2:has-text("GLOBAL LEADERBOARD")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tictactoe/verification_leaderboard.png' });
    console.log('Leaderboard verified.');

    // Close Modal
    await page.click('button:has-text("BACK TO BASE")');
    await page.waitForTimeout(500);
    console.log('Leaderboard closed.');

    // Test Tournament Host
    console.log('Testing Tournament Host...');
    await page.click('button:has-text("HOST TOURNAMENT")');

    // Wait for Tournament Lobby
    console.log('Waiting for Tournament Lobby...');
    await page.waitForSelector('text=TOURNAMENT LOBBY', { timeout: 5000 });
    await page.screenshot({ path: 'tictactoe/verification_tournament_lobby.png' });
    console.log('Tournament Lobby verified.');

    // Test Abort
    console.log('Testing Abort Tournament...');
    await page.click('button:has-text("ABORT")');

    // Verify back in Lobby
    await page.waitForSelector('button:has-text("LOGOUT")', { timeout: 5000 });
    console.log('Returned to Lobby.');

    console.log('All verifications passed!');

  } catch (error) {
    console.error('Verification failed:', error);
    await page.screenshot({ path: 'tictactoe/verification_failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
