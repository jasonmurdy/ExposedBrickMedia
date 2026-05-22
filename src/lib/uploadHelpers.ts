import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const processAndUploadGallery = async (
  files: File[],
  listingId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  let completedCount = 0;

  // Compression configuration targeting WebP
  const options = {
    maxSizeMB: 1, // Target max file size
    maxWidthOrHeight: 1920, // Ideal for 1080p web display
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8, // 80% quality is a great balance for WebP
  };

  for (const rawFile of files) {
    try {
      // 1. Compress and convert to WebP
      const compressedFile = await imageCompression(rawFile, options);
      
      // Generate a unique filename
      const safeName = rawFile.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const uniqueFileName = `${Date.now()}_${safeName}.webp`;
      
      // 2. Set up Firebase Storage reference
      const storageRef = ref(storage, `listings/${listingId}/gallery/${uniqueFileName}`);
      
      // 3. Upload the compressed file
      const uploadTask = await uploadBytesResumable(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      uploadedUrls.push(downloadURL);
      
      // Update progress
      completedCount++;
      if (onProgress) {
        onProgress((completedCount / files.length) * 100);
      }
    } catch (error) {
      console.error(`Failed to process ${rawFile.name}:`, error);
      // Decide if you want to fail the whole batch or continue with the rest
    }
  }
  
  return uploadedUrls;
};
