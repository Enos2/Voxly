import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load variables from .env

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // Make sure MONGO_URI is in your .env
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1); // Stop server if DB fails
  }
};

export default connectDB;
