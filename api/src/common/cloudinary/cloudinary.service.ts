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
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CLOUD STORAGE:
 * - Thay vì lưu ảnh trực tiếp trên server (làm nặng server và khó scale), ta sử dụng Cloudinary - một dịch vụ chuyên dụng để lưu trữ và tối ưu hình ảnh.
 *
 * 2. STREAM UPLOADING:
 * - Ta sử dụng `upload_stream` kết hợp với `streamifier`.
 * - Thay vì ghi file tạm ra ổ cứng, ta đẩy trực tiếp dữ liệu từ bộ nhớ (Buffer) lên Cloudinary qua luồng (Stream).
 * - Cách này nhanh hơn và an toàn hơn cho hệ thống.
 *
 * 3. PROMISE WRAPPER:
 * - Do thư viện Cloudinary sử dụng Callback, ta bọc nó lại trong một `Promise` để có thể sử dụng `async/await` mượt mà trong NestJS.
 * =====================================================================
 */

@Injectable()
export class CloudinaryService {
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
          if (error) return reject(error);
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
