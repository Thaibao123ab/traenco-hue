# Kết nối form với Google Sheets

1. Tạo một Google Sheets mới, đặt tên `Đăng ký tư vấn TRAENCO Huế`.
2. Trong trang tính chọn **Tiện ích mở rộng > Apps Script**.
3. Xóa mã mẫu, dán toàn bộ nội dung `google-apps-script/Code.gs`; tạo thêm tệp HTML tên `Admin` và dán nội dung `google-apps-script/Admin.html`, rồi bấm **Lưu**.
4. Chọn hàm `setupSheet` và bấm **Chạy** một lần để tạo tiêu đề cột; chấp nhận quyền truy cập Google Sheets và gửi email.
5. Chọn **Triển khai > Lần triển khai mới > Ứng dụng web**:
   - Thực thi với tư cách: Tôi.
   - Ai có quyền truy cập: Bất kỳ ai.
6. Sao chép URL ứng dụng web kết thúc bằng `/exec` và điền vào `GOOGLE_SHEETS_WEB_APP_URL` trong `dist/assets/config.js`.

7. Tạo một lần triển khai ứng dụng web thứ hai dành cho quản trị, yêu cầu người dùng đăng nhập Google. Sao chép URL vào `GOOGLE_ADMIN_WEB_APP_URL`.
8. Trong trang tính `Quan tri`, thay dòng mẫu bằng các Gmail được phép đăng bài và xem khách hàng.

Mỗi đăng ký sẽ được thêm vào một dòng mới và gửi email thông báo tới `xkldtraenco@gmail.com`.
