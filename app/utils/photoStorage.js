/**
 * IndexedDB utility for photo storage operations
 * Replaces localStorage for STORAGE_KEY to support large files
 * Includes thumbnail generation for memory optimization
 */

const DB_NAME = 'sn-photo-collector';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

// Thumbnail configuration
const THUMBNAIL_MAX_WIDTH = 150;
const THUMBNAIL_MAX_HEIGHT = 150;
const THUMBNAIL_QUALITY = 0.8;

/**
 * Generate a thumbnail from a full-size image data URL
 * @param {string} dataUrl - Full-size image data URL
 * @returns {Promise<string>} Thumbnail data URL
 */
function generateThumbnail(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate thumbnail dimensions while maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;
        
        if (width > height) {
          if (width > THUMBNAIL_MAX_WIDTH) {
            width = THUMBNAIL_MAX_WIDTH;
            height = width / aspectRatio;
          }
        } else {
          if (height > THUMBNAIL_MAX_HEIGHT) {
            height = THUMBNAIL_MAX_HEIGHT;
            width = height * aspectRatio;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress the image
        ctx.drawImage(img, 0, 0, width, height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY);
        
        console.log(`🖼️ Thumbnail generated: ${Math.round(width)}x${Math.round(height)}`);
        resolve(thumbnailDataUrl);
      } catch (error) {
        console.error('❌ Error generating thumbnail:', error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      const error = new Error('Failed to load image for thumbnail generation');
      console.error('❌ Image load error:', error);
      reject(error);
    };
    
    img.src = dataUrl;
  });
}

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('❌ IndexedDB: Failed to open database', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      console.log('✅ IndexedDB: Database opened successfully');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      console.log('🔄 IndexedDB: Database upgrade needed');
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        
        // Create indexes for efficient querying
        store.createIndex('sn', 'sn', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        
        console.log('✅ IndexedDB: Object store and indexes created');
      }
    };
  });
}

/**
 * Get all photos from IndexedDB
 * @returns {Promise<Array>} Array of photo objects
 */
export async function getAllPhotos() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const photos = request.result || [];
        console.log(`📸 IndexedDB: Retrieved ${photos.length} photos`);
        resolve(photos);
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to get photos', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ IndexedDB: Error in getAllPhotos', error);
    throw error;
  }
}

/**
 * Get photo thumbnails only for display (memory optimized)
 * @returns {Promise<Array>} Array of photo objects with thumbnails only
 */
export async function getPhotoThumbnails() {
  try {
    const photos = await getAllPhotos();
    
    // Return only thumbnail data to minimize memory usage
    const thumbnails = photos.map(photo => ({
      id: photo.id,
      sn: photo.sn,
      timestamp: photo.timestamp,
      // dataUrl: photo.thumbnailDataUrl || photo.dataUrl, // Fallback for old data
      dataUrl: photo.thumbnailDataUrl,
    }));
    
    console.log(`🖼️ IndexedDB: Retrieved ${thumbnails.length} photo thumbnails`);
    return thumbnails;
  } catch (error) {
    console.error('❌ IndexedDB: Error in getPhotoThumbnails', error);
    throw error;
  }
}

/**
 * Get full-size photos for ZIP download
 * @returns {Promise<Array>} Array of photo objects with full-size images
 */
export async function getFullSizePhotos() {
  try {
    const photos = await getAllPhotos();
    
    // Return full-size data for ZIP creation
    const fullSizePhotos = photos.map(photo => ({
      id: photo.id,
      sn: photo.sn,
      timestamp: photo.timestamp,
      // dataUrl: photo.fullSizeDataUrl || photo.dataUrl, // Fallback for old data
      dataUrl: photo.dataUrl, // Fallback for old data
    }));
    
    console.log(`📦 IndexedDB: Retrieved ${fullSizePhotos.length} full-size photos for ZIP`);
    return fullSizePhotos;
  } catch (error) {
    console.error('❌ IndexedDB: Error in getFullSizePhotos', error);
    throw error;
  }
}

/**
 * Add a new photo to IndexedDB with thumbnail generation
 * @param {Object} photo - Photo object with sn, dataUrl, and timestamp
 * @returns {Promise<number>} The ID of the added photo
 */
export async function addPhoto(photo) {
  try {
    // Generate thumbnail for memory optimization
    const thumbnailDataUrl = await generateThumbnail(photo.dataUrl);
    
    // Create photo object with both full-size and thumbnail
    const photoWithThumbnail = {
      ...photo,
      thumbnailDataUrl,
      // Keep original dataUrl for ZIP download
      // fullSizeDataUrl: photo.dataUrl // already have dataUrl here, no need to save another fullSizeDataUrl
    };
    
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.add(photoWithThumbnail);
      
      request.onsuccess = () => {
        const photoId = request.result;
        console.log(`✅ IndexedDB: Photo added with ID ${photoId} for SN: ${photo.sn} (with thumbnail)`);
        resolve(photoId);
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to add photo', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ IndexedDB: Error in addPhoto', error);
    throw error;
  }
}

/**
 * Delete a photo by its ID
 * @param {number} photoId - The ID of the photo to delete
 * @returns {Promise<void>}
 */
export async function deletePhoto(photoId) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(photoId);
      
      request.onsuccess = () => {
        console.log(`🗑️ IndexedDB: Photo with ID ${photoId} deleted`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to delete photo', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ IndexedDB: Error in deletePhoto', error);
    throw error;
  }
}

/**
 * Clear all photos from IndexedDB
 * @returns {Promise<void>}
 */
export async function clearAllPhotos() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('🧹 IndexedDB: All photos cleared');
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to clear photos', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ IndexedDB: Error in clearAllPhotos', error);
    throw error;
  }
}

/**
 * Get photos by serial number
 * @param {string} sn - Serial number to search for
 * @returns {Promise<Array>} Array of photo objects with matching SN
 */
export async function getPhotosBySN(sn) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sn');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(sn);
      
      request.onsuccess = () => {
        const photos = request.result || [];
        console.log(`🔍 IndexedDB: Found ${photos.length} photos for SN: ${sn}`);
        resolve(photos);
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to get photos by SN', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ IndexedDB: Error in getPhotosBySN', error);
    throw error;
  }
}

/**
 * Check if IndexedDB is supported
 * @returns {boolean}
 */
export function isIndexedDBSupported() {
  return 'indexedDB' in window;
}