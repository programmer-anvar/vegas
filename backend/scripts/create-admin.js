import { connectDB } from '#config/db.js';
import userRepository from '#repositories/user.repository.js';

const [rawEmail, password, ...nameParts] = process.argv.slice(2);

if (!rawEmail || !password) {
  console.error('Ishlatilishi: node scripts/create-admin.js <email> <parol> [Ism Familiya]');
  process.exit(1);
}
if (password.length < 6) {
  console.error("Parol kamida 6 belgidan iborat bo'lishi kerak");
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const fullName = nameParts.join(' ') || 'Admin';

await connectDB();

const existing = await userRepository.findByEmailWithPassword(email);
if (existing) {
  existing.role = 'admin';
  existing.isActive = true;
  existing.password = password;
  if (nameParts.length > 0) existing.fullName = fullName;
  await existing.save();
  console.log(`Mavjud foydalanuvchi admin qilindi, paroli yangilandi: ${email}`);
} else {
  await userRepository.create({ fullName, email, password, role: 'admin' });
  console.log(`Admin yaratildi: ${email}`);
}

process.exit(0);
