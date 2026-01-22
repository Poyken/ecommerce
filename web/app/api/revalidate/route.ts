import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  // 1. Lấy tham số 'tag' và 'token' từ URL Query String
  const tag = request.nextUrl.searchParams.get("tag");
  const token = request.nextUrl.searchParams.get("token");

  // 2. Kiểm tra bảo mật (Security Check)
  // Chỉ cho phép request có chứa token đúng với biến môi trường REVALIDATE_TOKEN
  // để ngăn chặn người lạ tự ý xóa cache làm tải server tăng cao.
  if (process.env.REVALIDATE_TOKEN && token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  // 3. Kiểm tra tham số bắt buộc
  if (!tag) {
    return NextResponse.json({ message: "Missing tag param" }, { status: 400 });
  }

  // 4. Xử lý Logic Revalidate
  // Nếu tag là 'all', thực hiện xóa cache của các nhóm dữ liệu chính.
  if (tag === "all") {
    // revalidateTag("tên_tag") sẽ xóa cache của tất cả fetch request có gắn tags này.
    revalidateTag("products", "max"); // Xóa cache danh sách sản phẩm
    revalidateTag("categories", "max"); // Xóa cache danh mục
    revalidateTag("brands", "max"); // Xóa cache thương hiệu

    return NextResponse.json({
      revalidated: true,
      type: "all",
      now: Date.now(),
    });
  }

  // 5. Revalidate một tag cụ thể được gửi lên
  revalidateTag(tag, "max");

  // 6. Trả về kết quả thành công
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
