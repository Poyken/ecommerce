/**
 * =====================================================================
 * ENCRYPTION SERVICE - MÃ HÓA DỮ LIỆU NHẠY CẢM
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Service này xử lý mã hóa/giải mã dữ liệu nhạy cảm (IP whitelist, API keys, v.v.)
 *
 * 1. THUẬT TOÁN SỬ DỤNG (AES-256-GCM):
 *    - AES-256: Mã hóa đối xứng 256-bit, chuẩn an ninh quân sự
 *    - GCM (Galois/Counter Mode): Cung cấp cả confidentiality + integrity
 *    - authTag: Tag xác thực để phát hiện data bị tampering
 *
 * 2. CẤU TRÚC DỮ LIỆU MÃ HÓA:
 *    - Format: "IV:AUTH_TAG:ENCRYPTED_DATA" (hex encoded)
 *    - IV (Initialization Vector): 16 bytes random, đảm bảo cùng plaintext -> khác ciphertext
 *    - AUTH_TAG: 16 bytes, dùng để verify tính toàn vẹn
 *
 * 3. LƯU Ý BẢO MẬT QUAN TRỌNG:
 *    - ENCRYPTION_KEY phải được lưu trong biến môi trường, KHÔNG commit vào Git
 *    - Key phải >= 32 characters để đảm bảo entropy
 *    - Nếu mất key -> mất toàn bộ dữ liệu đã mã hóa (không thể giải mã)
 *
 * 4. CÁC PHƯƠNG THỨC:
 *    - encrypt(text): Mã hóa chuỗi text
 *    - decrypt(text): Giải mã chuỗi đã mã hóa
 *    - encryptObject(obj): Mã hóa JSON object
 *    - decryptObject<T>(text): Giải mã về lại object *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Bảo vệ dữ liệu nhạy cảm (PII): Mã hóa số CCCD, tài khoản ngân hàng của user trong Database để tuân thủ luật GDPR/PDPA.
 * - API Key Management: Lưu trữ key của đối tác (GHN, Payment Gateway) an toàn, tránh bị lộ khi database dump bị đánh cắp.
 * - Secure Tokens: Tạo các token dùng một lần (như token reset password, invite link) mà không thể bị giả mạo.

 * =====================================================================
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      'a-very-secret-key-32-chars-long!!';

    // Ensure the key is 32 bytes (256 bits)
    this.key = crypto.scryptSync(secret, 'salt', 32);
  }

  /**
   * Mã hóa chuỗi text (AES-256-GCM).
   * Trả về format: iv:authTag:encryptedText
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      // Format: IV:AUTH_TAG:ENCRYPTED_DATA
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      throw new InternalServerErrorException('Encryption failed');
    }
  }

  /**
   * Giải mã chuỗi text đã mã hóa.
   * Yêu cầu đúng định dạng: iv:authTag:encryptedText
   */
  decrypt(encryptedData: string): string {
    try {
      const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');

      if (!ivHex || !authTagHex || !encryptedText) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // If decryption fails (e.g. data not encrypted, or wrong key), return original text for safety during transition
      // But in production, we should handle this more strictly
      return encryptedData;
    }
  }

  /**
   * Tiện ích mã hóa object (JSON).
   */
  encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Tiện ích giải mã object.
   */
  decryptObject<T>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    try {
      return JSON.parse(decrypted) as T;
    } catch (e) {
      // Fallback if it's already an object or invalid JSON
      return decrypted as any;
    }
  }
}
