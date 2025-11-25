// models/Resource.js
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String },
    type: {
      type: String,
      enum: ["paper", "note"],
      required: true,
    },
    branch: { type: String },
    year: { type: String },
    semester: { type: String },
    examType: { type: String },
    regulation: { type: String },
    fileUrl: { type: String },
    size: { type: String },
    downloads: { type: Number, default: 0 },
    uploader: { type: String },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
