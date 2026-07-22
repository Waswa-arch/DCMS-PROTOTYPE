/**
 * EMERGENCY ADMIN PASSWORD RESET
 *
 * Run this directly on the server when the sole ADMIN account is locked out
 * (forgotten password, no way to log in through the normal UI). This bypasses
 * the API entirely and writes straight to the database, using the same
 * bcrypt hashing pattern as normal registration/login so the result is
 * indistinguishable from a password set through the app itself.
 *
 * USAGE (run from the backend/ directory):
 *   node scripts/reset-admin-password.js <new-password>
 *
 * Example:
 *   node scripts/reset-admin-password.js MyNewSecurePassword2026!
 *
 * REQUIREMENTS:
 *   - New password must be at least 8 characters (same rule as the
 *     in-app change-password endpoint).
 *   - Requires direct file-system access to the machine running the
 *     backend. This is intentional: it's the tradeoff for not needing
 *     email infrastructure. If server access isn't available to whoever
 *     is locked out, this script can't help them — that's a known,
 *     accepted limitation of this approach, not an oversight.
 *
 * SAFETY:
 *   - Only ever targets the ADMIN role. Will not touch STUDENT or
 *     OFFICER accounts, even if somehow called with their data.
 *   - Refuses to run if there is more than one ADMIN account, since at
 *     that point "which admin is locked out" is ambiguous and this script
 *     shouldn't guess — resolve that manually instead.
 */

import bcrypt from 'bcryptjs';
import { db } from '../src/config/db.js';

async function resetAdminPassword() {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('Usage: node scripts/reset-admin-password.js <new-password>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('Error: new password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    const admins = await db.all("SELECT id, name, email FROM users WHERE role = 'ADMIN'");

    if (admins.length === 0) {
      console.error('Error: no ADMIN account found in the database. Nothing to reset.');
      process.exit(1);
    }

    if (admins.length > 1) {
      console.error(
        `Error: found ${admins.length} ADMIN accounts. This script only supports a single, ` +
        'unambiguous admin account. Resolve manually (e.g. via direct SQL) if you have multiple admins.'
      );
      admins.forEach((a) => console.error(`  - ${a.name} <${a.email}> (id ${a.id})`));
      process.exit(1);
    }

    const admin = admins[0];

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, admin.id]);

    console.log(`Success: password reset for admin "${admin.name}" <${admin.email}>.`);
    console.log('The admin can now log in with the new password through the normal login page.');
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
}

resetAdminPassword();