const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://adilmohmed2964_db_user:9k1mEwvLPyZyRTc5@cluster0.wgetesp.mongodb.net/servicehub?appName=Cluster0';

const categoriesToSeed = [
  { name: 'Air Conditioning', slug: 'ac-repair', icon: 'Wind', isActive: true },
  { name: 'Plumbing Services', slug: 'plumbing', icon: 'Droplet', isActive: true },
  { name: 'Electrical Help', slug: 'electrician', icon: 'Zap', isActive: true },
  { name: 'Home Cleaning', slug: 'cleaning', icon: 'Brush', isActive: true },
  { name: 'Carpentry & Woodwork', slug: 'carpenter', icon: 'Hammer', isActive: true },
  { name: 'Appliance Repair', slug: 'appliance-repair', icon: 'Cpu', isActive: true },
  { name: 'Salon & Grooming', slug: 'salon', icon: 'Scissors', isActive: true },
  { name: 'Gardening & Landscaping', slug: 'gardening', icon: 'Leaf', isActive: true },
  { name: 'Smart Home Setup', slug: 'smart-home', icon: 'Home', isActive: true },
];

async function clearAndSeed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const db = mongoose.connection.db;

    // List of collections to completely clear
    const collectionsToClear = [
      'users',
      'providers',
      'bookings',
      'conversations',
      'messages',
      'notifications',
      'payments',
      'reviews',
      'services',
      'banners',
      'disputes',
      'categories'
    ];

    console.log('Clearing all collections...');
    for (const colName of collectionsToClear) {
      try {
        const result = await db.collection(colName).deleteMany({});
        console.log(`- Cleared "${colName}": deleted ${result.deletedCount} documents`);
      } catch (err) {
        console.log(`- Collection "${colName}" does not exist or couldn't be cleared (skipping).`);
      }
    }

    console.log('Seeding initial categories...');
    const seededCats = await db.collection('categories').insertMany(
      categoriesToSeed.map(cat => ({
        ...cat,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    console.log(`Successfully seeded ${Object.keys(seededCats.insertedIds).length} standard categories.`);

    console.log('Hashing admin password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('adminpassword123', salt);

    console.log('Seeding primary Admin account...');
    await db.collection('users').insertOne({
      name: 'Platform Admin',
      email: 'admin@servicehub.com',
      password: hashedPassword,
      role: 'ADMIN',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Successfully created Admin account!');
    console.log('----------------------------------------------------');
    console.log('Admin Email: admin@servicehub.com');
    console.log('Admin Password: adminpassword123');
    console.log('----------------------------------------------------');

  } catch (error) {
    console.error('Error during database reset/seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);
  }
}

clearAndSeed();
