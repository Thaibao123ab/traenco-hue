const config = window.TRAENCO_CONFIG || {};
const adminButton = document.querySelector('#google-admin-button');
const setupWarning = document.querySelector('#setup-warning');
const authStatus = document.querySelector('#auth-status');

if (!config.GOOGLE_ADMIN_WEB_APP_URL) {
  setupWarning.hidden = false;
  adminButton.disabled = true;
  authStatus.textContent = 'Chưa cần cung cấp Gmail lúc này. Khi có Gmail riêng, hệ thống sẽ được kích hoạt trong vài bước.';
} else {
  adminButton.addEventListener('click', () => {
    window.location.href = config.GOOGLE_ADMIN_WEB_APP_URL;
  });
}
