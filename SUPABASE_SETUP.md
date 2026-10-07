# Kích hoạt dữ liệu và trang quản trị TRAENCO Huế

Website và trang quản trị đã hoàn thiện giao diện. Làm các bước sau một lần để bật lưu dữ liệu thật.

1. Tạo một dự án tại Supabase.
2. Mở **SQL Editor**, dán và chạy toàn bộ nội dung `supabase/schema.sql`.
3. Trong **Authentication > Users**, tạo tài khoản email/mật khẩu cho nhân viên.
4. Sao chép UUID của tài khoản, chạy lệnh:

   ```sql
   insert into public.admin_users (user_id) values ('UUID-CUA-TAI-KHOAN-ADMIN');
   ```

5. Triển khai Edge Function `submit-consultation` trong thư mục `supabase/functions/submit-consultation`.
6. Trong Supabase **Project Settings > API**, sao chép Project URL và anon key vào `dist/assets/config.js`.
7. Thêm secrets cho Edge Function:

   - `ALLOWED_ORIGINS=https://thaibao123ab.github.io,http://127.0.0.1:4173`
   - `ZALO_OA_ACCESS_TOKEN`: access token của Zalo OA đã xác thực.
   - `ZALO_STAFF_USER_ID`: UID của nhân viên đối với OA; tài khoản này phải từng tương tác với OA và tuân theo cửa sổ nhắn tin của Zalo.

Nếu chưa có Zalo OA, dữ liệu vẫn được lưu và xem tại `/admin/`; nút sau khi gửi sẽ mở chat trực tiếp tới `https://zalo.me/0935398669`.

Lưu ý: không đưa `SUPABASE_SERVICE_ROLE_KEY` hoặc access token Zalo vào `dist/assets/config.js`. Các khóa bí mật chỉ được lưu trong phần Secrets của Edge Function.
