const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Path to your service account key file
const serviceKey = path.join(__dirname, './odeopod-a574a7b7ee48.json');

const storage = new Storage({
  keyFilename: serviceKey,
});

const bucketName = 'odeopod-audio-files';
const bucket = storage.bucket(bucketName);

module.exports = { bucket };
