import { chromium } from 'playwright';
import http from 'http';

const FRONTEND = 'http://localhost:5174';
const BACKEND = 'http://localhost:3001';

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch (e) { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const res = await httpPost(`${BACKEND}/api/auth/login/customer`, {
    email: 'browser-qa@test.com'
  });
  console.log('[ADDI_RUNTIME] login response success:', res.success);
  const token = res.token;

  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Inject session before navigation
  await page.goto(FRONTEND);
  await page.evaluate((t) => {
    localStorage.setItem('ACTIVE_AUTH_SESSION', JSON.stringify({
      token: t,
      userId: 'customer_browserqa@test.com',
      lastVisitedScreen: 'welcome',
      loginTime: new Date().toISOString(),
      verified: true
    }));
  }, token);

  console.log('[ADDI_RUNTIME] navigating to', FRONTEND);
  await page.goto(FRONTEND);
  
  // Wait for splash screen to complete
  console.log('[ADDI_RUNTIME] waiting for splash screen...');
  await page.waitForTimeout(5000);

  const bodyText = await page.textContent('body');
  console.log('[ADDI_RUNTIME] body snapshot after splash:', bodyText?.slice(0, 1500));
  await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/kilo/02-after-splash.png', fullPage: true });

  // Click Email Address tab
  const emailTab = page.locator('text=Email Address').first();
  if (await emailTab.isVisible().catch(() => false)) {
    await emailTab.click();
    await page.waitForTimeout(1000);
    console.log('[ADDI_RUNTIME] clicked Email Address tab');
  }

  // Fill email input
  const emailInput = page.locator('input[placeholder*="name@company.com"], input[type="email"]').first();
  const emailVisible = await emailInput.isVisible().catch(() => false);
  console.log('[ADDI_RUNTIME] email input visible:', emailVisible);
  
  if (emailVisible) {
    await emailInput.fill('browser-qa@test.com');
    console.log('[ADDI_RUNTIME] filled email');
    
    // Check legal checkbox
    const checkbox = page.locator('#legal-agree-checkbox').first();
    const checkboxVisible = await checkbox.isVisible().catch(() => false);
    console.log('[ADDI_RUNTIME] legal checkbox visible:', checkboxVisible);
    
    if (checkboxVisible) {
      await checkbox.check();
      console.log('[ADDI_RUNTIME] checked legal agreement');
    }
    
    await page.waitForTimeout(500);
    
    // Submit form
    const formSubmitted = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return true;
      }
      return false;
    });
    console.log('[ADDI_RUNTIME] form submit dispatched:', formSubmitted);
    await page.waitForTimeout(4000);
  }

  // OTP screen
  const otpVisible = await page.locator('text=Verification code sent').isVisible().catch(() => false);
  console.log('[ADDI_RUNTIME] OTP screen visible:', otpVisible);

  if (otpVisible) {
    await page.waitForTimeout(2000);
    
    // Fill 4-digit OTP
    const otpInput = page.locator('input[placeholder*="4-digit code"], input[maxLength="4"]').first();
    const otpInputVisible = await otpInput.isVisible().catch(() => false);
    console.log('[ADDI_RUNTIME] OTP input visible:', otpInputVisible);
    
    if (otpInputVisible) {
      await otpInput.fill('1234');
      await otpInput.dispatchEvent('input');
      await otpInput.dispatchEvent('change');
      console.log('[ADDI_RUNTIME] filled OTP');
      await page.waitForTimeout(1000);
    }

    // Click Verify & Start
    const verifyBtn = page.locator('button:has-text("Verify & Start")').first();
    const verifyVisible = await verifyBtn.isVisible().catch(() => false);
    const verifyDisabled = await verifyBtn.isDisabled().catch(() => false);
    console.log('[ADDI_RUNTIME] verify button visible:', verifyVisible, 'disabled:', verifyDisabled);
    
    if (verifyVisible && !verifyDisabled) {
      await verifyBtn.click();
      console.log('[ADDI_RUNTIME] clicked Verify & Start');
      await page.waitForTimeout(6000);
    } else if (verifyVisible) {
      // Try JS click
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify & Start'));
        if (btn) btn.click();
      });
      await page.waitForTimeout(6000);
    }
  }

  // Check current state
  const afterAuthBody = await page.textContent('body');
  console.log('[ADDI_RUNTIME] body after auth:', afterAuthBody?.slice(0, 2000));
  await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/kilo/03-after-auth.png', fullPage: true });

  // Try to find business upload / URL input
  const urlInput = page.locator('input[type="url"], input[placeholder*="https://"], input[placeholder*="website"]').first();
  const urlVisible = await urlInput.isVisible().catch(() => false);
  console.log('[ADDI_RUNTIME] URL input visible:', urlVisible);

  if (urlVisible) {
    await urlInput.fill('https://sealagoonhealthresort.com/');
    console.log('[ADDI_RUNTIME] filled URL');
    
    // Find name input
    const nameInput = page.locator('input[placeholder*="Your Name"], input[placeholder*="Name *"]').first();
    const nameVisible = await nameInput.isVisible().catch(() => false);
    if (nameVisible) {
      await nameInput.fill('Browser QA');
      console.log('[ADDI_RUNTIME] filled name');
    }

    // Click analyze
    const analyzeBtn = page.locator('button:has-text("Analyze")').first();
    if (await analyzeBtn.isVisible().catch(() => false)) {
      await analyzeBtn.click();
      console.log('[ADDI_RUNTIME] clicked Analyze, waiting...');
      await page.waitForTimeout(25000);
    }
  } else {
    console.log('[ADDI_RUNTIME] no URL input found, checking all inputs and text');
    const allInputs = await page.locator('input').all();
    for (const input of allInputs) {
      const ph = await input.getAttribute('placeholder');
      const visible = await input.isVisible().catch(() => false);
      if (visible) {
        console.log('[ADDI_RUNTIME] visible input:', ph);
      }
    }
  }

  await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/kilo/04-after-analysis.png', fullPage: true });

  // Final state extraction
  const finalBody = await page.textContent('body');
  console.log('[ADDI_RUNTIME] final body snapshot:', finalBody?.slice(0, 3000));

  // Check for key profile values
  const checks = [
    'Sealagoon',
    'Healthcare',
    'Hospitality',
    'Resort',
    'Cherai',
    'Accommodation',
    'Dining',
    'Ayurveda',
    'Not yet identified',
    'Not confidently identified',
    'Summary',
    'About',
    'Contact',
    'Social',
    'Professional presence'
  ];

  for (const check of checks) {
    const found = await page.textContent(`body >> text=/${check}/i`).catch(() => null);
    console.log(`[ADDI_RUNTIME] check "${check}":`, found ? 'FOUND' : 'NOT FOUND');
  }

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
