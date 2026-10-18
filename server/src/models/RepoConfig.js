import mongoose from "mongoose";

const repoConfigSchema = new mongoose.Schema(
  {
    githubRepoId: {
      type: String,
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    repoName: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    activeAgents: {
      type: [String],
      default: ["security", "clarity", "performance"],
    },
    ignorePaths: {
      type: [String],
      default: ["dist/**", "build/**", "*.lock", "node_modules/**"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("RepoConfig", repoConfigSchema);
