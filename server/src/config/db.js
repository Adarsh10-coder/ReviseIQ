import mongoose from "mongoose";

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/reviseiq";
    await mongoose.connect(uri);
    console.log("✓ MongoDB Connected:", uri);
  } catch (error) {
    console.error("✗ MongoDB connection error:", error.message);
    process.exit(1);
  }
}
