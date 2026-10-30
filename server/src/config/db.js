import mongoose from "mongoose";

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log("✓ MongoDB Connected Successfully");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error.message);
    if (error.message.includes("ENOTFOUND")) {
      console.error(
        "💡 Hint: Check connection string syntax. Special characters in passwords (like '@') must be URL-encoded as '%40'."
      );
    } else if (error.message.includes("Could not connect to any servers")) {
      console.error(
        "💡 Hint: Check your MongoDB Atlas Network Access. Whitelist '0.0.0.0/0' (Allow access from anywhere) so Render can connect."
      );
    }
    process.exit(1);
  }
}
