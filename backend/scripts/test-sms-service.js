/**
 * Test the SMS service in isolation.
 * Run: node backend/scripts/test-sms-service.js
 *
 * Verifies:
 *   1. Phone normalization (Indian numbers → 91XXXXXXXXXX)
 *   2. Templates render with real order data
 *   3. sendSMS / sendOrderSMS are graceful when SMS is NOT configured
 *      (never throw, return { success:false } and log a skip)
 */
const sms = require('../services/sms.service');

const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
};

(async () => {
  // ── 1. Phone normalization ──
  const cases = [
    ['9876543210', '919876543210'],
    ['+919876543210', '919876543210'],
    ['09876543210', '919876543210'],
    ['91 98765 43210', '919876543210'],
    ['98765-43210', '919876543210'],
    ['12345', null],            // too short
    ['987654321012', null],     // too long / not 10 after strip
    ['', null],
    [null, null],
  ];
  for (const [input, expected] of cases) {
    const got = sms.normalizePhone(input);
    check(`normalizePhone(${JSON.stringify(input)})`, got === expected, `got ${JSON.stringify(got)}`);
  }

  // ── 2. Templates ──
  const t = sms.orderSmsTemplates;
  check('order_placed template', t.order_placed('KB123', 1500).includes('KB123') && t.order_placed('KB123', 1500).includes('1,500'));
  check('shipped template w/ location', t.shipped('KB123', 'Mumbai').includes('Mumbai'));
  check('out_for_delivery template', /OUT FOR DELIVERY/i.test(t.out_for_delivery('KB123')));
  check('delivered template', /DELIVERED/i.test(t.delivered('KB123')));
  check('cancelled template', t.cancelled('KB123').includes('KB123'));

  // ── 3. Graceful when unconfigured ──
  const r1 = await sms.sendSMS('9876543210', 'Test message');
  check('sendSMS returns object (not throw)', !!r1 && typeof r1 === 'object');
  check('sendSMS success=false when unconfigured', r1.success === false);

  const r2 = await sms.sendOrderSMS('9876543210', 'order_placed', { orderNumber: 'KB123', amount: 1500 });
  check('sendOrderSMS graceful (order_placed)', !!r2 && r2.success === false);

  const r3 = await sms.sendOrderSMS('9876543210', 'unknown_status', { orderNumber: 'KB123' });
  check('sendOrderSMS rejects unknown template', !!r3 && r3.success === false && /Unknown/.test(r3.error || ''));

  const failed = results.filter((r) => !r).length;
  console.log(`\n${failed === 0 ? '🎉 ALL PASS' : `❌ ${failed} FAILED`} — ${results.length} checks`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
