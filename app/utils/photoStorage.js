/**
 * IndexedDB utility for photo storage operations
 * Replaces localStorage for STORAGE_KEY to support large files
 */

const DB_NAME = 'sn-photo-collector';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

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
 * Add a new photo to IndexedDB
 * @param {Object} photo - Photo object with sn, dataUrl, and timestamp
 * @returns {Promise<number>} The ID of the added photo
 */
export async function addPhoto(photo) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.add(photo);
      
      request.onsuccess = () => {
        const photoId = request.result;
        console.log(`✅ IndexedDB: Photo added with ID ${photoId} for SN: ${photo.sn}`);
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