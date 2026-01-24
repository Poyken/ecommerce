import * as crypto from 'crypto';

/**
 * =====================================================================
 * VNPAY UTILS - TIỆN ÍCH MÃ HÓA & XÁC THỰC VNPAY
 * =====================================================================
 *
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
    if (!secretKey) return '';
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
