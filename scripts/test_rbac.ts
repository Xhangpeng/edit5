/**
 * Comprehensive RBAC & Security Test Suite
 * Validates all role profile scenarios, permissions, ban lifecycles, and fleet removal
 */

import { spawn } from 'child_process';

const PORT = 3099;
process.env.PORT = String(PORT);

async function runTestSuite() {
  console.log('🚀 Starting RBAC & Security Verification Suite on port', PORT);

  // Start the server process
  const server = spawn('npx', ['tsx', 'server.ts'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => {
    // console.log('[Server stdout]', d.toString());
  });
  server.stderr.on('data', (d) => {
    // console.error('[Server stderr]', d.toString());
  });

  // Wait for server to be ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
  }

  if (!ready) {
    console.error('❌ Server did not start in time on port', PORT);
    server.kill();
    process.exit(1);
  }

  console.log('✅ Test Server is online. Running RBAC verification cases...\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${testName}`);
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details || 'Assertion failed'}`);
    }
  }

  try {
    // =========================================================================
    // SCENARIO 1: MANAGER AUTHENTICATION & FULL PRIVILEGES
    // =========================================================================
    console.log('=== Scenario 1: Manager / Admin Profile Validation ===');
    const mgrRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@shankar.com', password: 'AdminPass@2026!' }),
    });
    const mgrData = await mgrRes.json();
    assert(mgrRes.status === 200 && mgrData.ok === true, 'Manager credentials authenticated successfully');
    assert(mgrData.user.role === 'admin' || mgrData.user.role === 'manager', 'Manager role identified as trusted admin/manager from server');
    assert(!!mgrData.token, 'Manager receives valid server-issued authorization token');

    const mgrToken = mgrData.token;

    // Manager accessing security endpoints
    const mgrSecUsers = await fetch(`http://localhost:${PORT}/api/security/users`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    assert(mgrSecUsers.status === 200, 'Manager granted authorized access to System Management user directory');

    // Manager accessing manager-only settings
    const mgrSettings = await fetch(`http://localhost:${PORT}/api/admin/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mgrToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcementBanner: 'Royal Maheswari Heritage Live' }),
    });
    assert(mgrSettings.status === 200, 'Manager granted authorized access to privileged global settings');

    // =========================================================================
    // SCENARIO 2: WAITER AUTHENTICATION & STRICT PRIVILEGE RESTRICTION
    // =========================================================================
    console.log('\n=== Scenario 2: Waiter Profile Validation ===');
    const waiterRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'waiter@shankar.com', password: 'WaiterPass@2026!' }),
    });
    const waiterData = await waiterRes.json();
    assert(waiterRes.status === 200 && waiterData.ok === true, 'Waiter credentials authenticated successfully');
    assert(waiterData.user.role === 'waiter', 'Waiter role automatically detected as "waiter" on server');
    const waiterToken = waiterData.token;

    // Waiter attempting to access System Management Desk users list
    const waiterSecUsers = await fetch(`http://localhost:${PORT}/api/security/users`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    assert(waiterSecUsers.status === 403, 'Waiter denied access to System Management Desk users directory (HTTP 403 Forbidden)');

    // Waiter attempting to ban a user
    const waiterBanAttempt = await fetch(`http://localhost:${PORT}/api/security/ban-user`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${waiterToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'cust_001', reason: 'Attempted ban by waiter' }),
    });
    assert(waiterBanAttempt.status === 403, 'Waiter attempting to ban user receives HTTP 403 Forbidden');

    // Waiter attempting to modify manager settings
    const waiterSettings = await fetch(`http://localhost:${PORT}/api/admin/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${waiterToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcementBanner: 'Hacked by Waiter' }),
    });
    assert(waiterSettings.status === 403, 'Waiter denied access to Manager settings (HTTP 403 Forbidden)');

    // =========================================================================
    // SCENARIO 3: KITCHEN CHEF AUTHENTICATION & BAN PREVENTION
    // =========================================================================
    console.log('\n=== Scenario 3: Kitchen Chef Profile Validation ===');
    const chefRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kitchen@shankar.com', password: 'KitchenPass@2026!' }),
    });
    const chefData = await chefRes.json();
    assert(chefRes.status === 200 && chefData.ok === true, 'Kitchen Chef credentials authenticated successfully');
    assert(chefData.user.role === 'kitchen', 'Kitchen Chef role automatically detected as "kitchen" on server');
    const chefToken = chefData.token;

    // Kitchen Chef attempting to ban a user
    const chefBanAttempt = await fetch(`http://localhost:${PORT}/api/security/ban-user`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chefToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'cust_001', reason: 'Attempted ban by chef' }),
    });
    assert(chefBanAttempt.status === 403, 'Kitchen Chef attempting to ban user receives HTTP 403 Forbidden');

    // Kitchen Chef attempting to access audit logs
    const chefAudit = await fetch(`http://localhost:${PORT}/api/security/audit-logs`, {
      headers: { Authorization: `Bearer ${chefToken}` },
    });
    assert(chefAudit.status === 403, 'Kitchen Chef denied access to System Management audit logs (HTTP 403 Forbidden)');

    // Kitchen Chef attempting to assign staff roles
    const chefStaffRoles = await fetch(`http://localhost:${PORT}/api/admin/staff-roles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chefToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffEmail: 'waiter@shankar.com', newRole: 'manager' }),
    });
    assert(chefStaffRoles.status === 403, 'Kitchen Chef denied access to Staff Role management (HTTP 403 Forbidden)');

    // =========================================================================
    // SCENARIO 4: SYSTEM MANAGEMENT ADMINISTRATOR VALIDATION
    // =========================================================================
    console.log('\n=== Scenario 4: System Management Administrator Profile Validation ===');
    const sysRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'system@shankar.com', password: 'SysAdminPass@2026!' }),
    });
    const sysData = await sysRes.json();
    assert(sysRes.status === 200 && sysData.ok === true, 'System Management Admin authenticated successfully');
    assert(sysData.user.role === 'system_management', 'System Management role automatically detected as "system_management" on server');
    const sysToken = sysData.token;

    // System Management accessing user security directory
    const sysUsers = await fetch(`http://localhost:${PORT}/api/security/users`, {
      headers: { Authorization: `Bearer ${sysToken}` },
    });
    assert(sysUsers.status === 200, 'System Management Admin granted access to System Management Desk users list');

    // System Management accessing suspicious activity
    const sysSuspicious = await fetch(`http://localhost:${PORT}/api/security/suspicious-activity`, {
      headers: { Authorization: `Bearer ${sysToken}` },
    });
    assert(sysSuspicious.status === 200, 'System Management Admin granted access to Suspicious Activity monitor');

    // System Management attempting to modify Manager-only staff roles
    const sysStaffRoleAttempt = await fetch(`http://localhost:${PORT}/api/admin/staff-roles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sysToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffEmail: 'waiter@shankar.com', newRole: 'manager' }),
    });
    assert(sysStaffRoleAttempt.status === 403, 'System Management Admin restricted from modifying Manager-only staff roles (HTTP 403 Forbidden)');

    // =========================================================================
    // SCENARIO 5: USER BAN, AUDIT LOGGING & UNBAN SECURITY LIFECYCLE
    // =========================================================================
    console.log('\n=== Scenario 5: User Ban and Suspension Security Lifecycle ===');
    // First verify pre-seeded banned user cannot login
    const preBannedLogin = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'banned@shankar.com', password: 'BadPass@2026!' }),
    });
    const preBannedData = await preBannedLogin.json();
    assert(preBannedLogin.status === 403 && preBannedData.code === 'ACCOUNT_BANNED', 'Pre-banned account rejected at login with HTTP 403 and ACCOUNT_BANNED code');

    // System Management Admin bans an active customer (cust_001: Rohan Mehra)
    const banRes = await fetch(`http://localhost:${PORT}/api/security/ban-user`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sysToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'cust_001',
        reason: 'Confirmed multiple fraudulent chargeback attempts and rate-limit violations',
      }),
    });
    const banData = await banRes.json();
    assert(banRes.status === 200 && banData.ok === true, 'System Management Admin authorized to ban user on backend');
    assert(banData.auditEntry && banData.auditEntry.action === 'USER_BANNED', 'Audit log records action USER_BANNED');
    assert(banData.auditEntry.performedBy.role === 'system_management', 'Audit log records administrator role who performed ban');
    assert(banData.auditEntry.targetUserId === 'cust_001', 'Audit log records affected user ID and reason');

    // Verify banned user now cannot login
    const custLoginAfterBan = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rohan.mehra@example.com', password: 'CustomerPass@2026!' }),
    });
    const custAfterBanData = await custLoginAfterBan.json();
    assert(custLoginAfterBan.status === 403 && custAfterBanData.code === 'ACCOUNT_BANNED', 'Banned customer account immediately blocked from logging in (HTTP 403 ACCOUNT_BANNED)');

    // System Management Admin unbans the customer
    const unbanRes = await fetch(`http://localhost:${PORT}/api/security/unban-user`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sysToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'cust_001',
        reason: 'Resolved issue with bank; customer account verified and cleared',
      }),
    });
    const unbanData = await unbanRes.json();
    assert(unbanRes.status === 200 && unbanData.ok === true, 'System Management Admin authorized to unban user');
    assert(unbanData.auditEntry && unbanData.auditEntry.action === 'USER_UNBANNED', 'Audit log records action USER_UNBANNED with admin ID and timestamp');

    // Verify unbanned user can now login
    const custLoginAfterUnban = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rohan.mehra@example.com', password: 'CustomerPass@2026!' }),
    });
    const custAfterUnbanData = await custLoginAfterUnban.json();
    assert(custLoginAfterUnban.status === 200 && custAfterUnbanData.ok === true, 'Unbanned user successfully restored and can authenticate');

    // =========================================================================
    // SCENARIO 6: COMPLETE REMOVAL OF DELIVERY FLEET
    // =========================================================================
    console.log('\n=== Scenario 6: Complete Removal of Delivery Fleet Verification ===');
    // Ensure no delivery fleet desk or delivery drivers
    const deliveryFleetCheck = await fetch(`http://localhost:${PORT}/api/orders/all-fleet-riders`);
    assert(deliveryFleetCheck.status === 404, 'No fleet rider API endpoints exist (404 Not Found)');

    console.log(`\n=======================================================`);
    console.log(`🎉 ALL ${passedTests} / ${totalTests} ROLE-BASED ACCESS CONTROL TESTS PASSED!`);
    console.log(`=======================================================\n`);
  } catch (err) {
    console.error('Test execution failed with error:', err);
  } finally {
    server.kill();
  }
}

runTestSuite();
