import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@/lib/firebase';

const IMGBB_API_KEY = 'e4159b76d900cd8803bdf1bd7bc96fbb';
const CLOUDINARY_API_KEY = '749639482671498';
const CLOUDINARY_API_SECRET = 'UxkMld54vhYNwEpbL8HO03z7Rcc';
const CLOUDINARY_CLOUD_NAME = 'dkckb57bi';

/**
 * Uploads an image to ImgBB using the hardcoded API key.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', IMGBB_API_KEY);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to ImgBB');
  }

  const data = await response.json();
  return data.data.url; // Returns the direct URL of the uploaded image
}

async function sha1(source: string) {
  const sourceBytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-1", sourceBytes);
  const resultBytes = [...new Uint8Array(digest)];
  return resultBytes.map(x => x.toString(16).padStart(2, '0')).join("");
}

/**
 * Uploads a video to Cloudinary using signed upload on the client side.
 */
export async function uploadVideo(file: File): Promise<string> {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const signatureString = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = await sha1(signatureString);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (err) {
    console.warn('Cloudinary upload failed, falling back to Firebase Storage...', err);
    
    // Fallback to Firebase Storage
    if (!auth.currentUser) throw new Error('Must be logged in to upload video fallback');
    const fileRef = ref(storage, `fallback_videos/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  }
}
