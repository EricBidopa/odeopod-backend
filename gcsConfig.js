const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Path to your service account key file
const serviceKey = path.join(__dirname, './your-service-account-file.json');

const storage = new Storage({
  keyFilename: serviceKey,
});

const bucketName = 'odeopod-audio-files'; // Replace with your bucket name
const bucket = storage.bucket(bucketName);

module.exports = { bucket };
