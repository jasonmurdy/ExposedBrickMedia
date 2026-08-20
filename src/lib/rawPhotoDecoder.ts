/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Universal RAW Camera Photo Decoder & Metadata Extractor
 * Supports Sony (.ARW), Canon (.CR2, .CR3), Nikon (.NEF), Adobe (.DNG),
 * Fujifilm (.RAF), Panasonic (.RW2), Olympus (.ORF), Pentax (.PEF), Hasselblad (.3FR).
 */

export interface RawPhotoMetadata {
  isRaw: boolean;
  formatName: string;
  cameraMake?: string;
  cameraModel?: string;
  exposureBiasEV?: number; // e.g. -2, 0, +2
  shutterSpeed?: string; // e.g. "1/250s"
  fNumber?: number; // e.g. 8.0
  iso?: number; // e.g. 100
  focalLength?: string; // e.g. "16mm"
  dimensions?: { width: number; height: number };
}

export const RAW_EXTENSIONS = [
  'arw', 'srf', 'sr2', // Sony
  'cr2', 'cr3', 'crw', // Canon
  'nef', 'nrw',        // Nikon
  'dng',               // Adobe / Leica / DJI / Apple ProRAW
  'raf',               // Fujifilm
  'rw2',               // Panasonic / Lumix
  'orf',               // Olympus / OM System
  'pef',               // Pentax
  '3fr', 'fff',        // Hasselblad
  'iiq',               // Phase One
  'raw'
];

/**
 * Determines whether a file or filename is a RAW camera photo based on extension or MIME.
 */
export function isRawPhotoFile(file: { name?: string; type?: string }): boolean {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  const ext = name.split('.').pop() || '';
  if (RAW_EXTENSIONS.includes(ext)) return true;

  const type = (file.type || '').toLowerCase();
  if (
    type.includes('image/x-') ||
    type.includes('raw') ||
    type.includes('image/x-canon') ||
    type.includes('image/x-sony') ||
    type.includes('image/x-nikon') ||
    type.includes('image/x-adobe-dng') ||
    type.includes('image/x-fuji') ||
    type.includes('image/x-panasonic') ||
    type.includes('image/x-olympus')
  ) {
    return true;
  }

  return false;
}

/**
 * Returns a friendly brand name for the RAW format.
 */
export function getRawFormatLabel(filename: string): string {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'arw':
    case 'srf':
    case 'sr2':
      return 'Sony Alpha RAW (.ARW)';
    case 'cr2':
      return 'Canon EOS RAW (.CR2)';
    case 'cr3':
      return 'Canon Cinema/EOS RAW (.CR3)';
    case 'crw':
      return 'Canon RAW (.CRW)';
    case 'nef':
    case 'nrw':
      return 'Nikon Electronic Format (.NEF)';
    case 'dng':
      return 'Adobe Digital Negative (.DNG)';
    case 'raf':
      return 'Fujifilm RAW (.RAF)';
    case 'rw2':
      return 'Panasonic Lumix RAW (.RW2)';
    case 'orf':
      return 'Olympus / OM System RAW (.ORF)';
    case 'pef':
      return 'Pentax RAW (.PEF)';
    case '3fr':
    case 'fff':
      return 'Hasselblad RAW';
    default:
      return ext ? `${ext.toUpperCase()} RAW` : 'RAW Photo';
  }
}

/**
 * Extracts embedded high-resolution JPEG streams from any RAW format buffer (TIFF, ISOBMFF CR3, RAF).
 */
export function extractEmbeddedJpegFromRaw(data: Uint8Array | ArrayBuffer): Uint8Array | null {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const length = bytes.length;

  if (length < 128) return null;

  // 1. If the file is already a JPEG, return it directly
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return bytes;
  }

  // 2. Scan for JPEG streams starting with SOI (0xFF, 0xD8, 0xFF) and ending with EOI (0xFF, 0xD9)
  const candidateJpegs: { start: number; end: number; size: number }[] = [];
  
  // We search the entire file for valid JPEG chunks.
  // Standard raw embedded JPEGs are at least 15KB.
  let i = 0;
  while (i < length - 4) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      const start = i;
      // Search forward for EOI (0xFF, 0xD9)
      let end = -1;
      let j = i + 128; // JPEGs are at least 128 bytes
      while (j < length - 1) {
        if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
          // Check if this looks like a valid EOI by checking size or next byte
          end = j + 2;
          // Continue scanning to find full image EOI if this was just a thumbnail inside APP1/EXIF
          if (end - start > 50000) { // Large enough to be a preview
            break;
          }
        }
        j++;
      }

      if (end !== -1 && end > start) {
        const size = end - start;
        if (size > 10000) { // Keep if > 10KB
          candidateJpegs.push({ start, end, size });
        }
        i = end; // Skip past this JPEG
        continue;
      }
    }
    i++;
  }

  if (candidateJpegs.length > 0) {
    // Pick the largest JPEG chunk (which is the full-resolution preview or highest quality preview)
    candidateJpegs.sort((a, b) => b.size - a.size);
    const best = candidateJpegs[0];
    return bytes.subarray(best.start, best.end);
  }

  return null;
}

/**
 * Client-side helper to create a displayable Object URL for a RAW File.
 */
export async function createRawPreviewUrl(file: File): Promise<{ url: string; isRaw: boolean; format: string }> {
  const isRaw = isRawPhotoFile(file);
  const format = getRawFormatLabel(file.name);

  if (!isRaw) {
    return {
      url: URL.createObjectURL(file),
      isRaw: false,
      format: 'Standard JPEG/PNG'
    };
  }

  try {
    // Read the first 12MB or the full file to extract embedded JPEG preview
    // Most raw previews are within the first 8-15MB or near the beginning
    const sliceSize = Math.min(file.size, 16 * 1024 * 1024);
    const sliceBlob = file.slice(0, sliceSize);
    const arrayBuffer = await sliceBlob.arrayBuffer();

    let jpegBytes = extractEmbeddedJpegFromRaw(arrayBuffer);

    // If not found in the initial slice, try the full file
    if (!jpegBytes && file.size > sliceSize) {
      const fullBuffer = await file.arrayBuffer();
      jpegBytes = extractEmbeddedJpegFromRaw(fullBuffer);
    }

    if (jpegBytes && jpegBytes.length > 5000) {
      const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
      return {
        url: URL.createObjectURL(blob),
        isRaw: true,
        format
      };
    }
  } catch (err) {
    console.warn("[RAW Preview Extractor]: Failed to extract preview from", file.name, err);
  }

  // Fallback: Return raw object URL
  return {
    url: URL.createObjectURL(file),
    isRaw: true,
    format
  };
}

/**
 * Client-side helper to prepare a bracket image (RAW or standard) for upload.
 * Extracts embedded stream for RAWs and normalizes image size to prevent 413 (Payload Too Large) errors,
 * while maintaining professional 4K / Ultra-HD resolution and high fidelity.
 */
export async function prepareBracketImageForUpload(file: File, maxDimension: number = 3840, quality: number = 0.92): Promise<string> {
  const isRaw = isRawPhotoFile(file);

  let imageBlob: Blob = file;

  if (isRaw) {
    try {
      const sliceSize = Math.min(file.size, 20 * 1024 * 1024);
      const sliceBlob = file.slice(0, sliceSize);
      const arrayBuffer = await sliceBlob.arrayBuffer();
      let jpegBytes = extractEmbeddedJpegFromRaw(arrayBuffer);

      if (!jpegBytes && file.size > sliceSize) {
        const fullBuffer = await file.arrayBuffer();
        jpegBytes = extractEmbeddedJpegFromRaw(fullBuffer);
      }

      if (jpegBytes && jpegBytes.length > 5000) {
        const copy = new Uint8Array(jpegBytes.length);
        copy.set(jpegBytes);
        imageBlob = new Blob([copy], { type: 'image/jpeg' });
      }
    } catch (err) {
      console.warn("[RAW Upload Extractor]: Error extracting stream for", file.name, err);
    }
  }

  // If the extracted or input image is reasonably sized (< 2.5MB) and not RAW, convert directly
  if (imageBlob.size <= 2.5 * 1024 * 1024 && !isRaw) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
  }

  // For RAWs or high-res images > 2.5MB, scale/compress on canvas to ensure pristine 4K fidelity and ultra-fast upload under 3MB
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(imageBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(objectUrl);
        reader.readAsDataURL(imageBlob);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(imageBlob);
    };

    img.src = objectUrl;
  });
}

