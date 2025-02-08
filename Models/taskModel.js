const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskOwner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  taskPlatform: {
    type: String,
    required: true,
    enum: ["x", "telegram", "tiktok", "instagram", "whatsapp", "facebook"],
  },
  taskType: {
    type: String,
    required: true,
    enum: ["like", "comment", "follower", "share"],
  },
  taskDescription: { type: String, required: true },
  taskStatus: {
    type: String,
    required: true,
    enum: ["pending", "completed", "rejected"],
  },
  taskTarget: { type: Number, required: true },
  completedTarget: { type: Number, required: true },
  taskExecutors: { type: Array },
  taskReward: { type: Number, required: true },
});
module.exports = mongoose.model("task", taskSchema);
