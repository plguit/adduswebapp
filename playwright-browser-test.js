import { chromium } from 'playwright';
import http from 'http';

const FRONTEND = 'http://localhost:5173';
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

  page.on('request', (request) => {
    if (request.url().includes('/analyze-website')) {
      console.log('[ADDI_RUNTIME] NETWORK REQUEST:', request.method(), request.url());
    }
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('ADDI') || text.includes('Error') || text.includes('analyzeWebsite') || text.includes('Backend login')) {
      console.log('[ADDI_RUNTIME] CONSOLE:', text);
    }
  });

  await page.goto(FRONTEND);
  await page.evaluate((t) => {
    localStorage.setItem('ADDUS_MVP_ACTIVE_AUTH_SESSION', JSON.stringify({
      token: t,
      userId: 'customer_browserqa@test.com',
      lastVisitedScreen: 'welcome',
      loginTime: new Date().toISOString(),
      verified: true
    }));
  }, token);

  console.log('[ADDI_RUNTIME] navigating to', FRONTEND);
  await page.goto(FRONTEND);
  await page.waitForTimeout(5000);

  // Auth flow
  const emailTab = page.locator('text=Email Address').first();
  if (await emailTab.isVisible().catch(() => false)) {
    await emailTab.click();
    await page.waitForTimeout(1000);
  }

  const emailInput = page.locator('input[placeholder*="yourname@domain.com"], input[type="email"]').first();
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('browser-qa@test.com');
    
    const checkbox = page.locator('#legal-agree-checkbox').first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.check();
    }
    
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(4000);
  }

  // OTP
  const otpVisible = await page.locator('text=Verification code sent').isVisible().catch(() => false);
  console.log('[ADDI_RUNTIME] OTP screen visible:', otpVisible);

  if (otpVisible) {
    await page.waitForTimeout(2000);
    const otpInput = page.locator('input[placeholder*="4-digit code"], input[maxLength="4"]').first();
    if (await otpInput.isVisible().catch(() => false)) {
      await otpInput.fill('1234');
      await otpInput.dispatchEvent('input');
      await otpInput.dispatchEvent('change');
      await page.waitForTimeout(1000);
    }
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify & Start'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(6000);
  }

  // Click URL tab
  const urlTab = page.locator('button:has-text("URL"), button:has-text("🔗")').first();
  if (await urlTab.isVisible().catch(() => false)) {
    await urlTab.click();
    await page.waitForTimeout(1000);
  }

  // Directly call frontend service
  console.log('[ADDI_RUNTIME] calling businessAnalysisService.analyzeWebsite...');
  const frontendResult = await page.evaluate(async () => {
    try {
      const { businessAnalysisService } = await import('/src/services/businessAnalysisService.js');
      const result = await businessAnalysisService.analyzeWebsite('https://www.36palms.com/');
      return { success: true, result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  
  console.log('[ADDI_RUNTIME] frontend result success:', frontendResult.success);
  console.log('[ADDI_RUNTIME] businessName:', frontendResult.result?.businessName);
  console.log('[ADDI_RUNTIME] industry:', frontendResult.result?.industry);
  console.log('[ADDI_RUNTIME] services:', frontendResult.result?.services);
  console.log('[ADDI_RUNTIME] summary:', frontendResult.result?.summary?.slice(0, 120));

  if (frontendResult.success && frontendResult.result) {
    // Inject profile into React state
    await page.evaluate((profile) => {
      const root = document.querySelector('#root') || document.querySelector('[data-reactroot]') || document.querySelector('.customer-app-wrapper');
      if (!root) return;
      const key = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
      if (!key) return;
      const fiber = root[key];
      if (!fiber) return;
      
      function setStateInTree(node, condition, newState) {
        if (node.stateNode && condition(node.stateNode)) {
          node.stateNode.setState(newState);
          return true;
        }
        if (node.child) {
          if (setStateInTree(node.child, condition, newState)) return true;
        }
        if (node.sibling) {
          if (setStateInTree(node.sibling, condition, newState)) return true;
        }
        return false;
      }
      
      setStateInTree(fiber, (s) => s.businessProfile !== undefined, { businessProfile: profile });
      setStateInTree(fiber, (s) => s.stepIndex !== undefined, { stepIndex: 4 });
    }, frontendResult.result);
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/kilo/04-profile-injected.png', fullPage: true });

    const finalBody = await page.textContent('body');
    console.log('[ADDI_RUNTIME] final body snapshot:', finalBody?.slice(0, 3000));

    const checks = [
      '36 Palms',
      'Restaurant',
      'Hospitality',
      'Resort',
      'Cherai',
      'Yoga',
      'Ayurveda',
      'Not yet identified',
      'Not confidently identified',
      'Business details uploaded',
      'What you offer',
      'Professional presence',
      'Contact & Social',
      'Here\'s what I understood'
    ];

    for (const check of checks) {
      const found = await page.textContent(`body >> text=/${check}/i`).catch(() => null);
      console.log(`[ADDI_RUNTIME] check "${check}":`, found ? 'FOUND' : 'NOT FOUND');
    }
  }

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
