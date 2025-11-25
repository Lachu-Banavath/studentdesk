// seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Resource = require("./models/Resource");

const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/studentdesk";

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected (seed)");

    await Resource.deleteMany({});
    console.log("🧹 Cleared existing resources");

    const resources = [
      {
        title: "DBMS – CSE – 3rd Year – 2024",
        subject: "DBMS",
        type: "paper",
        branch: "CSE",
        year: "3rd Year",
        semester: "Semester 5",
        examType: "Semester Final",
        regulation: "R23",
        fileUrl: "https://example.com/dbms_cse_3rd_2024.pdf",
        size: "1.2 MB",
        downloads: 320,
      },
      {
        title: "Operating Systems – CSE – 2nd Year – 2023",
        subject: "Operating Systems",
        type: "paper",
        branch: "CSE",
        year: "2nd Year",
        semester: "Semester 3",
        examType: "Mid Exam",
        regulation: "R23",
        fileUrl: "https://example.com/os_cse_2nd_2023_mid.pdf",
        size: "980 KB",
        downloads: 210,
      },
      {
        title: "Signals & Systems – ECE – 2nd Year – 2024",
        subject: "Signals & Systems",
        type: "paper",
        branch: "ECE",
        year: "2nd Year",
        semester: "Semester 4",
        examType: "Semester Final",
        regulation: "R23",
        fileUrl: "https://example.com/signals_ece_2nd_2024.pdf",
        size: "800 KB",
        downloads: 145,
      },
      {
        title: "DBMS Unit-wise Notes (Handwritten)",
        subject: "DBMS",
        type: "note",
        branch: "CSE",
        year: "3rd Year",
        semester: "Semester 5",
        examType: "",
        regulation: "R23",
        fileUrl: "https://example.com/dbms_notes_handwritten.pdf",
        size: "3.5 MB",
        downloads: 520,
        uploader: "Topper",
        rating: 4,
      },
      {
        title: "Operating System Short Notes (One-shot)",
        subject: "Operating Systems",
        type: "note",
        branch: "CSE",
        year: "2nd Year",
        semester: "Semester 3",
        examType: "",
        regulation: "R23",
        fileUrl: "https://example.com/os_short_notes.pdf",
        size: "2.1 MB",
        downloads: 410,
        uploader: "Faculty",
        rating: 5,
      },
      {
        title: "Python Programming – 1st Year – 2024",
        subject: "Python Programming",
        type: "paper",
        branch: "CSE",
        year: "1st Year",
        semester: "Semester 1",
        examType: "Unit Test",
        regulation: "R23",
        fileUrl: "https://example.com/python_1st_year_2024.pdf",
        size: "750 KB",
        downloads: 180,
      },
      {
        title: "Engineering Mathematics – 2nd Year – 2023",
        subject: "Engineering Mathematics",
        type: "paper",
        branch: "CSE",
        year: "2nd Year",
        semester: "Semester 3",
        examType: "Semester Final",
        regulation: "R23",
        fileUrl: "https://example.com/engg_maths_2nd_2023.pdf",
        size: "1.0 MB",
        downloads: 260,
      },
      {
        title: "Computer Networks – Important Notes",
        subject: "Computer Networks",
        type: "note",
        branch: "CSE",
        year: "3rd Year",
        semester: "Semester 5",
        fileUrl: "https://example.com/cn_important_notes.pdf",
        size: "2.8 MB",
        downloads: 390,
        uploader: "Topper",
        rating: 4,
      },
    ];

    await Resource.insertMany(resources);
    console.log("🌱 Seed data inserted:", resources.length);

    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected (seed)");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
