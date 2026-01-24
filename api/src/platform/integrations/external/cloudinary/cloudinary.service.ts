import { Injectable } from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import * as streamifier from 'streamifier';

/**
 * =====================================================================
 * CLOUDINARY SERVICE - Dịch vụ tải ảnh lên đám mây
 * =====================================================================
 */

/**
 * =====================================================================
 * CLOUDINARY SERVICE - DỊCH VỤ QUẢN LÝ HÌNH ẢNH ĐÁM MÂY
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class CloudinaryService {
  /**
   * Generates a signed upload URL/parameters for client-side uploading.
   * This is more secure and performant as file data doesn't pass through our backend.
   */
  generateSignature(folder = 'ecommerce-reviews') {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Parameters to sign. MUST match what client sends exactly.
    const paramsToSign = {
      timestamp,
      folder,
      // Optional: Add transformations or tags here if needed
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || '',
    );

    return {
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
    };
  }

  async uploadImage(
    file: any,
    folder = 'ecommerce-skus',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(new Error(JSON.stringify(error)));
          if (!result) return reject(new Error('Upload failed'));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadMultipleImages(
    files: any[],
    folder = 'ecommerce-products',
  ): Promise<any[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }
}
