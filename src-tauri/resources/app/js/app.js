/**
 * CRM Gráfica — Lightweight Tauri Frontend
 * Conecta-se diretamente ao Supabase cloud via JS client.
 * Nenhuma dependência de servidor Node.js.
 */

// ── Config ────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://feofefykuojcdaulnrpa.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlb2ZlZnlrdW9qY2RhdWxucnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTU5MzYsImV4cCI6MjEwNzMzMTkzNn0.ASRqMUBklyVUG7ZT-Q_c0I9DYJba8IqTEPohIZ8Bg64';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── State ─────────────────────────────────────────────────────────
let currentUser = null;
let currentOrg = null;
let currentPage = 'dashboard';

// ── DOM refs ──────────────────────────────────────────────────────
const loginPage = document.getElementById('login-page');
const crmApp = document.getElementById('crm-app');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const userEmail = document.getElementById('user-email');
const pageTitle = document.getElementById('page-title');
const pageContent = document.getElementById('page-content');

// ── Init ──────────────────────────────────────────────────────────
init();

async function init() {
  // Restore session from localStorage
  const session = JSON.parse(localStorage.getItem('crm_session') || 'null');
  if (session?.access_token) {
    await sb.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }

  const { data: { session: sess } } = await sb.auth.getSession();
  if (sess) {
    currentUser = sess.user;
    await loadOrg();
    showApp();
  } else {
    showLogin();
  }
}

// ── Auth ──────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Entrando...';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  loginBtn.disabled = false;
  loginBtn.textContent = 'Entrar';

  if (error) {
    loginError.textContent = error.message === 'Invalid login credentials'
      ? 'E-mail ou senha incorretos'
      : error.message;
    return;
  }

  currentUser = data.user;
  localStorage.setItem('crm_session', JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  }));
  await loadOrg();
  showApp();
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  await sb.auth.signOut();
  localStorage.removeItem('crm_session');
  currentUser = null;
  currentOrg = null;
  showLogin();
});

// ── Org ───────────────────────────────────────────────────────────
async function loadOrg() {
  const { data, error } = await sb
    .from('organizations')
    .select('*')
    .eq('slug', 'grafica-local')
    .single();
  if (!error && data) currentOrg = data;
}

// ── Navigation ────────────────────────────────────────────────────
function showLogin() {
  loginPage.style.display = 'flex';
  crmApp.style.display = 'none';
}

function showApp() {
  loginPage.style.display = 'none';
  crmApp.style.display = 'block';
  userEmail.textContent = currentUser?.email || '';
  setupNav();
  navigateTo('dashboard');
}

function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const active = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (active) active.classList.add('active');

  const titles = {
    dashboard: 'Painel', contacts: 'Contatos', proposals: 'Propostas',
    inbox: 'Central', settings: 'Configurações'
  };
  pageTitle.textContent = titles[page] || page;
  pageContent.innerHTML = '<div class="loading">Carregando...</div>';

  const renderers = { dashboard: renderDashboard, contacts: renderContacts, proposals: renderProposals, inbox: renderInbox, settings: renderSettings };
  (renderers[page] || renderDashboard)();
}

// ── Pages ─────────────────────────────────────────────────────────

async function renderDashboard() {
  // Fetch stats in parallel
  const [contactsRes, proposalsRes, inboxRes] = await Promise.allSettled([
    sb.from('contacts').select('id', { count: 'exact', head: true }),
    sb.from('proposals').select('id', { count: 'exact', head: true }),
    sb.from('agent_inbox_items').select('id', { count: 'exact', head: true })
      .eq('organization_id', currentOrg?.id),
  ]);

  const contacts = contactsRes.status === 'fulfilled' ? contactsRes.value?.count ?? 0 : 0;
  const proposals = proposalsRes.status === 'fulfilled' ? proposalsRes.value?.count ?? 0 : 0;
  const inbox = inboxRes.status === 'fulfilled' ? inboxRes.value?.count ?? 0 : 0;

  pageContent.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Contatos</div><div class="value">${contacts}</div></div>
      <div class="stat-card"><div class="label">Propostas</div><div class="value">${proposals}</div></div>
      <div class="stat-card"><div class="label">Itens na Central</div><div class="value">${inbox}</div></div>
      <div class="stat-card"><div class="label">Org</div><div class="value" style="font-size:16px">${currentOrg?.display_name || '—'}</div></div>
    </div>
    <h3 style="margin-bottom:12px;font-size:15px">Acesso Rápido</h3>
    <div class="quick-links">
      <div class="quick-link" onclick="navigateTo('contacts')"><div class="ql-icon">👥</div><div class="ql-label">Contatos</div></div>
      <div class="quick-link" onclick="navigateTo('proposals')"><div class="ql-icon">📋</div><div class="ql-label">Propostas</div></div>
      <div class="quick-link" onclick="navigateTo('inbox')"><div class="ql-icon">✉️</div><div class="ql-label">Central</div></div>
      <div class="quick-link" onclick="navigateTo('settings')"><div class="ql-icon">⚙️</div><div class="ql-label">Configurações</div></div>
    </div>
  `;
}

async function renderContacts() {
  const { data, error } = await sb
    .from('contacts')
    .select('id, name, email, phone, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { pageContent.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div>${error.message}</div></div>`; return; }
  if (!data?.length) { pageContent.innerHTML = `<div class="empty-state"><div class="icon">👥</div><div>Nenhum contato encontrado</div></div>`; return; }

  const rows = data.map(c => `
    <tr>
      <td>${esc(c.name || '—')}</td>
      <td>${esc(c.email || '—')}</td>
      <td>${esc(c.phone || '—')}</td>
      <td><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-inactive'}">${c.status || '—'}</span></td>
      <td>${c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}</td>
    </tr>`).join('');

  pageContent.innerHTML = `
    <div class="page-header"><h2>Contatos</h2></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Status</th><th>Cadastro</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

async function renderProposals() {
  const { data, error } = await sb
    .from('proposals')
    .select('id, title, status, total, created_at, contact_id')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { pageContent.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div>${error.message}</div></div>`; return; }
  if (!data?.length) { pageContent.innerHTML = `<div class="empty-state"><div class="icon">📋</div><div>Nenhuma proposta encontrada</div></div>`; return; }

  const cards = data.map(p => `
    <div class="proposal-card">
      <div class="proposal-info">
        <h3>${esc(p.title || 'Proposta sem título')}</h3>
        <p>Status: <strong>${esc(p.status || '—')}</strong> · ${p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''}</p>
      </div>
      <div class="proposal-amount">${p.total ? 'R$ ' + Number(p.total).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '—'}</div>
    </div>`).join('');

  pageContent.innerHTML = `<div class="page-header"><h2>Propostas</h2></div>${cards}`;
}

async function renderInbox() {
  const { data, error } = await sb
    .from('agent_inbox_items')
    .select('id, kind, status, created_at, note')
    .eq('organization_id', currentOrg?.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { pageContent.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div>${error.message}</div></div>`; return; }
  if (!data?.length) { pageContent.innerHTML = `<div class="empty-state"><div class="icon">✉️</div><div>Nenhum item na central</div></div>`; return; }

  const rows = data.map(item => `
    <tr>
      <td><span class="badge badge-active">${esc(item.kind || '—')}</span></td>
      <td>${esc(item.note || '—').substring(0, 60)}${(item.note || '').length > 60 ? '...' : ''}</td>
      <td>${item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '—'}</td>
    </tr>`).join('');

  pageContent.innerHTML = `
    <div class="page-header"><h2>Central de Atendimento</h2></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Tipo</th><th>Nota</th><th>Data</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function renderSettings() {
  pageContent.innerHTML = `
    <div class="settings-section">
      <h3>Informações da Organização</h3>
      <div class="setting-row"><span class="setting-label">Nome</span><span class="setting-value">${esc(currentOrg?.display_name || '—')}</span></div>
      <div class="setting-row"><span class="setting-label">Slug</span><span class="setting-value">${esc(currentOrg?.slug || '—')}</span></div>
      <div class="setting-row"><span class="setting-label">Status</span><span class="setting-value"><span class="badge ${currentOrg?.status === 'active' ? 'badge-active' : 'badge-inactive'}">${currentOrg?.status || '—'}</span></span></div>
      <div class="setting-row"><span class="setting-label">Fuso horário</span><span class="setting-value">${esc(currentOrg?.timezone || '—')}</span></div>
      <div class="setting-row"><span class="setting-label">Retenção de mídia</span><span class="setting-value">${currentOrg?.media_retention_days || '—'} dias</span></div>
    </div>
    <div class="settings-section">
      <h3>Usuário Atual</h3>
      <div class="setting-row"><span class="setting-label">E-mail</span><span class="setting-value">${esc(currentUser?.email || '—')}</span></div>
      <div class="setting-row"><span class="setting-label">ID</span><span class="setting-value" style="font-size:11px">${currentUser?.id || '—'}</span></div>
    </div>
  `;
}

// ── Helpers ───────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
