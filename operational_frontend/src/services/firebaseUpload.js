import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImageAsync = async (uri, pathPrefix = 'chat_images') => {
  try {
    // Convert local URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    // Create a unique path
    const path = `${pathPrefix}/${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
    const storageRef = ref(storage, path);
    // Upload the blob
    await uploadBytes(storageRef, blob);
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (err) {
    console.error('Image upload failed:', err);
    throw err;
  }
};
