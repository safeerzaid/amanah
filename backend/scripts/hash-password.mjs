// Usage: npm run admin:hash -- "your-admin-password"
// Prints the value to put in ADMIN_PASSWORD_HASH (a bcrypt hash, base64-encoded
// so the `$` signs survive .env files and Coolify's environment variables).
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Pass a password of at least 12 characters: npm run admin:hash -- "your-password"');
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log(Buffer.from(hash, 'utf8').toString('base64'));
