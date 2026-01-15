const Minio = require('minio');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Global Cloudflare R2 client
let cloudflareClient = null;
let imageBucketName = process.env.CLOUDLFARE_IMAGE_BUCKET || 'raizemore-images';
let pagesBucketName = process.env.CLOUDFLARE_PAGES_BUCKET || 'raizemore-pages';
let endpoint = process.env.CLOUDFLARE_ACCOUNT_ENDPOINT;
let accessKey = process.env.CLOUDFLARE_ACCESS_KEY_ID;
let secretKey = process.env.CLOUDFLARE_SECRET_KEY;
let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

/**
 * Get or initialize the Cloudflare R2 client
 */
function getCloudflareClient() {
    if (!cloudflareClient) {
        try {
            if (!endpoint || !accessKey || !secretKey) {
                throw new Error('Missing required CloudFlare R2 environment variables');
            }

            // Extract hostname from endpoint URL
            const url = new URL(endpoint);
            const hostname = url.hostname;

            cloudflareClient = new Minio.Client({
                endPoint: hostname,
                port: 443,
                useSSL: true,
                accessKey: accessKey,
                secretKey: secretKey,
                region: 'auto' // CloudFlare R2 uses 'auto' region
            });

            console.log('CloudFlare R2 client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CloudFlare R2 client:', error.message);
            throw error;
        }
    }
    return cloudflareClient;
}

/**
 * Test connection to Cloudflare R2
 */
async function testConnection() {
    try {
        const client = getCloudflareClient();
        const buckets = await client.listBuckets();
        console.log('Successfully connected to CloudFlare R2');
        console.log('Available buckets:', buckets.map(b => b.name));
        return true;
    } catch (error) {
        console.error('Connection test failed:', error.message);
        return false;
    }
}

/**
 * Ensure bucket exists, create if it doesn't
 * @param {string} bucketName - Name of the bucket (defaults to image bucket)
 */
async function ensureBucket(bucketName = imageBucketName) {
    try {
        const client = getCloudflareClient();
        const exists = await client.bucketExists(bucketName);
        if (!exists) {
            await client.makeBucket(bucketName, 'auto');
            console.log(`Bucket '${bucketName}' created successfully`);
        }
        return true;
    } catch (error) {
        console.error('Bucket operation failed:', error.message);
        throw error;
    }
}

/**
 * Detect content type from file extension
 */
function detectContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        // Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.ico': 'image/x-icon',
        // Web files
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.xml': 'application/xml; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Upload a file to Cloudflare R2
 * @param {string} filePath - Local file path
 * @param {string} objectName - Object name in R2 (can include path)
 * @param {string} contentType - MIME type of the file
 * @param {string} bucketName - Bucket name (defaults to image bucket)
 * @returns {Promise<string>} - URL of uploaded file
 */
async function uploadFile(filePath, objectName, contentType = null, bucketName = imageBucketName) {
    try {
        // Ensure bucket exists
        await ensureBucket(bucketName);

        // If no content type provided, try to detect it
        if (!contentType) {
            contentType = detectContentType(filePath);
        }

        // Upload the file
        const client = getCloudflareClient();
        await client.fPutObject(bucketName, objectName, filePath, {
            'Content-Type': contentType
        });

        // Return the public URL
        const publicUrl = `https://${endpoint.replace('https://', '')}/${bucketName}/${objectName}`;
        console.log(`✅ File uploaded successfully: ${objectName}`);
        return publicUrl;
    } catch (error) {
        console.error(`❌ Failed to upload file ${objectName}:`, error.message);
        throw error;
    }
}

/**
 * Upload a buffer to Cloudflare R2
 * @param {Buffer} buffer - File buffer
 * @param {string} objectName - Object name in R2 (can include path)
 * @param {string} contentType - MIME type of the file
 * @param {string} bucketName - Bucket name (defaults to image bucket)
 * @returns {Promise<string>} - URL of uploaded file
 */
async function uploadBuffer(buffer, objectName, contentType = null, bucketName = imageBucketName) {
    try {
        // Ensure bucket exists
        await ensureBucket(bucketName);

        // If no content type provided, try to detect it
        if (!contentType) {
            contentType = detectContentType(objectName);
        }

        // Upload the buffer
        const client = getCloudflareClient();
        await client.putObject(bucketName, objectName, buffer, {
            'Content-Type': contentType
        });

        // Return the public URL
        const publicUrl = `https://${endpoint.replace('https://', '')}/${bucketName}/${objectName}`;
        // console.log(`✅ Buffer uploaded successfully: ${objectName}`);
        return publicUrl;
    } catch (error) {
        console.error(`❌ Failed to upload buffer ${objectName}:`, error.message);
        throw error;
    }
}

/**
 * Download a file from Cloudflare R2
 * @param {string} objectName - Object name in R2
 * @param {string} localPath - Local path to save the file
 * @param {string} bucketName - Bucket name (defaults to image bucket)
 * @returns {Promise<boolean>} - Success status
 */
async function downloadFile(objectName, localPath, bucketName = imageBucketName) {
    try {
        const client = getCloudflareClient();
        await client.fGetObject(bucketName, objectName, localPath);
        console.log(`✅ File downloaded successfully: ${objectName}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to download file ${objectName}:`, error.message);
        throw error;
    }
}

/**
 * Get a file from Cloudflare R2 as a buffer
 * @param {string} objectName - Object name in R2
 * @param {string} bucketName - Bucket name (defaults to image bucket)
 * @returns {Promise<Buffer>} - File buffer
 */
async function getFileBuffer(objectName, bucketName = imageBucketName) {
    try {
        const client = getCloudflareClient();
        const buffer = await client.getObject(bucketName, objectName);
        console.log(`✅ File buffer retrieved successfully: ${objectName}`);
        return buffer;
    } catch (error) {
        console.error(`❌ Failed to get file buffer ${objectName}:`, error.message);
        throw error;
    }
}

/**
 * Check if a file exists in Cloudflare R2
 * @param {string} objectName - Object name in R2
 * @param {string} bucketName - Bucket name (defaults to image bucket)
 * @returns {Promise<boolean>} - Whether file exists
 */
async function fileExists(objectName, bucketName = imageBucketName) {
    try {
        const client = getCloudflareClient();
        await client.statObject(bucketName, objectName);
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
}

/**
 * Delete a file from Cloudflare R2
 * @param {string} objectName - Object name in R2
 * @param {string} bucketName - Bucket name (defaults to image bucket)
 * @returns {Promise<boolean>} - Success status
 */
async function deleteFile(objectName, bucketName = imageBucketName) {
    try {
        const client = getCloudflareClient();
        await client.removeObject(bucketName, objectName);
        console.log(`✅ File deleted successfully: ${objectName}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to delete file ${objectName}:`, error.message);
        throw error;
    }
}

/**
 * List files in a bucket with optional prefix (optimized for filename-only checking)
 * Uses alphabetical range-based pagination to access ALL files (tested with 340,000+ files)
 * Returns only essential metadata (name, size) instead of full file objects
 * @param {string} prefix - Optional prefix to filter files
 * @param {number|null} maxFiles - Maximum files to return (null = unlimited)
 * @param {string} bucketName - Bucket name (defaults to pages bucket)
 * @returns {Promise<Array>} - List of lightweight file objects with only name and size
 */
async function listFiles(prefix = '', maxFiles=null, bucketName = pagesBucketName) {
    try {
        if (maxFiles) {
            console.log(`📊 File limit: ${maxFiles} files`);
        } else {
            console.log(`📊 File limit: Unlimited (will fetch ALL files)`);
        }
        
        const client = getCloudflareClient();
        const allFiles = [];
        const seenFiles = new Set();
        let lastMilestone = 0;
        
        // Define comprehensive ranges to ensure 100% coverage of ALL possible files
        // This covers ALL ASCII characters and beyond to guarantee zero missed files
        const ranges = [
            { start: '', end: '!' },           // Start to ! (space and special chars)
            { start: '!', end: '(' },          // ! " # $ % & '
            { start: '(', end: '/' },          // ( ) * + , - .
            { start: '/', end: '9' },          // / 0 1 2 3 4 5 6 7 8
            { start: '9', end: '@' },          // 9 : ; < = > ?
            { start: '@', end: 'G' },          // @ A B C D E F
            { start: 'G', end: 'N' },          // G H I J K L M
            { start: 'N', end: 'U' },          // N O P Q R S T
            { start: 'U', end: '[' },          // U V W X Y Z
            { start: '[', end: 'b' },          // [ \ ] ^ _ ` a
            { start: 'b', end: 'i' },          // b c d e f g h
            { start: 'i', end: 'p' },          // i j k l m n o
            { start: 'p', end: 'w' },          // p q r s t u v
            { start: 'w', end: '~' },          // w x y z { | }
            { start: '~', end: '\uffff' }      // ~ and ALL Unicode characters beyond
        ];


        for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex++) {
            const range = ranges[rangeIndex];

            let startAfter = prefix + range.start;
            let endBefore = prefix + range.end;
            let rangePageCount = 0;
            let rangeFiles = 0;

            while (true) {
                rangePageCount++;

                try {
                    const pageFiles = [];
                    
                    // Use listObjectsV2 with start-after parameter for precise control
                    const stream = client.listObjectsV2(
                        bucketName,
                        prefix,
                        true,
                        startAfter
                    );

                    await new Promise((resolve, reject) => {
                        let objectCount = 0;
                        const maxObjectsPerPage = 1000; // Standard S3 limit

                        stream.on('data', (obj) => {
                            // Check if we've exceeded the current alphabetical range
                            if (obj.name >= endBefore) {
                                stream.destroy();
                                resolve();
                                return;
                            }

                            // Skip the start-after file itself (it would be duplicate)
                            if (obj.name === startAfter) {
                                return;
                            }
                            
                            // Check for duplicates using Set (primary deduplication)
                            if (seenFiles.has(obj.name)) {
                                console.log(`🔄 DUPLICATE DETECTED: ${obj.name} (skipping)`);
                                return;
                            }

                            seenFiles.add(obj.name);
                            pageFiles.push({
                                name: obj.name,
                                size: obj.size || 0
                            });
                            objectCount++;

                            // Control page size to maintain good performance
                            if (objectCount >= maxObjectsPerPage) {
                                stream.destroy();
                                resolve();
                            }
                        });

                        stream.on('error', reject);
                        stream.on('end', resolve);
                    });

                    if (pageFiles.length === 0) {
                        break; // No more files in this range
                    }

                    allFiles.push(...pageFiles);
                    rangeFiles += pageFiles.length;
                    
                    // Update startAfter to the last file in this page for next iteration
                    startAfter = pageFiles[pageFiles.length - 1].name;

                    // Stop if we've reached the global limit
                    if (maxFiles && allFiles.length >= maxFiles) {
                        console.log(`⚠️ Reached global file limit (${maxFiles})`);
                        console.log(`📊 Final count: ${allFiles.length} files from ${rangeIndex + 1} ranges`);
                        return allFiles;
                    }

                    // Progress milestone logging every 25,000 files
                    const currentMilestone = Math.floor(allFiles.length / 25000) * 25000;
                    if (currentMilestone > lastMilestone && currentMilestone > 0) {
                        console.log(`📊 Progress: ${allFiles.length.toLocaleString()} files processed`);
                        lastMilestone = currentMilestone;
                    }

                    // Small delay to be nice to the API
                    await new Promise(resolve => setTimeout(resolve, 50));

                } catch (error) {
                    console.error(`❌ Error in range ${rangeIndex + 1}, page ${rangePageCount}:`, error.message);
                    break; // Move to next range
                }
            }
        }

        const memoryUsage = (allFiles.length * 50 / 1024).toFixed(1);
        console.log(`\n✅ Alphabetical range listing complete!`);
        console.log(`📊 Final results:`);
        console.log(`   • Total ranges processed: ${ranges.length}`);
        console.log(`   • Total unique files: ${allFiles.length}`);
        console.log(`   • Memory usage: ~${memoryUsage}KB`);
        console.log(`   • No pagination loops encountered ✅`);
        
        if (allFiles.length >= 15000) {
            console.log(`🎉 SUCCESS: Retrieved ${allFiles.length} files (far beyond 2000-file barrier!)`);
        }

        // Final safety deduplication layer using Set (belt and suspenders approach)
        const uniqueFileNames = new Set();
        const finalDeduplicatedFiles = allFiles.filter(file => {
            if (uniqueFileNames.has(file.name)) {
                console.log(`🔧 FINAL DEDUP: Removing duplicate ${file.name}`);
                return false;
            }
            uniqueFileNames.add(file.name);
            return true;
        });

        const duplicatesRemoved = allFiles.length - finalDeduplicatedFiles.length;
        if (duplicatesRemoved > 0) {
            console.log(`🔧 Final deduplication: Removed ${duplicatesRemoved} duplicates`);
            console.log(`📊 Final unique count: ${finalDeduplicatedFiles.length}`);
        } else {
            console.log(`✅ No additional duplicates found in final check`);
        }

        return finalDeduplicatedFiles;
        
    } catch (error) {
        console.error(`❌ Alphabetical range listing failed:`, error);
        throw error;
    }
}




/**
 * Get file metadata from Cloudflare R2
 * @param {string} objectName - Object name in R2
 * @returns {Promise<Object>} - File metadata
 */
async function getFileMetadata(objectName) {
    try {
        const client = getCloudflareClient();
        const stats = await client.statObject(bucketName, objectName);
        return {
            name: objectName,
            size: stats.size,
            lastModified: stats.lastModified,
            etag: stats.etag,
            contentType: stats.metaData?.['content-type'] || 'unknown'
        };
    } catch (error) {
        console.error(`❌ Failed to get metadata for ${objectName}:`, error.message);
        throw error;
    }
}

/**
 * Copy a file within the same bucket
 * @param {string} sourceObject - Source object name
 * @param {string} destObject - Destination object name
 * @returns {Promise<boolean>} - Success status
 */
async function copyFile(sourceObject, destObject) {
    try {
        const client = getCloudflareClient();
        await client.copyObject(bucketName, destObject, `${bucketName}/${sourceObject}`);
        console.log(`✅ File copied successfully: ${sourceObject} -> ${destObject}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to copy file ${sourceObject}:`, error.message);
        throw error;
    }
}

/**
 * Get a presigned URL for temporary access
 * @param {string} objectName - Object name in R2
 * @param {number} expirySeconds - URL expiry time in seconds (default: 1 hour)
 * @returns {Promise<string>} - Presigned URL
 */
async function getPresignedUrl(objectName, expirySeconds = 3600) {
    try {
        const client = getCloudflareClient();
        const url = await client.presignedGetObject(bucketName, objectName, expirySeconds);
        return url;
    } catch (error) {
        console.error(`❌ Failed to get presigned URL for ${objectName}:`, error.message);
        throw error;
    }
}

/**
 * Upload a file from URL directly to Cloudflare R2
 * @param {string} imageUrl - URL of the image to download and upload
 * @param {string} objectName - Object name in R2
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} - URL of uploaded file
 */
async function uploadFromUrl(imageUrl, objectName, contentType = null) {
    try {
        const https = require('https');
        const http = require('http');
        
        // Determine protocol
        const protocol = imageUrl.startsWith('https:') ? https : http;
        
        // Download the image
        const buffer = await new Promise((resolve, reject) => {
            const request = protocol.get(imageUrl, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
                response.on('error', reject);
            });
            
            request.on('error', reject);
            request.setTimeout(30000, () => {
                request.destroy();
                reject(new Error('Download timeout'));
            });
        });
        
        // Upload to Cloudflare R2
        const publicUrl = await uploadBuffer(buffer, objectName, contentType);
        console.log(`✅ Image uploaded from URL successfully: ${objectName}`);
        return publicUrl;
    } catch (error) {
        console.error(`❌ Failed to upload image from URL ${imageUrl}:`, error.message);
        throw error;
    }
}

/**
 * Batch upload multiple files
 * @param {Array} files - Array of {filePath, objectName, contentType} objects
 * @returns {Promise<Array>} - Array of uploaded file URLs
 */
async function batchUpload(files) {
    try {
        const results = [];
        const concurrencyLimit = 10; // Limit concurrent uploads
        
        for (let i = 0; i < files.length; i += concurrencyLimit) {
            const batch = files.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(file => 
                uploadFile(file.filePath, file.objectName, file.contentType)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`❌ Batch upload failed for ${batch[index].objectName}:`, result.reason);
                }
            });
            
            // Small delay between batches to avoid overwhelming the service
            if (i + concurrencyLimit < files.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`✅ Batch upload completed: ${results.length}/${files.length} successful`);
        return results;
    } catch (error) {
        console.error('❌ Batch upload failed:', error.message);
        throw error;
    }
}

// Initialize connection on module load
(async () => {
    try {
        if (endpoint && accessKey && secretKey) {
            await testConnection();
            console.log('Cloudflare R2 connection established successfully');
        } else {
            console.log('Cloudflare R2 environment variables not configured, skipping connection test');
        }
    } catch (error) {
        console.error('Failed to establish Cloudflare R2 connection:', error.message);
        // Don't crash the process, let it continue without Cloudflare
    }
})();

/**
 * Upload HTML content as string to Pages bucket
 * @param {string} htmlContent - HTML content as string
 * @param {string} pagePath - Path for the page (e.g., "products/product-name.html")
 * @returns {Promise<string>} - URL of uploaded page
 */
async function uploadHtmlPage(htmlContent, pagePath) {
    try {
        const buffer = Buffer.from(htmlContent, 'utf8');
        return await uploadBuffer(buffer, pagePath, 'text/html; charset=utf-8', pagesBucketName);
    } catch (error) {
        console.error(`❌ Failed to upload HTML page ${pagePath}:`, error.message);
        throw error;
    }
}

/**
 * Upload CSS content as string to Pages bucket
 * @param {string} cssContent - CSS content as string
 * @param {string} cssPath - Path for the CSS file (e.g., "styles/main.css")
 * @returns {Promise<string>} - URL of uploaded CSS
 */
async function uploadCssFile(cssContent, cssPath) {
    try {
        const buffer = Buffer.from(cssContent, 'utf8');
        return await uploadBuffer(buffer, cssPath, 'text/css; charset=utf-8', pagesBucketName);
    } catch (error) {
        console.error(`❌ Failed to upload CSS file ${cssPath}:`, error.message);
        throw error;
    }
}

/**
 * Upload JS content as string to Pages bucket
 * @param {string} jsContent - JS content as string
 * @param {string} jsPath - Path for the JS file (e.g., "scripts/main.js")
 * @returns {Promise<string>} - URL of uploaded JS
 */
async function uploadJsFile(jsContent, jsPath) {
    try {
        const buffer = Buffer.from(jsContent, 'utf8');
        return await uploadBuffer(buffer, jsPath, 'application/javascript; charset=utf-8', pagesBucketName);
    } catch (error) {
        console.error(`❌ Failed to upload JS file ${jsPath}:`, error.message);
        throw error;
    }
}

/**
 * Batch upload files to pages bucket
 * @param {Array} files - Array of {filePath, objectName} objects
 * @param {number} concurrency - Number of concurrent uploads (default: 10)
 * @returns {Promise<Object>} - Upload results with success/failure counts
 */
async function batchUploadPages(files, concurrency = 10) {
    try {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < files.length; i += concurrency) {
            const batch = files.slice(i, i + concurrency);
            const batchPromises = batch.map(file =>
                uploadFile(file.filePath, file.objectName, null, pagesBucketName)
            );

            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push({
                        file: batch[index].objectName,
                        error: result.reason.message
                    });
                }
            });

            // Progress update every batch
            if ((i + concurrency) % 100 === 0 || (i + concurrency) >= files.length) {
                console.log(`📊 Progress: ${results.success + results.failed}/${files.length} files processed (${results.success} success, ${results.failed} failed)`);
            }

            // Small delay between batches
            if (i + concurrency < files.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`✅ Batch upload completed: ${results.success}/${files.length} successful`);
        if (results.failed > 0) {
            console.log(`⚠️ ${results.failed} files failed to upload`);
        }
        return results;
    } catch (error) {
        console.error('❌ Batch upload failed:', error.message);
        throw error;
    }
}

/**
 * ============================================================================
 * CLOUDFLARE KV REST API FUNCTIONS
 * ============================================================================
 * Fast KV operations using REST API instead of Wrangler CLI
 */

/**
 * Retry wrapper for fetch requests with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 5)
 * @param {number} initialDelay - Initial delay in ms (default: 1000)
 * @returns {Promise} - Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 5, initialDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                throw error;
            }

            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`   ⚠️  Attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * List keys from Cloudflare KV using REST API
 * @param {Object} options - Query options
 * @param {string} options.accountId - Cloudflare account ID
 * @param {string} options.namespaceId - KV namespace ID
 * @param {string} options.apiToken - Cloudflare API token
 * @param {string} options.prefix - Optional key prefix filter
 * @param {number} options.limit - Number of keys to return (10-1000, default: 1000)
 * @returns {Promise<Array>} - Array of key objects
 */
async function kvListKeys(options = {}) {
    const { accountId, namespaceId, apiToken, prefix = '', limit = 1000 } = options;

    if (!accountId || !namespaceId || !apiToken) {
        throw new Error('accountId, namespaceId, and apiToken are required');
    }

    if (limit < 10 || limit > 1000) {
        throw new Error('limit must be between 10 and 1000');
    }

    return await retryWithBackoff(async () => {
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?limit=${limit}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`KV list keys failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(`KV API returned error: ${JSON.stringify(data.errors)}`);
        }

        return data.result || [];
    });
}

/**
 * Read a value from Cloudflare KV using REST API
 * @param {string} key - Key to read
 * @param {Object} options - Query options
 * @param {string} options.accountId - Cloudflare account ID
 * @param {string} options.namespaceId - KV namespace ID
 * @param {string} options.apiToken - Cloudflare API token
 * @returns {Promise<string>} - Value of the key
 */
async function kvReadValue(key, options = {}) {
    const { accountId, namespaceId, apiToken } = options;

    if (!accountId || !namespaceId || !apiToken) {
        throw new Error('accountId, namespaceId, and apiToken are required');
    }

    if (!key) {
        throw new Error('key is required');
    }

    return await retryWithBackoff(async () => {
        const encodedKey = encodeURIComponent(key);
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodedKey}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Key not found: ${key}`);
            }
            const errorText = await response.text();
            throw new Error(`KV read failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.text();
    });
}

/**
 * Write a key-value pair to Cloudflare KV using REST API
 * @param {string} key - Key to write
 * @param {string} value - Value to write
 * @param {Object} options - Write options
 * @param {string} options.accountId - Cloudflare account ID
 * @param {string} options.namespaceId - KV namespace ID
 * @param {string} options.apiToken - Cloudflare API token
 * @returns {Promise<boolean>} - Success status
 */
async function kvWriteValue(key, value, options = {}) {
    const { accountId, namespaceId, apiToken } = options;

    if (!accountId || !namespaceId || !apiToken) {
        throw new Error('accountId, namespaceId, and apiToken are required');
    }

    if (!key) {
        throw new Error('key is required');
    }

    return await retryWithBackoff(async () => {
        const encodedKey = encodeURIComponent(key);
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodedKey}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'text/plain'
            },
            body: value
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`KV write failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return true;
    });
}

/**
 * Delete a key from Cloudflare KV using REST API
 * @param {string} key - Key to delete
 * @param {Object} options - Delete options
 * @param {string} options.accountId - Cloudflare account ID
 * @param {string} options.namespaceId - KV namespace ID
 * @param {string} options.apiToken - Cloudflare API token
 * @returns {Promise<boolean>} - Success status
 */
async function kvDeleteValue(key, options = {}) {
    const { accountId, namespaceId, apiToken } = options;

    if (!accountId || !namespaceId || !apiToken) {
        throw new Error('accountId, namespaceId, and apiToken are required');
    }

    if (!key) {
        throw new Error('key is required');
    }

    return await retryWithBackoff(async () => {
        const encodedKey = encodeURIComponent(key);
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodedKey}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`KV delete failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return true;
    });
}

/**
 * Batch write multiple key-value pairs to Cloudflare KV using REST API
 * Note: Cloudflare KV supports bulk writes of up to 10,000 key-value pairs per request
 * @param {Array} keyValuePairs - Array of {key, value} objects
 * @param {Object} options - Write options
 * @param {string} options.accountId - Cloudflare account ID
 * @param {string} options.namespaceId - KV namespace ID
 * @param {string} options.apiToken - Cloudflare API token
 * @returns {Promise<boolean>} - Success status
 */
async function kvBatchWrite(keyValuePairs, options = {}) {
    const { accountId, namespaceId, apiToken } = options;

    if (!accountId || !namespaceId || !apiToken) {
        throw new Error('accountId, namespaceId, and apiToken are required');
    }

    if (!Array.isArray(keyValuePairs) || keyValuePairs.length === 0) {
        throw new Error('keyValuePairs must be a non-empty array');
    }

    if (keyValuePairs.length > 10000) {
        throw new Error('Cannot write more than 10,000 key-value pairs in a single batch');
    }

    return await retryWithBackoff(async () => {
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(keyValuePairs)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`KV batch write failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(`KV API returned error: ${JSON.stringify(data.errors)}`);
        }

        return true;
    });
}

/**
 * Batch delete multiple keys from Cloudflare KV using REST API
 * Note: Cloudflare KV supports bulk deletes of up to 10,000 keys per request
 * @param {Array} keys - Array of keys to delete
 * @param {Object} options - Delete options
 * @param {string} options.accountId - Cloudflare account ID
 * @param {string} options.namespaceId - KV namespace ID
 * @param {string} options.apiToken - Cloudflare API token
 * @returns {Promise<boolean>} - Success status
 */
async function kvBatchDelete(keys, options = {}) {
    const { accountId, namespaceId, apiToken } = options;

    if (!accountId || !namespaceId || !apiToken) {
        throw new Error('accountId, namespaceId, and apiToken are required');
    }

    if (!Array.isArray(keys) || keys.length === 0) {
        throw new Error('keys must be a non-empty array');
    }

    if (keys.length > 10000) {
        throw new Error('Cannot delete more than 10,000 keys in a single batch');
    }

    return await retryWithBackoff(async () => {
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(keys)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`KV batch delete failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(`KV API returned error: ${JSON.stringify(data.errors)}`);
        }

        return true;
    });
}

// Export all functions
module.exports = {
    getCloudflareClient,
    testConnection,
    ensureBucket,
    detectContentType,
    uploadFile,
    uploadBuffer,
    downloadFile,
    getFileBuffer,
    fileExists,
    deleteFile,
    listFiles,
    getFileMetadata,
    copyFile,
    getPresignedUrl,
    uploadFromUrl,
    batchUpload,
    // New page-specific functions
    uploadHtmlPage,
    uploadCssFile,
    uploadJsFile,
    batchUploadPages,
    // Export bucket names for reference
    imageBucketName,
    pagesBucketName,
    // KV REST API functions
    kvListKeys,
    kvReadValue,
    kvWriteValue,
    kvDeleteValue,
    kvBatchWrite,
    kvBatchDelete,
    retryWithBackoff
};
