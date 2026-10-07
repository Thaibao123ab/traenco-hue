const SHEET_NAME = 'Dang ky tu van';
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

function setupSheet() {
  getSheet_();
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

function clean_(value, maxLength) {
  return String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
