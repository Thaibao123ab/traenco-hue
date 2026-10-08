const SHEET_NAME = 'Dang ky tu van';
const POSTS_SHEET = 'Bai viet';
const STAFF_EMAIL = 'xkldtraenco@gmail.com';

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(event.postData.contents || '{}');
    const name = clean_(data.name, 100);
    const email = clean_(data.email, 150).toLowerCase();
    const phone = clean_(data.phone, 20).replace(/[ .-]/g, '');
    const market = clean_(data.market, 100);
    const message = clean_(data.message, 1500);

    if (!data.consent || name.length < 2 || !/^[a-z0-9._%+-]+@gmail\.com$/i.test(email) || !/^0\d{9}$/.test(phone) || market.length < 2) {
      return json_({ ok: false, error: 'Dữ liệu chưa hợp lệ' });
    }

    const sheet = getSheet_();
    sheet.appendRow([new Date(), name, email, phone, market, message, 'Mới nhận', 'Website']);
    MailApp.sendEmail({
      to: STAFF_EMAIL,
      subject: `TRAENCO Huế - Đăng ký mới: ${name}`,
      htmlBody: `<p><b>Họ tên:</b> ${name}</p><p><b>Gmail:</b> ${email}</p><p><b>Số điện thoại:</b> ${phone}</p><p><b>Thị trường:</b> ${market}</p><p><b>Lời nhắn:</b> ${message || 'Không có'}</p>`
    });
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(event) {
  if (event && event.parameter && event.parameter.action === 'posts') {
    return json_({ ok: true, posts: getPublishedPosts_() });
  }
  return HtmlService.createTemplateFromFile('Admin').evaluate().setTitle('Quản trị TRAENCO Huế').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupSheet() {
  getSheet_();
  getPostsSheet_();
}

function getAdminData(adminPassword) {
  requireAdmin_(adminPassword);
  const leads = getSheet_().getDataRange().getValues().slice(1).reverse().map((row, index) => ({
    row: getSheet_().getLastRow() - index,
    createdAt: row[0], name: row[1], email: row[2], phone: row[3], market: row[4], message: row[5], status: row[6]
  }));
  const posts = getPostsSheet_().getDataRange().getValues().slice(1).reverse().map((row, index) => ({
    row: getPostsSheet_().getLastRow() - index,
    createdAt: row[0], title: row[1], summary: row[2], content: row[3], image: row[4], status: row[5], publishedAt: row[6]
  }));
  return { account: 'Quản trị viên', leads: leads, posts: posts };
}

function savePost(post, adminPassword) {
  requireAdmin_(adminPassword);
  const sheet = getPostsSheet_();
  const values = [new Date(), clean_(post.title, 180), clean_(post.summary, 500), clean_(post.content, 10000), clean_(post.image, 1000), post.status === 'published' ? 'published' : 'draft', post.status === 'published' ? new Date() : ''];
  if (!values[1]) throw new Error('Cần nhập tiêu đề bài viết.');
  if (Number(post.row) >= 2) sheet.getRange(Number(post.row), 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);
  return getAdminData(adminPassword);
}

function updateLeadStatus(row, status, adminPassword) {
  requireAdmin_(adminPassword);
  const allowed = ['Mới nhận', 'Đang tư vấn', 'Đã chốt', 'Đã đóng'];
  if (!allowed.includes(status)) throw new Error('Trạng thái không hợp lệ.');
  getSheet_().getRange(Number(row), 7).setValue(status);
  return true;
}

function getSheet_() {
  const file = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = file.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = file.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Thời gian', 'Họ và tên', 'Gmail', 'Số điện thoại', 'Thị trường', 'Lời nhắn', 'Trạng thái', 'Nguồn']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#064b93').setFontColor('#ffffff');
  }
  return sheet;
}

function getPostsSheet_() {
  const file = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = file.getSheetByName(POSTS_SHEET);
  if (!sheet) sheet = file.insertSheet(POSTS_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Tạo lúc', 'Tiêu đề', 'Mô tả ngắn', 'Nội dung', 'Ảnh URL', 'Trạng thái', 'Đăng lúc']);
    formatHeader_(sheet, 7);
  }
  return sheet;
}

function getPublishedPosts_() {
  return getPostsSheet_().getDataRange().getValues().slice(1)
    .filter(row => row[5] === 'published')
    .reverse()
    .map(row => ({ title: row[1], summary: row[2], content: row[3], image: row[4], publishedAt: row[6] }));
}

function requireAdmin_(adminPassword) {
  const savedPassword = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!savedPassword || savedPassword.length < 8) {
    throw new Error('Mật khẩu quản trị chưa được thiết lập.');
  }
  if (String(adminPassword || '') !== savedPassword) {
    Utilities.sleep(500);
    throw new Error('Mật khẩu không đúng.');
  }
}

function formatHeader_(sheet, columns) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columns).setFontWeight('bold').setBackground('#064b93').setFontColor('#ffffff');
}

function clean_(value, maxLength) {
  return String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
