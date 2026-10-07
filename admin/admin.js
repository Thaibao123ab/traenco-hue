const config = window.TRAENCO_CONFIG || {};
const configured = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase);
const client = configured ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY) : null;

const loginView = document.querySelector('#login-view');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const authStatus = document.querySelector('#auth-status');
const setupWarning = document.querySelector('#setup-warning');
const logoutButton = document.querySelector('#logout-button');
const adminEmail = document.querySelector('#admin-email');
const rowsRoot = document.querySelector('#lead-rows');
const tableScroll = document.querySelector('#table-scroll');
const loadingState = document.querySelector('#loading-state');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search-input');
const statusFilter = document.querySelector('#status-filter');
const template = document.querySelector('#lead-row-template');
let leads = [];

if (!configured) {
  setupWarning.hidden = false;
  loginForm.querySelector('button[type="submit"]').disabled = true;
}

function showLogin(message = '') {
  loginView.hidden = false;
  dashboard.hidden = true;
  logoutButton.hidden = true;
  adminEmail.textContent = '';
  authStatus.textContent = message;
}

function showDashboard(user) {
  loginView.hidden = true;
  dashboard.hidden = false;
  logoutButton.hidden = false;
  adminEmail.textContent = user.email || '';
  loadLeads();
}

function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function updateStats() {
  document.querySelector('#stat-total').textContent = leads.length;
  document.querySelector('#stat-new').textContent = leads.filter((lead) => lead.status === 'new').length;
  document.querySelector('#stat-contacted').textContent = leads.filter((lead) => lead.status === 'contacted').length;
  document.querySelector('#stat-enrolled').textContent = leads.filter((lead) => lead.status === 'enrolled').length;
}

function getFilteredLeads() {
  const query = searchInput.value.trim().toLocaleLowerCase('vi');
  const status = statusFilter.value;
  return leads.filter((lead) => {
    const matchesStatus = status === 'all' || lead.status === status;
    const haystack = [lead.name, lead.email, lead.phone, lead.market, lead.message].join(' ').toLocaleLowerCase('vi');
    return matchesStatus && (!query || haystack.includes(query));
  });
}

function renderLeads() {
  rowsRoot.replaceChildren();
  const filtered = getFilteredLeads();
  emptyState.hidden = filtered.length !== 0;
  tableScroll.hidden = filtered.length === 0;

  filtered.forEach((lead) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector('.lead-time').textContent = formatDate(lead.created_at);
    row.querySelector('.lead-name').textContent = lead.name;
    const phone = row.querySelector('.lead-phone');
    phone.textContent = lead.phone;
    phone.href = `tel:${lead.phone.replace(/\D/g, '')}`;
    const email = row.querySelector('.lead-email');
    email.textContent = lead.email || '—';
    email.href = lead.email ? `mailto:${lead.email}` : '#';
    row.querySelector('.lead-market').textContent = lead.market;
    row.querySelector('.lead-message').textContent = lead.message || '—';
    const zalo = row.querySelector('.lead-zalo');
    zalo.innerHTML = lead.zalo_notified ? '<span class="sent">✓ Đã báo</span>' : '<span class="pending">Chờ kết nối</span>';
    const select = row.querySelector('.lead-status');
    select.value = lead.status;
    select.addEventListener('change', async () => {
      select.disabled = true;
      const nextStatus = select.value;
      const { error } = await client.from('consultation_requests').update({ status: nextStatus }).eq('id', lead.id);
      select.disabled = false;
      if (error) {
        select.value = lead.status;
        window.alert(`Không thể cập nhật: ${error.message}`);
        return;
      }
      lead.status = nextStatus;
      updateStats();
    });
    rowsRoot.append(row);
  });
}

async function loadLeads() {
  loadingState.hidden = false;
  tableScroll.hidden = true;
  emptyState.hidden = true;
  const { data, error } = await client.from('consultation_requests').select('*').order('created_at', { ascending: false }).limit(1000);
  loadingState.hidden = true;
  if (error) {
    emptyState.hidden = false;
    emptyState.textContent = error.code === '42501' ? 'Tài khoản này chưa được cấp quyền quản trị.' : `Không thể tải dữ liệu: ${error.message}`;
    return;
  }
  leads = data || [];
  updateStats();
  renderLeads();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!client) return;
  const submit = loginForm.querySelector('button[type="submit"]');
  const data = new FormData(loginForm);
  submit.disabled = true;
  authStatus.textContent = 'Đang đăng nhập…';
  const { data: result, error } = await client.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') });
  submit.disabled = false;
  if (error) {
    authStatus.textContent = 'Email hoặc mật khẩu chưa đúng.';
    return;
  }
  authStatus.textContent = '';
  showDashboard(result.user);
});

logoutButton.addEventListener('click', async () => {
  await client?.auth.signOut();
  showLogin();
});

document.querySelector('#refresh-button').addEventListener('click', loadLeads);
searchInput.addEventListener('input', renderLeads);
statusFilter.addEventListener('change', renderLeads);
document.querySelector('#export-button').addEventListener('click', () => {
  const header = ['Thời gian', 'Họ tên', 'Gmail', 'Số điện thoại', 'Thị trường', 'Lời nhắn', 'Trạng thái', 'Đã báo Zalo'];
  const lines = [header.map(escapeCsv).join(',')];
  getFilteredLeads().forEach((lead) => lines.push([
    formatDate(lead.created_at), lead.name, lead.email, lead.phone, lead.market, lead.message, lead.status, lead.zalo_notified ? 'Có' : 'Không'
  ].map(escapeCsv).join(',')));
  const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `traenco-hue-dang-ky-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

if (client) {
  client.auth.getSession().then(({ data }) => {
    if (data.session?.user) showDashboard(data.session.user);
    else showLogin();
  });
}
