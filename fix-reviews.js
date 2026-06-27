const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://adilmohmed2964_db_user:9k1mEwvLPyZyRTc5@cluster0.wgetesp.mongodb.net/servicehub?appName=Cluster0';

async function fix() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  await db.collection('reviews').updateOne(
    { _id: new mongoose.Types.ObjectId('6a3f99fccb40932ab121b01f') },
    { $set: { customer: new mongoose.Types.ObjectId('6a3e070b988057c5e6c16ccf') } }
  );
  console.log('Fixed');
  process.exit(0);
}
fix();
