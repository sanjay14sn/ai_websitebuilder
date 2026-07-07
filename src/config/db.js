import mongoose from 'mongoose';
import User from '../models/User.js';

const GRIP_ADMIN_MOBILES = (process.env.GRIP_ADMIN_MOBILES || '9988776655,9944270374,9551205555')
  .split(',')
  .map((mobile) => mobile.trim())
  .filter(Boolean);

const normalizeMobile = (value = '') => value.replace(/\D/g, '');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-website-builder';
    console.log(`Connecting to MongoDB at: ${connUri}`);
    const conn = await mongoose.connect(connUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default admin user for internal tool
    const adminExists = await User.findOne({ email: 'admin@builder.com' });
    if (!adminExists) {
      console.log('Seeding default admin user...');
      await User.create({
        username: 'admin',
        email: 'admin@builder.com',
        password: 'adminpassword',
        role: 'admin',
      });
      console.log('Default admin user created: admin@builder.com / adminpassword');
    }

    // Seed GRIP mobile admin accounts
    for (const mobile of GRIP_ADMIN_MOBILES) {
      const normalizedMobile = normalizeMobile(mobile);
      const email = `${normalizedMobile}@grip.admin`;

      const existing = await User.findOne({
        $or: [{ mobileNumber: normalizedMobile }, { email }],
      });

      if (!existing) {
        await User.create({
          username: `admin-${normalizedMobile}`,
          email,
          mobileNumber: normalizedMobile,
          password: '1234',
          role: 'admin',
        });
        console.log(`GRIP admin user created for mobile: ${normalizedMobile}`);
      } else if (existing.role !== 'admin' || existing.mobileNumber !== normalizedMobile) {
        existing.role = 'admin';
        existing.mobileNumber = normalizedMobile;
        await existing.save();
        console.log(`GRIP admin user updated for mobile: ${normalizedMobile}`);
      }
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
