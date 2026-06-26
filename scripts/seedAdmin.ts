import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { UserRole } from '../src/constants';

dotenv.config();

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing');
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const email = 'admin@servicehub.com';
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists. We will update the password to adminpassword123');
      existingAdmin.password = 'adminpassword123';
      await existingAdmin.save();
    } else {
      const admin = new User({
        name: 'Platform Admin',
        email,
        password: 'adminpassword123',
        role: UserRole.ADMIN,
        isEmailVerified: true
      });
      await admin.save();
      console.log('Admin created successfully!');
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
