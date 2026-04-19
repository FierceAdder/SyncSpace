const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Generate a presigned PUT URL for direct client-side upload.
 * @param {string} key - S3 object key (e.g., "uploads/abc123/file.pdf")
 * @param {string} contentType - MIME type of the file
 * @param {number} expiresIn - URL expiry in seconds (default 15 min)
 * @returns {Promise<string>} presigned URL
 */
async function generatePresignedUploadUrl(key, contentType, expiresIn = 900) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType
    });
    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned GET URL for secure file download.
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 * @returns {Promise<string>} presigned URL
 */
async function generatePresignedDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });
    return getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = {
    s3Client,
    generatePresignedUploadUrl,
    generatePresignedDownloadUrl
};
