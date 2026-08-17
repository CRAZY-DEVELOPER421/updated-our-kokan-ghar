/**
 * Referral program — end-to-end test.
 *
 * Covers: code generation, refer-code signup (50+50 coins), referrals list,
 * fake-signup blocking (duplicate phone / duplicate email / invalid code),
 * and self-referral guard.
 *
 * Prereqs: backend running with this code: PORT=5199 node backend/server.js
 * Run: node backend/scripts/test-referrals.js
 */
'use strict';

const BASE = process.env.TEST_API_BASE || 'http://127.0.0.1:5199/api';
const pool = require('../config/db');

let passed = 0;
let failed = 0;
const assert = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const j = async (pathname, opts = {}) => {
  const headers = { ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) };
  if (typeof opts.body === 'string') headers['Content-Type'] = 'application/json';
  // Each simulated user signs up from a DISTINCT device IP, so the referral
  // device-guard treats them as genuinely new users (and abuse cases as old).
  if (opts.ip) headers['X-Forwarded-For'] = opts.ip;
  const res = await fetch(BASE + pathname, {
    method: opts.method || 'GET',
    headers,
    body: opts.body,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data };
};

// Distinct fake client IPs per simulated user/device.
const ip = (n) => `203.0.113.${n}`;

(async () => {
  const stamp = Date.now();
  const users = [];
  const addUser = (u) => { users.push(u); return u; };

  try {
    console.log('\n── 1. Register referrer (no code) ──');
    const a = addUser({
      name: 'Referrer A',
      email: `referrer-a-${stamp}@example.com`,
      phone: '9000000001',
      password: 'Test@1234',
    });
    const regA = await j('/auth/register', {
      method: 'POST',
      ip: ip(1),
      body: JSON.stringify(a),
    });
    assert(regA.status === 201, `register A → ${regA.status}`);
    a.id = regA.data?.data?.user?.id;
    a.token = regA.data?.data?.accessToken;
    a.code = regA.data?.data?.user?.referral_code;
    assert(!!a.code && /^KB[A-Z2-9]{6}$/.test(a.code), `A got personal code ${a.code || '(none)'}`);
    assert(a.code?.length >= 8, 'code is >= 8 chars');

    console.log('\n── 2. GET /users/referrals for A (empty list, own link) ──');
    const refA = await j('/users/referrals', { token: a.token });
    assert(refA.status === 200, `get referrals → ${refA.status}`);
    assert(refA.data?.data?.code === a.code, 'API returns the same code');
    assert(refA.data?.data?.reward_amount === 50, `reward amount 50 (got ${refA.data?.data?.reward_amount})`);
    assert(refA.data?.data?.link === `/signup?ref=${a.code}`, 'share link correct');
    assert(refA.data?.data?.summary?.total_referred === 0, 'summary: 0 referred so far');
    assert(refA.data?.data?.summary?.rewarded === 0, 'summary: 0 rewarded');

    console.log('\n── 3. Friend B signs up WITH A\'s code → both get 50 coins ──');
    const b = addUser({
      name: 'Friend B',
      email: `friend-b-${stamp}@example.com`,
      phone: '9000000002',
      password: 'Test@1234',
      referral_code: a.code,
    });
    const regB = await j('/auth/register', { method: 'POST', ip: ip(2), body: JSON.stringify(b) });
    assert(regB.status === 201, `register B with code → ${regB.status}`);
    b.id = regB.data?.data?.user?.id;
    b.token = regB.data?.data?.accessToken;
    assert(b.id !== a.id, 'B is a separate account');

    // A's coins
    const loyalA = await j('/users/loyalty', { token: a.token });
    assert(loyalA.data?.data?.loyalty?.total_points === 50, `A earned 50 coins (got ${loyalA.data?.data?.loyalty?.total_points})`);
    // B's coins
    const loyalB = await j('/users/loyalty', { token: b.token });
    assert(loyalB.data?.data?.loyalty?.total_points === 50, `B earned 50 coins (got ${loyalB.data?.data?.loyalty?.total_points})`);

    console.log('\n── 4. A\'s referrals list now shows B as rewarded ──');
    const refA2 = await j('/users/referrals', { token: a.token });
    const listA = refA2.data?.data?.referrals || [];
    assert(listA.length === 1, `A has 1 referral (got ${listA.length})`);
    assert(listA[0]?.referred_email === b.email, 'referred email matches B');
    assert(Number(listA[0]?.reward_given) === 1, 'reward_given = 1');
    assert(refA2.data?.data?.summary?.total_referred === 1, 'summary total 1');
    assert(refA2.data?.data?.summary?.rewarded === 1, 'summary rewarded 1');
    assert(refA2.data?.data?.summary?.total_reward_coins === 50, 'summary coins 50');

    console.log('\n── 5. FAKE SIGNUP BLOCK 1: same PHONE, new email ──');
    const fake1 = addUser({
      name: 'Fake C',
      email: `fake-c-${stamp}@example.com`,
      phone: b.phone, // B's phone
      password: 'Test@1234',
      referral_code: a.code,
    });
    const regFake1 = await j('/auth/register', { method: 'POST', ip: ip(3), body: JSON.stringify(fake1) });
    assert(regFake1.status === 409, `duplicate phone blocked → ${regFake1.status} (expect 409)`);

    console.log('\n── 6. FAKE SIGNUP BLOCK 2: same EMAIL, new phone ──');
    const fake2 = addUser({
      name: 'Fake D',
      email: b.email, // B's email
      phone: '9000000003',
      password: 'Test@1234',
    });
    const regFake2 = await j('/auth/register', { method: 'POST', ip: ip(4), body: JSON.stringify(fake2) });
    assert(regFake2.status === 409, `duplicate email blocked → ${regFake2.status} (expect 409)`);

    console.log('\n── 7. Invalid referral code rejected ──');
    const bad = addUser({
      name: 'Bad E',
      email: `bad-e-${stamp}@example.com`,
      phone: '9000000004',
      password: 'Test@1234',
      referral_code: 'KBXXXXXX',
    });
    const regBad = await j('/auth/register', { method: 'POST', ip: ip(5), body: JSON.stringify(bad) });
    assert(regBad.status === 400, `invalid code → ${regBad.status} (expect 400)`);

    console.log('\n── 8. Self-referral guard (same phone, own code) ──');
    // A registering again with A's own code + same phone is impossible (phone is
    // unique) — the self-referral check catches a second path: same phone.
    const self = addUser({
      name: 'Self F',
      email: `self-f-${stamp}@example.com`,
      phone: a.phone,
      password: 'Test@1234',
      referral_code: a.code,
    });
    const regSelf = await j('/auth/register', { method: 'POST', ip: ip(6), body: JSON.stringify(self) });
    assert(regSelf.status === 409, `same phone + own code → ${regSelf.status} (expect 409)`);

    console.log('\n── 9. G signs up with no code → 0 coins, has own code ──');
    const g = addUser({
      name: 'Plain G',
      email: `plain-g-${stamp}@example.com`,
      phone: '9000000005',
      password: 'Test@1234',
    });
    const regG = await j('/auth/register', { method: 'POST', ip: ip(7), body: JSON.stringify(g) });
    assert(regG.status === 201, `register G → ${regG.status}`);
    g.id = regG.data?.data?.user?.id;
    g.token = regG.data?.data?.accessToken;
    g.code = regG.data?.data?.user?.referral_code;
    assert(!!g.code && g.code !== a.code, `G has own distinct code ${g.code}`);
    const loyalG = await j('/users/loyalty', { token: g.token });
    assert(loyalG.data?.data?.loyalty?.total_points === 0, `G got 0 coins (got ${loyalG.data?.data?.loyalty?.total_points})`);

    console.log('\n── 10. Lowercase/whitespace code input is normalized ──');
    const h = addUser({
      name: 'Friend H',
      email: `friend-h-${stamp}@example.com`,
      phone: '9000000006',
      password: 'Test@1234',
      referral_code: `  ${a.code.toLowerCase()}  `,
    });
    const regH = await j('/auth/register', { method: 'POST', ip: ip(8), body: JSON.stringify(h) });
    assert(regH.status === 201, `register H with messy code → ${regH.status}`);
    h.id = regH.data?.data?.user?.id;
    const loyalH = await j('/users/loyalty', { token: regH.data?.data?.accessToken });
    assert(loyalH.data?.data?.loyalty?.total_points === 50, `H earned 50 coins via normalized code (got ${loyalH.data?.data?.loyalty?.total_points})`);
    const refA3 = await j('/users/referrals', { token: a.token });
    assert((refA3.data?.data?.referrals || []).length === 2, 'A now has 2 referrals');

    console.log('\n── 11. REPEAT SIGNUP guard: same device can\'t redeem again ──');
    // A user on a device that ALREADY has an account (A's IP) tries to redeem
    // the code again with a brand-new phone+email → must be rejected.
    const repeat = addUser({
      name: 'Repeat I',
      email: `repeat-i-${stamp}@example.com`,
      phone: '9000000007',
      password: 'Test@1234',
      referral_code: a.code,
    });
    const regRepeat = await j('/auth/register', { method: 'POST', ip: ip(1), body: JSON.stringify(repeat) });
    assert(regRepeat.status === 400, `old user repeat signup → ${regRepeat.status} (expect 400)`);

    console.log('\n── 12. SAME-DEVICE-as-referrer guard ──');
    // A "friend" whose device IP equals the referrer's IP is almost certainly
    // the same person → rejected even with a fresh phone+email.
    const sameDev = addUser({
      name: 'SameDev J',
      email: `samedev-j-${stamp}@example.com`,
      phone: '9000000008',
      password: 'Test@1234',
      referral_code: a.code,
    });
    const regSameDev = await j('/auth/register', { method: 'POST', ip: ip(1), body: JSON.stringify(sameDev) });
    assert(regSameDev.status === 400, `same device as referrer → ${regSameDev.status} (expect 400)`);

    console.log('\n── 13. No-code signup from an already-used device is ALLOWED ──');
    // The device guard only applies to referral redemption — a second account
    // (family member on shared WiFi) signing up WITHOUT a code must still work.
    const fam = addUser({
      name: 'Family K',
      email: `family-k-${stamp}@example.com`,
      phone: '9000000009',
      password: 'Test@1234',
    });
    const regFam = await j('/auth/register', { method: 'POST', ip: ip(1), body: JSON.stringify(fam) });
    assert(regFam.status === 201, `no-code signup same IP → ${regFam.status} (expect 201)`);
    fam.id = regFam.data?.data?.user?.id;
    const loyalFam = await j('/users/loyalty', { token: regFam.data?.data?.accessToken });
    assert(loyalFam.data?.data?.loyalty?.total_points === 0, 'family member got 0 coins (no referral)');

    console.log('\n── ✅ ALL CHECKS DONE ──');
  } catch (err) {
    failed++;
    console.error('  ❌ Unexpected error:', err.message);
  } finally {
    try {
      // Cleanup: delete created users (cascades to loyalty/referrals)
      for (const u of users) {
        if (u.id) await pool.query('DELETE FROM users WHERE id = ?', [u.id]);
      }
      console.log('\n  🧹 Test data cleaned up.');
    } catch (cleanErr) {
      console.error('  ⚠️ Cleanup failed:', cleanErr.message);
    }
    try { await pool.end(); } catch {}
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
})();
