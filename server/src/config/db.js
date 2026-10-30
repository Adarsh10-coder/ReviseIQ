
import mongoose from "mongoose";

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(uri);

    console.log("✓ MongoDB Connected Successfully");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error.message);
    process.exit(1);
  }
}
