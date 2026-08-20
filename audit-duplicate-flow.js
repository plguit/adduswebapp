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
  console.log('\n=== ADDI DUPLICATE ACCOUNT VALIDATION AUDIT ===\n');

  // Test 1: Verify duplicate detection logic
  console.log('[AUDIT] Test 1: Duplicate detection logic');
  const { checkDuplicateBusiness, extractDomain } = await import('./src/utils/duplicateDetector.js');
  
  const testProfile1 = {
    businessName: '36 Palms Beach Retreat',
    website: 'https://www.36palms.com/',
    email: 'test@36palms.com',
    phoneNumber: '+919990775666'
  };
  
  const testProfile2 = {
    businessName: '36 Palms Beach Retreat',
    website: 'https://36palms.com/',
    email: 'test@36palms.com',
    phoneNumber: '+919990775666'
  };
  
  const dup1 = checkDuplicateBusiness(testProfile1, [testProfile2]);
  console.log('[AUDIT] Same business, different URL format (www vs non-www):', dup1 ? `DUPLICATE (${dup1.matchType})` : 'NO DUPLICATE');
  
  const testProfile3 = {
    businessName: 'Different Business',
    website: 'https://www.36palms.com/',
    email: 'other@36palms.com',
    phoneNumber: '+919990775666'
  };
  
  const dup2 = checkDuplicateBusiness(testProfile1, [testProfile3]);
  console.log('[AUDIT] Same phone, different business name:', dup2 ? `DUPLICATE (${dup2.matchType})` : 'NO DUPLICATE');
  
  const testProfile4 = {
    businessName: 'Different Business',
    website: 'https://www.different.com/',
    email: 'other@different.com',
    phoneNumber: '+919990775666'
  };
  
  const dup3 = checkDuplicateBusiness(testProfile1, [testProfile4]);
  console.log('[AUDIT] Same phone, completely different domain:', dup3 ? `DUPLICATE (${dup3.matchType})` : 'NO DUPLICATE');
  
  // Test 2: Verify admin receives customer data
  console.log('\n[AUDIT] Test 2: Admin receives customer data');
  
  // Login as admin
  const adminLogin = await httpPost(`${BACKEND}/api/admin/login`, {
    email: 'admin@addus.in',
    password: 'addus@admin2025'
  });
  console.log('[AUDIT] Admin login:', adminLogin.success ? 'SUCCESS' : 'FAILED');
  
  if (adminLogin.success) {
    const adminToken = adminLogin.token;
    
    // Get all users
    const usersRes = await new Promise((resolve) => {
      const u = new URL(`${BACKEND}/api/admin/users`);
      const req = http.request({
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }, (res) => {
        let raw = '';
        res.on('data', (chunk) => raw += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch (e) { resolve(raw); }
        });
      });
      req.on('error', () => resolve({ success: false, error: 'request failed' }));
      req.end();
    });
    
    console.log('[AUDIT] Admin users count:', usersRes.users?.length || 0);
    console.log('[AUDIT] Admin users sample:', JSON.stringify(usersRes.users?.slice(0, 2), null, 2)?.slice(0, 500));
  }
  
  // Test 3: Verify backend vault has website data
  console.log('\n[AUDIT] Test 3: Backend vault has website data');
  
  // Login as customer (the one that did website analysis in our earlier tests)
  const customerLogin = await httpPost(`${BACKEND}/api/auth/login/customer`, {
    email: 'browser-qa@test.com'
  });
  
  if (customerLogin.success) {
    const customerToken = customerLogin.token;
    const userId = customerLogin.userId;
    console.log('[AUDIT] Customer userId:', userId);
    
    // Get customer vault
    const vaultRes = await new Promise((resolve) => {
      const u = new URL(`${BACKEND}/api/vault/${encodeURIComponent(userId)}`);
      const req = http.request({
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${customerToken}` }
      }, (res) => {
        let raw = '';
        res.on('data', (chunk) => raw += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch (e) { resolve(raw); }
        });
      });
      req.on('error', () => resolve({ success: false, error: 'request failed' }));
      req.end();
    });
    
    console.log('[AUDIT] Customer vault has websiteUrl:', !!vaultRes.vault?.websiteUrl);
    console.log('[AUDIT] Customer vault websiteUrl value:', vaultRes.vault?.websiteUrl);
    console.log('[AUDIT] Customer vault has businessName:', !!vaultRes.vault?.businessName);
    console.log('[AUDIT] Customer vault businessName value:', vaultRes.vault?.businessName?.slice(0, 50));
    console.log('[AUDIT] Customer vault has email:', !!vaultRes.vault?.email);
    console.log('[AUDIT] Customer vault has phoneNumber:', !!vaultRes.vault?.phoneNumber);
    console.log('[AUDIT] Customer vault has websiteEvidenceItems:', (vaultRes.vault?.websiteEvidenceItems?.length || 0));
  }
  
  // Test 4: Verify duplicate detection during onboarding
  console.log('\n[AUDIT] Test 4: Duplicate detection during onboarding flow');
  
  // Create a test profile in localStorage to simulate existing account
  const testUserId = 'customer_duplicate_test@test.com';
  const existingProfile = {
    userId: testUserId,
    customerId: testUserId,
    phoneNumber: '9999075666',
    email: 'duplicate_test@test.com',
    businessName: '36 Palms Beach Retreat',
    website: 'https://www.36palms.com/',
    onboardingStatus: 'in_progress'
  };
  
  // Save to localStorage via API
  const loginRes = await httpPost(`${BACKEND}/api/auth/login/customer`, { email: 'duplicate_test@test.com' });
  const testToken = loginRes.token;
  
  await new Promise((resolve) => {
    const u = new URL(`${BACKEND}/api/customer/profile/${encodeURIComponent(testUserId)}`);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({ profile: existingProfile })
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => resolve());
    });
    req.on('error', () => resolve());
    req.write(JSON.stringify({ profile: existingProfile }));
    req.end();
  });
  
  console.log('[AUDIT] Test profile created in backend vault');
  
  // Now check if duplicate detection catches it
  const newProfile = {
    businessName: '36 Palms Beach Retreat',
    website: 'https://36palms.com/',
    email: 'new_user@test.com',
    phoneNumber: '9999075666'
  };
  
  const dupCheck = checkDuplicateBusiness(newProfile, [existingProfile]);
  console.log('[AUDIT] Duplicate detection for same phone + same domain + same name:', dupCheck ? `FOUND (${dupCheck.matchType}, confidence: ${dupCheck.confidence})` : 'NOT FOUND');
  
  // Test 5: Verify frontend duplicate modal flow
  console.log('\n[AUDIT] Test 5: Frontend duplicate modal flow');
  
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Inject session
  await page.goto(FRONTEND);
  await page.evaluate((t) => {
    localStorage.setItem('ADDUS_MVP_ACTIVE_AUTH_SESSION', JSON.stringify({
      token: t,
      userId: 'customer_browserqa@test.com',
      lastVisitedScreen: 'welcome',
      loginTime: new Date().toISOString(),
      verified: true
    }));
  }, customerLogin.token);
  
  await page.goto(FRONTEND);
  await page.waitForTimeout(3000);
  
  // Navigate through auth
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
  
  const otpVisible = await page.locator('text=Verification code sent').isVisible().catch(() => false);
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
  
  // Click URL tab and fill form
  const urlTab = page.locator('button:has-text("URL"), button:has-text("🔗")').first();
  if (await urlTab.isVisible().catch(() => false)) {
    await urlTab.click();
    await page.waitForTimeout(1000);
  }
  
  const nameInput = page.locator('input[placeholder*="Your Name *"]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('Duplicate Test');
    await nameInput.dispatchEvent('input');
    await nameInput.dispatchEvent('change');
    await page.waitForTimeout(500);
  }
  
  const urlInput = page.locator('input[type="url"], input[placeholder*="yourwebsite.com"]').first();
  if (await urlInput.isVisible().catch(() => false)) {
    await urlInput.fill('https://www.36palms.com/');
    await urlInput.dispatchEvent('input');
    await urlInput.dispatchEvent('change');
    await page.waitForTimeout(500);
  }
  
  // Click Analyze Business
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Analyze Business'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(15000);
  
  // Click Looks Good to trigger duplicate check
  const looksGoodBtn = page.locator('button:has-text("Looks Good")').first();
  if (await looksGoodBtn.isVisible().catch(() => false)) {
    await looksGoodBtn.click();
    await page.waitForTimeout(3000);
    
    // Check if duplicate modal appeared
    const modalVisible = await page.locator('text=existing ADDUS account may belong').isVisible().catch(() => false);
    console.log('[AUDIT] Duplicate modal appeared after clicking Looks Good:', modalVisible);
    
    if (modalVisible) {
      const modalText = await page.textContent('body');
      console.log('[AUDIT] Modal message:', modalText?.match(/existing ADDUS account[^<]*/)?.[0]?.slice(0, 200));
    }
  } else {
    console.log('[AUDIT] Looks Good button not found - profile may not have loaded');
    const bodyText = await page.textContent('body');
    console.log('[AUDIT] Current body:', bodyText?.slice(0, 500));
  }
  
  await browser.close();
  
  console.log('\n=== AUDIT COMPLETE ===\n');
}

run().catch((e) => {
  console.error('[AUDIT ERROR]', e);
  process.exit(1);
});
