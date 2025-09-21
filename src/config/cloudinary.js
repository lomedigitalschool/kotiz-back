import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration du stockage pour les avatars utilisateurs
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kotiz/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }
});

// Configuration du stockage pour les images de cagnottes
const cagnotteStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kotiz/cagnottes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => `cagnotte_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }
});

// Configuration du stockage pour les documents KYC
const kycStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kotiz/kyc',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
    public_id: (req, file) => `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }
});

// Fonction pour supprimer une image de Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    throw error;
  }
};

// Fonction pour uploader directement depuis buffer
const uploadFromBuffer = async (buffer, options = {}) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'kotiz/general',
          allowed_formats: options.allowed_formats || ['jpg', 'jpeg', 'png'],
          transformation: options.transformation || [{ quality: 'auto' }],
          public_id: options.public_id || `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          ...options
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
    return result;
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw error;
  }
};

export {
  cloudinary,
  avatarStorage,
  cagnotteStorage,
  kycStorage,
  deleteFromCloudinary,
  uploadFromBuffer
};