const API_BASE_URL = 'http://localhost:5004';
const $ = (id) => document.getElementById(id);
const SESSION_KEY = 'nexusLearningUser';

document.addEventListener('DOMContentLoaded', () => {
  setActiveNavigation();
  initAuthExperience();
  if (!document.body.classList.contains('auth-page')) initFloatingChatbot();
});

function setActiveNavigation() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((link) => {
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });

  const authLink = document.querySelector('[data-auth-link]');
  if (!authLink) return;
  const user = getSessionUser();
  if (user) {
    authLink.textContent = user.name ? user.name.split(' ')[0] : 'Account';
    authLink.href = '#';
    authLink.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem(SESSION_KEY);
      window.location.reload();
    });
  }
}

function getSessionUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function initAuthExperience() {
  const form = $('authForm');
  const toggle = $('modeToggle');
  if (!form || !toggle) return;

  let isSignUp = false;
  const updateMode = () => {
    $('form-title').textContent = isSignUp ? 'Create your workspace' : 'Welcome back';
    $('form-subtitle').textContent = isSignUp ? 'Set up your account and start learning with intent.' : 'Sign in to continue to your workspace.';
    $('nameGroup').hidden = !isSignUp;
    $('fullName').required = isSignUp;
    $('password').autocomplete = isSignUp ? 'new-password' : 'current-password';
    $('submitLabel').textContent = isSignUp ? 'Create account' : 'Sign in securely';
    $('switchPrompt').textContent = isSignUp ? 'Already have an account?' : 'New to Nexus Learning?';
    toggle.textContent = isSignUp ? 'Sign in' : 'Create an account';
  };

  toggle.addEventListener('click', () => { isSignUp = !isSignUp; clearAuthAlert(); updateMode(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    if (isSignUp && name.length < 2) return showAuthAlert('Please enter your full name.', 'error');
    if (!email || password.length < 6) return showAuthAlert('Use a valid email and a password with at least 6 characters.', 'error');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: name || email.split('@')[0], email }));
    showAuthAlert(isSignUp ? 'Your workspace is ready. Redirecting…' : 'Signed in successfully. Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 650);
  });
}

function showAuthAlert(message, type) {
  const alert = $('authAlert');
  if (!alert) return;
  alert.textContent = message;
  alert.className = `auth-alert ${type}`;
}

function clearAuthAlert() {
  const alert = $('authAlert');
  if (alert) { alert.textContent = ''; alert.className = 'auth-alert'; }
}

function initFloatingChatbot() {
  const widgetHTML = `
    <div class="chatbot-widget">
      <button class="chatbot-toggle-btn" id="chatToggleBtn" onclick="toggleChatbot()" title="Open AI study assistant" aria-label="Open AI study assistant"><i class="fas fa-sparkles"></i></button>
      <div class="chatbot-window" id="chatWindow" role="dialog" aria-label="AI study assistant">
        <div class="chatbot-header"><div><i class="fas fa-sparkles"></i> <strong>AI study assistant</strong></div><button onclick="toggleChatbot()" aria-label="Close assistant" style="background:none;border:0;color:white;"><i class="fas fa-times"></i></button></div>
        <div class="chatbot-messages" id="chatMessages"><div class="chat-bubble bot">Hi! I’m here to help you understand a topic, plan your next step, or work through a tricky question.</div></div>
        <div class="chatbot-input-area"><input type="text" id="chatInput" placeholder="Ask a question…" onkeypress="handleChatKeyPress(event)" aria-label="Ask the AI assistant"><button class="btn" onclick="sendWidgetMessage()" aria-label="Send question"><i class="fas fa-paper-plane"></i></button></div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', widgetHTML);
}

function toggleChatbot() {
  const chatWindow = $('chatWindow');
  if (chatWindow) chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
}

function handleChatKeyPress(event) { if (event.key === 'Enter') sendWidgetMessage(); }

async function sendWidgetMessage() {
  const inputEl = $('chatInput');
  const messagesEl = $('chatMessages');
  if (!inputEl || !messagesEl) return;
  const question = inputEl.value.trim();
  if (!question) return;
  appendBubble(messagesEl, question, 'user');
  inputEl.value = '';
  const loadingBubble = appendBubble(messagesEl, 'Thinking…', 'bot');
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
    const data = await response.json();
    loadingBubble.textContent = response.ok && data.answer ? data.answer : `Unable to answer right now: ${data.error || 'Please try again.'}`;
  } catch (error) {
    loadingBubble.textContent = 'The assistant is offline. Start the backend service and try again.';
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendBubble(container, text, type) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}
