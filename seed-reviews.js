const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://adilmohmed2964_db_user:9k1mEwvLPyZyRTc5@cluster0.wgetesp.mongodb.net/servicehub?appName=Cluster0';

async function seedReviews() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Delete existing reviews for a fresh start
    await db.collection('reviews').deleteMany({});

    // Fetch some customers and providers to link
    const customers = await db.collection('users').find({ role: 'CUSTOMER' }).limit(3).toArray();
    const providers = await db.collection('providers').find({}).limit(1).toArray();
    
    const customer1 = customers[0] ? customers[0]._id : new mongoose.Types.ObjectId();
    const customer2 = customers[1] ? customers[1]._id : new mongoose.Types.ObjectId();
    const customer3 = customers[2] ? customers[2]._id : new mongoose.Types.ObjectId();
    const providerId = providers[0] ? providers[0]._id : new mongoose.Types.ObjectId();

    const reviews = [
      {
        booking: new mongoose.Types.ObjectId(),
        customer: customer1,
        provider: providerId,
        rating: 5,
        comment: "Booking a cleaner through ServiceHub was incredibly straightforward. The provider was right on time and did an exceptional job deep cleaning my kitchen!",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
      },
      {
        booking: new mongoose.Types.ObjectId(),
        customer: customer2,
        provider: providerId,
        rating: 5,
        comment: "The AC servicing is top-notch. Flat rates are clear upfront, so I didn't have to negotiate or argue. Alex Mercer was professional, polite, and quick!",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
      },
      {
        booking: new mongoose.Types.ObjectId(),
        customer: customer3,
        provider: providerId,
        rating: 4,
        comment: "Excellent interface and high-quality profiles. The custom calendar availability was very convenient to plan bookings around my office schedule.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
      }
    ];

    await db.collection('reviews').insertMany(reviews);
    console.log('Successfully inserted 3 reviews!');

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedReviews();
