# Kết nối form với Google Sheets

1. Tạo một Google Sheets mới, đặt tên `Đăng ký tư vấn TRAENCO Huế`.
2. Trong trang tính chọn **Tiện ích mở rộng > Apps Script**.
3. Xóa mã mẫu, dán toàn bộ nội dung `google-apps-script/Code.gs`, rồi bấm **Lưu**.
4. Chọn hàm `setupSheet` và bấm **Chạy** một lần để tạo tiêu đề cột; chấp nhận quyền truy cập Google Sheets và gửi email.
5. Chọn **Triển khai > Lần triển khai mới > Ứng dụng web**:
   - Thực thi với tư cách: Tôi.
   - Ai có quyền truy cập: Bất kỳ ai.
6. Sao chép URL ứng dụng web kết thúc bằng `/exec` và điền vào `GOOGLE_SHEETS_WEB_APP_URL` trong `dist/assets/config.js`.

Mỗi đăng ký sẽ được thêm vào một dòng mới và gửi email thông báo tới `xkldtraenco@gmail.com`.
