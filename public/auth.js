const apiBase = '/api';

function setMessage(el, text, type) {
  el.textContent = text;
  el.classList.remove('hidden', 'success', 'error');
  el.classList.add(type || 'success');
}

function storeToken(token) {
  localStorage.setItem('jwt_token', token);
}

function getToken() {
  return localStorage.getItem('jwt_token');
}

function clearToken() {
  localStorage.removeItem('jwt_token');
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('registerMessage');

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
    };

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      setMessage(message, 'User registered successfully.', 'success');
      registerForm.reset();
    } catch (error) {
      setMessage(message, error.message, 'error');
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('loginMessage');

    const payload = {
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value,
    };

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      storeToken(data.token);
      setMessage(message, 'Login successful. Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard', 600);
    } catch (error) {
      setMessage(message, error.message, 'error');
    }
  });
}

if (window.location.pathname === '/dashboard') {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
  }
}
