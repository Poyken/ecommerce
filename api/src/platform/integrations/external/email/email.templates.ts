
export const EmailTemplates = {
  orderConfirmation: (order: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A90E2;">Cảm ơn bạn đã mua hàng!</h1>
      <p>Đơn hàng <strong>#${order.id.slice(-8)}</strong> đã được xác nhận.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</p>
        <p style="margin: 5px 0;"><strong>Ngày đặt:</strong> ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
      </div>
      <p>Chúng tôi sẽ sớm giao hàng cho bạn.</p>
    </div>
  `,

  orderStatusUpdate: (order: any, statusText: string, frontendUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4A90E2;">Cập nhật trạng thái đơn hàng</h1>
      <p>Chào bạn,</p>
      <p>Đơn hàng <strong>#${order.id.slice(-8)}</strong> của bạn đã chuyển sang trạng thái: <span style="color: #E67E22; font-weight: bold;">${statusText}</span>.</p>
      ${order.status === 'SHIPPED' && order.shippingCode ? `<p style="background: #e1f5fe; padding: 10px; border-radius: 4px;">Mã vận đơn: <strong>${order.shippingCode}</strong></p>` : ''}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${frontendUrl}/orders/${order.id}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Xem Chi Tiết Đơn Hàng</a>
      </div>
      <p style="color: #888; font-size: 12px;">Cảm ơn bạn đã mua sắm tại Poyken Shop!</p>
    </div>
  `,

  passwordReset: (resetUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Yêu cầu khôi phục mật khẩu</h2>
      <p>Bạn nhận được email này vì đã yêu cầu khôi phục mật khẩu cho tài khoản Poyken Shop.</p>
      <div style="margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #E74C3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Đặt lại mật khẩu</a>
      </div>
      <p style="font-size: 13px;">Hoặc copy link sau vào trình duyệt:</p>
      <code style="background: #eee; padding: 5px; display: block; word-break: break-all;">${resetUrl}</code>
      <p style="margin-top: 20px; color: #999; font-size: 12px;">Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    </div>
  `,
  
  loyaltyPoints: (name: string, points: number, orderId: string, frontendUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
       <h2 style="color: #F1C40F;">🎉 Bạn nhận được ${points} điểm thưởng!</h2>
       <p>Chào ${name},</p>
       <p>Chúc mừng bạn! Bạn đã tích lũy thêm <strong>${points} điểm</strong> từ đơn hàng <strong>#${orderId.slice(0, 8)}</strong>.</p>
       <p>Sử dụng điểm thưởng để đổi lấy các ưu đãi hấp dẫn cho lần mua sau.</p>
       <p><a href="${frontendUrl}/account/loyalty">Xem ví điểm của bạn</a></p>
    </div>
  `,
  
  passwordResetSuccess: () => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2ECC71;">Thành công!</h2>
      <p>Mật khẩu tài khoản Poyken Shop của bạn đã được thay đổi thành công.</p>
      <p>Nếu bạn không thực hiện việc này, vui lòng liên hệ với bộ phận hỗ trợ ngay lập tức.</p>
    </div>
  `
};
