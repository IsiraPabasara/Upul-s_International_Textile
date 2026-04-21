import axios from 'axios';
import axiosInstance from '@/app/utils/axiosInstance';

/**
 * 🟢 DYNAMIC UPLOAD UTILITY
 * Now accepts a folder path so you can reuse this everywhere!
 */
export const uploadImageToKit = async (file: File, folder: string = '/products') => {
  try {
    // 1. Get Permission Slip (Signature) from your Backend
    const { data: auth } = await axiosInstance.get('/api/imagekit/auth');

    // 2. Build the payload for ImageKit
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('publicKey', "public_IeRRcxkTOy5kNKEIAJaj4/XW4Qg=");
    formData.append('signature', auth.signature);
    formData.append('expire', auth.expire);
    formData.append('token', auth.token);
    formData.append('useUniqueFileName', 'true');
    
    // 🟢 Use the dynamic folder parameter here!
    formData.append('folder', folder); 

    // 3. Send directly to ImageKit Cloud
    const response = await axios.post('https://upload.imagekit.io/api/v1/files/upload', formData);

    return {
      fileId: response.data.fileId,
      url: response.data.url
    };
  } catch (error) {
    console.error(`Upload failed for file to ${folder}:`, file.name, error);
    throw error;
  }
};