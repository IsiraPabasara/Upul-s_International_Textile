import axios from 'axios';
import axiosInstance from '../../../../../axiosInstance';

/**
 * 🟢 DYNAMIC UPLOAD UTILITY
 * Now accepts a folder path so you can reuse this everywhere!
 */
export const uploadImageToKit = async (file: File, folder: string = '/products') => {
  try {
    // 1. Get Permission Slip (Signature) from your Backend
    const { data: auth } = await axiosInstance.get('/api/imagekit/auth');
    console.log('🔐 Auth params received:', { expire: auth.expire, hasSignature: !!auth.signature, hasToken: !!auth.token });

    // Sanitize filename - remove special characters
    const sanitizedFileName = file.name
      .replace(/[^\w\s.-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase();

    // 2. Build the payload for ImageKit
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', sanitizedFileName);
    formData.append('publicKey', "public_IeRRcxkTOy5kNKEIAJaj4/XW4Qg=");
    formData.append('signature', auth.signature);
    formData.append('expire', auth.expire);
    formData.append('token', auth.token);
    formData.append('useUniqueFileName', 'true');
    
    // 🟢 Use the dynamic folder parameter here!
    formData.append('folder', folder);

    console.log('📤 Uploading to ImageKit:', { fileName: sanitizedFileName, folder });

    // 3. Send directly to ImageKit Cloud
    const response = await axios.post('https://upload.imagekit.io/api/v1/files/upload', formData);

    console.log('✅ Upload successful:', { fileId: response.data.fileId, url: response.data.url });

    return {
      fileId: response.data.fileId,
      url: response.data.url,
      name: response.data.name,
    };
  } catch (error: any) {
    console.error('❌ Upload Error Details:');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error status:', error?.response?.status);
    console.error('Error data:', error?.response?.data);
    console.error('CORS/Network Error:', error?.code);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
};