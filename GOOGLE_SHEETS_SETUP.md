# Kết nối form với Google Sheets

1. Tạo một Google Sheets mới, đặt tên `Đăng ký tư vấn TRAENCO Huế`.
2. Trong trang tính chọn **Tiện ích mở rộng > Apps Script**.
3. Xóa mã mẫu, dán toàn bộ nội dung `google-apps-script/Code.gs`; tạo thêm tệp HTML tên `Admin` và dán nội dung `google-apps-script/Admin.html`, rồi bấm **Lưu**.
4. Chọn hàm `setupSheet` và bấm **Chạy** một lần để tạo tiêu đề cột; chấp nhận quyền truy cập Google Sheets và gửi email.
5. Mở **Cài đặt dự án > Thuộc tính tập lệnh**, thêm thuộc tính `ADMIN_PASSWORD` và đặt mật khẩu quản trị riêng (tối thiểu 8 ký tự). Không ghi mật khẩu vào mã nguồn.
6. Chọn **Triển khai > Lần triển khai mới > Ứng dụng web**:
   - Thực thi với tư cách: Tôi.
   - Ai có quyền truy cập: Bất kỳ ai.
7. Sao chép URL ứng dụng web kết thúc bằng `/exec`, điền cùng URL đó vào `GOOGLE_SHEETS_WEB_APP_URL` và `GOOGLE_ADMIN_WEB_APP_URL` trong `dist/assets/config.js`.
8. Người quản trị mở `/admin/`, bấm **Mở cổng đăng nhập** và nhập mật khẩu đã đặt. Không cần đăng nhập Gmail.

Muốn đổi mật khẩu: mở **Apps Script > Cài đặt dự án > Thuộc tính tập lệnh**, sửa giá trị `ADMIN_PASSWORD`. Không cần sửa mã website.

Mỗi đăng ký sẽ được thêm vào một dòng mới và gửi email thông báo tới `xkldtraenco@gmail.com`.
