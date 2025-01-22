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
    try {
      const fileName = `${folderName}/${require("uuid").v4()}-${
        file.originalname
      }`;
      const fileRef = bucket.file(fileName);

      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
        resumable: true,
        highWaterMark: 1024 * 1024, // 1MB chunks
        timeout: 60000, // 60 second timeout
      });

      // Handle stream errors
      stream.on("error", (error) => {
        console.error("Stream Error:", error);
        reject(error);
      });

      // Handle upload completion
      stream.on("finish", async () => {
        try {
          // Make the file public
          await fileRef.makePublic();

          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          console.log("File uploaded successfully:", fileName);
          resolve(publicUrl);
        } catch (error) {
          console.error("Make Public Error:", error);
          reject(error);
        }
      });

      // Write the file buffer to the stream
      stream.end(file.buffer);
    } catch (error) {
      console.error("Upload Setup Error:", error);
      reject(error);
    }
  });
};

// Endpoint for uploading audio files

router.post("/upload/audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    console.log("Starting audio upload:", {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const audioUrl = await uploadFileToGCS(req.file, "audio");
    res.status(200).json({ url: audioUrl });
  } catch (err) {
    console.error("Audio upload error:", err);
    res.status(500).json({
      error: "Audio upload failed",
      details: err.message,
    });
  }
});

// route to upload image
router.post("/upload/image", upload.single("coverImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    console.log("Starting image upload:", {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const imageUrl = await uploadFileToGCS(req.file, "images");
    res.status(200).json({ url: imageUrl });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({
      error: "Image upload failed",
      details: err.message,
    });
  }
});

// Route to Add New Podcast
// In your backend podcast routes file

router.post("/", async (req, res) => {
  const {
    podcastTitle,
    podcastDescription,
    podcastDownloadUrl,
    podcastCoverImgUrl,
    userId,
  } = req.body;

  // Log the received data
  console.log("Received podcast data:", {
    podcastTitle,
    podcastDescription,
    podcastDownloadUrl,
    podcastCoverImgUrl,
    userId,
  });

  // Input validation with detailed errors
  const requiredFields = {
    podcastTitle,
    podcastDescription,
    podcastDownloadUrl,
    podcastCoverImgUrl,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.error("Missing required fields:", missingFields);
    return res.status(400).json({
      error: "Missing required fields",
      missingFields,
    });
  }

  try {
    const query = `
      INSERT INTO podcasts (
        podcast_title, 
        podcast_description, 
        podcast_downloadurl, 
        podcast_coverimgurl, 
        userid
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;

    const values = [
      podcastTitle,
      podcastDescription,
      podcastDownloadUrl,
      podcastCoverImgUrl,
      userId,
    ];

    console.log("Executing query:", {
      query,
      values,
    });

    const result = await pool.query(query, values);
    console.log("Database insert successful:", result.rows[0]);

    res.status(201).json({
      message: "Podcast added successfully!",
      podcast: result.rows[0],
    });
  } catch (err) {
    console.error("Database error details:", {
      code: err.code,
      message: err.message,
      detail: err.detail,
      constraint: err.constraint,
      table: err.table,
      column: err.column,
    });

    res.status(500).json({
      error: "Failed to add podcast",
      details: err.message,
      code: err.code,
    });
  }
});

// Route to get all global podcasts with users that uploaded and show on the home page
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        *
      FROM 
        podcasts p
      JOIN 
        users u
      ON 
        p.userid = u.userid;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching podcasts with user data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/search", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    // Log the actual query value for debugging
    console.log("Search query:", query);

    const searchQuery = `
    SELECT 
      *
    FROM 
      podcasts p
    JOIN 
      users u
    ON 
      p.userid = u.userid
    WHERE 
      p.podcast_title ILIKE $1 
      OR p.podcast_description ILIKE $1 
      OR u.userusername ILIKE $1 
      OR u.userchannelname ILIKE $1
    `;
    const values = [`%${query}%`];

    const result = await pool.query(searchQuery, values);
    // console.log("Query results:", result.rows);
    return res.status(200).json(result.rows);

  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: "Failed to search podcasts" });
  }
});

// Route to get all podcasts uploaded by a specific user
router.get("/:userid", async (req, res) => {
  const { userid } = req.params;

  try {
    const query = `
      SELECT *
      FROM 
        podcasts p
      JOIN 
        users u
      ON 
        p.userid = u.userid
      WHERE 
        p.userid = $1
    `;

    const result = await pool.query(query, [userid]);

       // Return empty array instead of 404
       return res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error fetching user podcasts:", error.message);
    res
      .status(500)
      .json({ error: `Error fetching user info: ${error.message}` });
  }
});

module.exports = router;
