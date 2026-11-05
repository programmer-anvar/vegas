import { connectDB } from '#config/db.js';
import User from '#models/User.model.js';

await connectDB();

const staff = await User.find({ role: { $in: ['admin', 'seller'] } })
  .select('email role isActive')
  .sort({ createdAt: 1 });

for (const user of staff) {
  console.log(`${user.role.padEnd(7)} ${user.isActive ? 'faol' : 'BLOK'}  ${user.email}`);
}
console.log(`Jami: ${staff.length}`);

process.exit(0);