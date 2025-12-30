import * as crypto from 'crypto';

/**
 * =====================================================================
 * VNPAY UTILS - TIỆN ÍCH MÃ HÓA & XÁC THỰC VNPAY
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ALPHABET SORTING:
 * - VNPay yêu cầu mọi tham số query string phải được sắp xếp theo bảng chữ cái (A-Z) trước khi tạo chữ ký.
 * - Nếu sai thứ tự, chữ ký tạo ra sẽ không khớp với chữ ký của VNPay.
 *
 * 2. HMAC-SHA512:
 * - Đây là thuật toán băm dùng để tạo Chữ ký số (Secure Hash). Thuật toán này sử dụng một Secret Key (chỉ có ta và VNPay biết) để đảm bảo tính toàn vẹn của dữ liệu.
 * =====================================================================
 */
export class VNPayUtils {
  /**
   * Sắp xếp các tham số theo thứ tự alphabet và thực hiện encode
   */
  static sortObject(obj: any): any {
    const sorted: Record<string, string> = {};
    const str: string[] = [];
    let key;
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  /**
   * Tạo Secure Hash cho VNPay (HMAC-SHA512)
   */
  static generateSignature(secretKey: string, signData: string): string {
    const hmac = crypto.createHmac('sha512', secretKey);
    return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  }

  /**
   * Kiểm tra chữ ký VNPay
   */
  static verifySignature(
    secureHash: string,
    secretKey: string,
    signData: string,
  ): boolean {
    const signed = this.generateSignature(secretKey, signData);
    return secureHash === signed;
  }
}
