const express = require("express");
const router = express.Router();
require("dotenv").config();
const { Pool } = require("pg");
const multer = require('multer');
const { bucket } = require('../gcsConfig');
const { v4: uuidv4 } = require('uuid'); // For generating unique file names




// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


const upload = multer({
  storage: multer.memoryStorage(), // Files are stored in memory before being uploaded to GCS
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB file size limit
});

// Endpoint for uploading audio files
router.post('/upload/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const fileName = `audio/${uuidv4()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    // Create a stream to upload the file
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (err) => {
      console.error(err);
      return res.status(500).send('Failed to upload file.');
    });

    stream.on('finish', async () => {
      // Make the file public (optional)
      await file.makePublic();

      // Generate a public URL for the uploaded file
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      res.status(200).json({ url: publicUrl });
    });

    stream.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error.');
  }
});

// Endpoint for uploading cover images
router.post('/upload/cover', upload.single('coverImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const fileName = `images/${uuidv4()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (err) => {
      console.error(err);
      return res.status(500).send('Failed to upload file.');
    });

    stream.on('finish', async () => {
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      res.status(200).json({ url: publicUrl });
    });

    stream.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error.');
  }
});


// Route to Add New Podcast
router.post("/", async (req, res) => {
  const {
    podcastTitle,
    podcastDescription,
    podcastDownloadUrl,
    podcastUploadedBy,
    podcastCoverImgUrl,
    podcastCreatedAt,
  } = req.body;

  // Input validation
  if (
    !podcastTitle ||
    !podcastDescription ||
    !podcastDownloadUrl ||
    !podcastUploadedBy ||
    !podcastCoverImgUrl ||
    !podcastCreatedAt
  ) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO podcasts (
        podcastTitle, 
        podcastDescription, 
        podcastDownloadUrl, 
        podcastUploadedBy, 
        podcastCoverImgUrl, 
        podcastCreatedAt
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        podcastTitle,
        podcastDescription,
        podcastDownloadUrl,
        podcastUploadedBy,
        podcastCoverImgUrl,
        podcastCreatedAt,
      ]
    );

    // Send success response
    res.status(201).json({
      message: "Podcast added successfully!",
      podcast: result.rows[0],
    });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: `Error inserting podcast: ${err.message}` });
  }
});

module.exports = router;
