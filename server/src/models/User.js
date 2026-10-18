import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    // Encrypted AES-256 access token
    encryptedGithubToken: {
      type: String,
      required: true,
    },
    selectedRepo: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
