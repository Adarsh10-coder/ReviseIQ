import mongoose from "mongoose";

/**
 * Automatically encodes special characters in username/password
 * so unencoded characters (like '@' in passwords) don't break MongoDB SRV DNS lookups.
 */
export function normalizeMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== "string") return rawUri;

  const match = rawUri.trim().match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
  if (!match) return rawUri.trim();

  const prefix = match[1];
  const body = match[2];

  const lastAtIndex = body.lastIndexOf("@");
  if (lastAtIndex === -1) {
    return rawUri.trim();
  }

  const credentials = body.substring(0, lastAtIndex);
  const hostAndOptions = body.substring(lastAtIndex + 1);

  const colonIndex = credentials.indexOf(":");
  if (colonIndex === -1) {
    return rawUri.trim();
  }

  let user = credentials.substring(0, colonIndex);
  let pass = credentials.substring(colonIndex + 1);

  try {
    user = decodeURIComponent(user);
  } catch {}
  try {
    pass = decodeURIComponent(pass);
  } catch {}

  return `${prefix}${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hostAndOptions}`;
}

export async function connectDB() {
  try {
    const rawUri = process.env.MONGODB_URI;

    if (!rawUri) {
      throw new Error("MONGODB_URI is not configured");
    }

    const uri = normalizeMongoUri(rawUri);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✓ MongoDB Connected Successfully");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error.message);
    if (error.message.includes("ENOTFOUND")) {
      console.error(
        "💡 Hint: Check connection string syntax. Special characters in passwords (like '@') must be URL-encoded as '%40'."
      );
    } else if (
      error.message.includes("ETIMEOUT") ||
      error.message.includes("Could not connect to any servers")
    ) {
      console.error(
        "💡 Hint: Check your MongoDB Atlas Network Access. Whitelist '0.0.0.0/0' (Allow access from anywhere) so Render can connect."
      );
    }
    process.exit(1);
  }
}
