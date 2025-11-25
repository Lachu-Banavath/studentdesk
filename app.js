// app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const session = require("express-session");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const Resource = require("./models/Resource");
const Student = require("./models/Student");

const app = express();

// ==== MongoDB connection ====
const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/studentdesk";

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ==== Express setup ====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// ==== Session setup ====
app.use(
  session({
    secret: process.env.SESSION_SECRET || "studentdesk-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Expose auth info to all views
app.use((req, res, next) => {
  res.locals.isAdmin = !!req.session.isAdmin;
  res.locals.student = req.session.student || null;
  next();
});

// ==== Multer setup for file uploads (local PDFs) ====
const uploadsDir = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9).toString();
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

// ==== Helpers ====
function buildFilter(query) {
  const { q, branch, year, sem, examType } = query || {};
  const filter = {};
  if (branch) filter.branch = branch;
  if (year) filter.year = year;
  if (sem) filter.semester = sem;
  if (examType) filter.examType = examType;

  if (q) {
    const regex = new RegExp(q, "i");
    filter.$or = [
      { title: regex },
      { subject: regex },
      { branch: regex },
      { year: regex },
      { semester: regex },
    ];
  }
  return filter;
}

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect("/admin/login");
  }
  next();
}

// ==== Routes ====

// Home
app.get("/", async (req, res) => {
  try {
    const filter = buildFilter(req.query);

    const papersPromise = Resource.find({
      ...filter,
      type: "paper",
    })
      .sort({ createdAt: -1 })
      .limit(6);

    const notesPromise = Resource.find({
      ...filter,
      type: "note",
    })
      .sort({ downloads: -1 })
      .limit(4);

    const recentPromise = Resource.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    const [papers, notes, recent] = await Promise.all([
      papersPromise,
      notesPromise,
      recentPromise,
    ]);

    res.render("index", {
      papers,
      notes,
      recent,
      filters: {
        q: req.query.q || "",
        branch: req.query.branch || "",
        year: req.query.year || "",
        sem: req.query.sem || "",
        examType: req.query.examType || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// /papers - list all question papers with filters + pagination
app.get("/papers", async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    filter.type = "paper";

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = 8;
    const skip = (page - 1) * limit;

    const [total, papers] = await Promise.all([
      Resource.countDocuments(filter),
      Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.render("list", {
      title: "All Question Papers",
      resources: papers,
      type: "paper",
      filters: {
        q: req.query.q || "",
        branch: req.query.branch || "",
        year: req.query.year || "",
        sem: req.query.sem || "",
        examType: req.query.examType || "",
      },
      pagination: {
        page,
        totalPages,
        total,
        basePath: "/papers",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// /notes - list all notes with filters + pagination
app.get("/notes", async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    filter.type = "note";

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = 8;
    const skip = (page - 1) * limit;

    const [total, notes] = await Promise.all([
      Resource.countDocuments(filter),
      Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.render("list", {
      title: "All Notes PDFs",
      resources: notes,
      type: "note",
      filters: {
        q: req.query.q || "",
        branch: req.query.branch || "",
        year: req.query.year || "",
        sem: req.query.sem || "",
        examType: req.query.examType || "",
      },
      pagination: {
        page,
        totalPages,
        total,
        basePath: "/notes",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// /branch/:name - list all resources for that branch
app.get("/branch/:name", async (req, res) => {
  try {
    const branchName = req.params.name;
    const filter = buildFilter(req.query);
    filter.branch = branchName;

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = 8;
    const skip = (page - 1) * limit;

    const [total, resources] = await Promise.all([
      Resource.countDocuments(filter),
      Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.render("list", {
      title: `Resources for ${branchName}`,
      resources,
      type: "all",
      filters: {
        q: req.query.q || "",
        branch: branchName,
        year: req.query.year || "",
        sem: req.query.sem || "",
        examType: req.query.examType || "",
      },
      pagination: {
        page,
        totalPages,
        total,
        basePath: `/branch/${branchName}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// /subject/:name - list all resources for that subject (case-insensitive)
app.get("/subject/:name", async (req, res) => {
  try {
    const subjectName = req.params.name;
    const filter = buildFilter(req.query);
    filter.subject = new RegExp("^" + subjectName + "$", "i");

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = 8;
    const skip = (page - 1) * limit;

    const [total, resources] = await Promise.all([
      Resource.countDocuments(filter),
      Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.render("list", {
      title: `Subject: ${subjectName}`,
      resources,
      type: "all",
      filters: {
        q: req.query.q || "",
        branch: req.query.branch || "",
        year: req.query.year || "",
        sem: req.query.sem || "",
        examType: req.query.examType || "",
      },
      pagination: {
        page,
        totalPages,
        total,
        basePath: `/subject/${subjectName}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ==== Download route with counter ====
app.get("/download/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.fileUrl) {
      return res.status(404).send("File not found");
    }
    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();
    return res.redirect(resource.fileUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing download");
  }
});

// ==== Admin auth ====

// Admin login page
app.get("/admin/login", (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect("/upload");
  }
  res.render("login", { error: null });
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = process.env.ADMIN_PASS || "admin123";

  if (username === adminUser && password === adminPass) {
    req.session.isAdmin = true;
    return res.redirect("/upload");
  }

  res.status(401).render("login", { error: "Invalid credentials" });
});

app.post("/admin/logout", (req, res) => {
  req.session.isAdmin = false;
  res.redirect("/");
});

// ==== Student auth ====

// Register page
app.get("/student/register", (req, res) => {
  if (req.session.student) {
    return res.redirect("/");
  }
  res.render("student_register", { error: null });
});

app.post("/student/register", async (req, res) => {
  try {
    const { name, rollNo, password } = req.body;
    if (!name || !rollNo || !password) {
      return res.status(400).render("student_register", {
        error: "All fields are required.",
      });
    }

    const existing = await Student.findOne({ rollNo });
    if (existing) {
      return res.status(400).render("student_register", {
        error: "Roll number already registered. Please login.",
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const student = await Student.create({
      name,
      rollNo,
      passwordHash: hash,
    });

    req.session.student = {
      id: student._id.toString(),
      name: student.name,
      rollNo: student.rollNo,
    };

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).render("student_register", {
      error: "Error registering student.",
    });
  }
});

// Student login
app.get("/student/login", (req, res) => {
  if (req.session.student) {
    return res.redirect("/");
  }
  res.render("student_login", { error: null });
});

app.post("/student/login", async (req, res) => {
  try {
    const { rollNo, password } = req.body;
    if (!rollNo || !password) {
      return res.status(400).render("student_login", {
        error: "Roll number and password are required.",
      });
    }

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(400).render("student_login", {
        error: "No student found with this roll number.",
      });
    }

    const ok = await bcrypt.compare(password, student.passwordHash);
    if (!ok) {
      return res.status(400).render("student_login", {
        error: "Incorrect password.",
      });
    }

    req.session.student = {
      id: student._id.toString(),
      name: student.name,
      rollNo: student.rollNo,
    };

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).render("student_login", {
      error: "Error logging in.",
    });
  }
});

app.post("/student/logout", (req, res) => {
  req.session.student = null;
  res.redirect("/");
});

// ==== Upload (admin only) ====
app.get("/upload", requireAdmin, (req, res) => {
  res.render("upload", { error: null });
});

app.post("/upload", requireAdmin, upload.single("pdfFile"), async (req, res) => {
  try {
    const {
      title,
      subject,
      type,
      branch,
      year,
      semester,
      examType,
      regulation,
      fileUrl,
      size,
      uploader,
      rating,
    } = req.body;

    if (!title || !type) {
      return res.status(400).render("upload", {
        error: "Title and Type are required.",
      });
    }

    let finalFileUrl = fileUrl;
    if (req.file) {
      finalFileUrl = "/uploads/" + req.file.filename;
    }

    await Resource.create({
      title,
      subject,
      type,
      branch,
      year,
      semester,
      examType,
      regulation,
      fileUrl: finalFileUrl,
      size,
      uploader,
      rating: rating ? Number(rating) : undefined,
    });

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).render("upload", {
      error: "Error uploading resource. " + err.message,
    });
  }
});

// ==== Delete resource (admin only) ====
app.post("/delete/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).send("Resource not found");
    }

    if (resource.fileUrl && resource.fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "public", resource.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Resource.findByIdAndDelete(id);
    res.redirect(req.headers.referer || "/");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Delete failed");
  }
});

// ==== Static pages ====
app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

// ==== Start server ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
