const config = window.TRAENCO_CONFIG || {};
const adminButton = document.querySelector('#google-admin-button');
const setupWarning = document.querySelector('#setup-warning');
const authStatus = document.querySelector('#auth-status');

if (!config.GOOGLE_ADMIN_WEB_APP_URL) {
  setupWarning.hidden = false;
  adminButton.disabled = true;
  authStatus.textContent = 'Hệ thống đang chờ kết nối Google Sheets và đặt mật khẩu quản trị.';
} else {
  adminButton.addEventListener('click', () => {
    window.location.href = config.GOOGLE_ADMIN_WEB_APP_URL;
  });
}
