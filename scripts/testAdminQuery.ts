import mongoose from 'mongoose';
import { adminService } from '../src/services/admin.service';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/servicehub');
  console.log('Connected to DB');
  
  const stats = await adminService.getDashboardStats();
  console.log('Stats:', stats);
  process.exit(0);
}
test().catch(console.error);
