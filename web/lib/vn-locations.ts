export interface ProvinceData {
  ProvinceID: number;
  ProvinceName: string;
}

export interface DistrictData {
  DistrictID: number;
  DistrictName: string;
  ProvinceID: number;
}

/**
 * =====================================================================
 * VN LOCATIONS - Mock Data Hành chính Việt Nam
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WHY MOCK DATA?
 * - Trong thực tế, dữ liệu Tỉnh/Thành cố định và ít thay đổi.
 * - Để giảm tải cho DB, ta có thể hard-code hoặc load từ JSON file tĩnh.
 * - File này chứa data mẫu (Hà Nội, HCM, Đà Nẵng) phục vụ tính năng Địa chỉ.
 * =====================================================================
 */
export interface WardData {
  WardCode: string;
  WardName: string;
  DistrictID: number;
}

// Mock Data for Ha Noi and Ho Chi Minh City
export const MOCK_PROVINCES: ProvinceData[] = [
  { ProvinceID: 201, ProvinceName: "Hà Nội" },
  { ProvinceID: 202, ProvinceName: "Hồ Chí Minh" },
  { ProvinceID: 203, ProvinceName: "Đà Nẵng" },
];

export const MOCK_DISTRICTS: DistrictData[] = [
  // Ha Noi (201)
  { DistrictID: 1482, DistrictName: "Quận Ba Đình", ProvinceID: 201 },
  { DistrictID: 1484, DistrictName: "Quận Đống Đa", ProvinceID: 201 },
  { DistrictID: 1485, DistrictName: "Quận Hai Bà Trưng", ProvinceID: 201 },
  { DistrictID: 1486, DistrictName: "Quận Hoàn Kiếm", ProvinceID: 201 },
  { DistrictID: 1488, DistrictName: "Quận Tây Hồ", ProvinceID: 201 },
  { DistrictID: 1489, DistrictName: "Quận Cầu Giấy", ProvinceID: 201 },
  { DistrictID: 1490, DistrictName: "Quận Thanh Xuân", ProvinceID: 201 },
  { DistrictID: 1491, DistrictName: "Quận Hoàng Mai", ProvinceID: 201 },
  { DistrictID: 1492, DistrictName: "Quận Long Biên", ProvinceID: 201 },
  { DistrictID: 3440, DistrictName: "Quận Nam Từ Liêm", ProvinceID: 201 },

  // Ho Chi Minh (202)
  { DistrictID: 1442, DistrictName: "Quận 1", ProvinceID: 202 },
  { DistrictID: 1443, DistrictName: "Quận 3", ProvinceID: 202 },
  { DistrictID: 1444, DistrictName: "Quận 4", ProvinceID: 202 },
  { DistrictID: 1446, DistrictName: "Quận 5", ProvinceID: 202 },
  { DistrictID: 1447, DistrictName: "Quận 6", ProvinceID: 202 },
  { DistrictID: 1448, DistrictName: "Quận 7", ProvinceID: 202 },
  { DistrictID: 1449, DistrictName: "Quận 8", ProvinceID: 202 },
  { DistrictID: 1450, DistrictName: "Quận 10", ProvinceID: 202 },
  { DistrictID: 1451, DistrictName: "Quận 11", ProvinceID: 202 },
  { DistrictID: 1452, DistrictName: "Quận 12", ProvinceID: 202 },
  { DistrictID: 1453, DistrictName: "Quận Bình Thạnh", ProvinceID: 202 },
  { DistrictID: 1454, DistrictName: "Quận Tân Bình", ProvinceID: 202 },
  { DistrictID: 1455, DistrictName: "Quận Phú Nhuận", ProvinceID: 202 },

  // Da Nang (203)
  { DistrictID: 1530, DistrictName: "Quận Hải Châu", ProvinceID: 203 },
  { DistrictID: 1531, DistrictName: "Quận Thanh Khê", ProvinceID: 203 },
  { DistrictID: 1532, DistrictName: "Quận Sơn Trà", ProvinceID: 203 },
];

export const MOCK_WARDS: WardData[] = [
  // Ba Dinh (1482)
  { WardCode: "1A0101", WardName: "Phường Phúc Xá", DistrictID: 1482 },
  { WardCode: "1A0102", WardName: "Phường Trúc Bạch", DistrictID: 1482 },
  { WardCode: "1A0103", WardName: "Phường Vĩnh Phúc", DistrictID: 1482 },
  { WardCode: "1A0104", WardName: "Phường Cống Vị", DistrictID: 1482 },
  { WardCode: "1A0105", WardName: "Phường Liễu Giai", DistrictID: 1482 },

  // Quan 1 (1442)
  { WardCode: "20101", WardName: "Phường Bến Nghé", DistrictID: 1442 },
  { WardCode: "20102", WardName: "Phường Bến Thành", DistrictID: 1442 },
  { WardCode: "20103", WardName: "Phường Cô Giang", DistrictID: 1442 },
  { WardCode: "20104", WardName: "Phường Cầu Kho", DistrictID: 1442 },
  { WardCode: "20105", WardName: "Phường Cầu Ông Lãnh", DistrictID: 1442 },

  // Hai Chau (1530)
  { WardCode: "30101", WardName: "Phường Hải Châu 1", DistrictID: 1530 },
  { WardCode: "30102", WardName: "Phường Hải Châu 2", DistrictID: 1530 },
  { WardCode: "30103", WardName: "Phường Thạch Thang", DistrictID: 1530 },
];
