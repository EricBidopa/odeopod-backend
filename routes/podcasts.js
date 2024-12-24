const express = require("express");
const router = express.Router();
require("dotenv").config();
const { Pool } = require("pg");
const multer = require("multer");
const { bucket } = require("../gcsConfig");
const { v4: uuidv4 } = require("uuid");

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
});

// Helper function to upload files to GCS

const uploadFileToGCS = (file, folderName) => {
  return new Promise((resolve, reject) => {
    const fileName = `${folderName}/${uuidv4()}-${file.originalname}`;
    const fileRef = bucket.file(fileName);

    const stream = fileRef.createWriteStream({
      metadata: { contentType: file.mimetype },
    });

    stream.on("error", (err) => {
      console.error("File Upload Error:", err.message);
      reject(err);
    });

    stream.on("finish", async () => {
      await fileRef.makePublic();
      resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
    });

    stream.end(file.buffer);
  });
};

// Endpoint for uploading audio files
router.post("/upload/audio", upload.single("audio"), async (req, res) => {
  try {
    const audioUrl = await uploadFileToGCS(req.file, "audio");
    res.status(200).json({ url: audioUrl });
  } catch (err) {
    console.error("Audio upload failed:", err);
    res.status(500).json({ error: "Audio upload failed" });
  }
});

// Endpoint for uploading cover images
router.post("/upload/image", upload.single("coverImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  try {
    const publicUrl = await uploadFileToGCS(req.file, "images");
    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error("Image Upload Error:", error.message);
    res.status(500).json({ error: "Failed to upload cover image." });
  }
});

// Route to Add New Podcast
router.post("/", async (req, res) => {
  const {
    podcastTitle,
    podcastDescription,
    podcastDownloadUrl,
    podcastCreatedAt,
    podcastCoverImgUrl,
    userId,
  } = req.body;

  // Input validation
  if (
    !podcastTitle ||
    !podcastDescription ||
    !podcastDownloadUrl ||
    !podcastCoverImgUrl ||
    !podcastCreatedAt
  ) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const query = `
      INSERT INTO podcasts (
        podcastTitle, 
        podcastDescription, 
        podcastDownloadUrl, 
        podcastCreatedAt,
        podcastCoverImgUrl, 
        userId
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    const values = [
      podcastTitle,
      podcastDescription,
      podcastDownloadUrl,
      podcastCreatedAt,
      podcastCoverImgUrl,
      userId,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Podcast added successfully!",
      podcast: result.rows[0],
    });
  } catch (err) {
    console.error("Database Insert Error:", err.message);
    res
      .status(500)
      .json({ error: "Failed to add podcast. Please try again later." });
  }
});

module.exports = router;
