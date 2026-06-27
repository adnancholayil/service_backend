import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Provider } from '../src/models/Provider';
import { Category } from '../src/models/Category';
import { VerificationStatus, UserRole } from '../src/constants';

dotenv.config();

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing');
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const providerUsers = await User.find({ role: UserRole.PROVIDER });
    console.log(`Found ${providerUsers.length} users with PROVIDER role.`);

    let defaultCategory = await Category.findOne({ slug: 'uncategorized' });
    if (!defaultCategory) {
      defaultCategory = new Category({
        name: 'Uncategorized',
        slug: 'uncategorized',
        isActive: true
      });
      await defaultCategory.save();
    }

    let fixedCount = 0;
    for (const user of providerUsers) {
      const existingProvider = await Provider.findOne({ user: user._id });
      if (!existingProvider) {
        console.log(`Missing provider profile for user: ${user.name} (${user.email}). Creating...`);
        const newProvider = new Provider({
          user: user._id,
          businessName: user.name || 'Unknown Business',
          description: 'New Service Provider (Please update profile)',
          category: defaultCategory._id,
          address: 'Update your address',
          location: {
            type: 'Point',
            coordinates: [0, 0],
          },
          verificationStatus: VerificationStatus.PENDING,
        });
        await newProvider.save();
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} missing provider profiles.`);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
