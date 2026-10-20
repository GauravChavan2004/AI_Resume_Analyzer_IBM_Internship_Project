// Dynamic API Base URL resolution (for running frontend and backend on separate ports)
var API_BASE ='http://Ai-resume-api-env.eba-rsy6zupp.eu-north-1.elasticbeanstalk.com';

// Auth view state management
function toggleAuthForm(mode) {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const footerText = document.getElementById('footer-text');
  const errAlert = document.getElementById('auth-error-alert');
  const succAlert = document.getElementById('auth-success-alert');

  // Hide alerts on toggle
  errAlert.style.display = 'none';
  succAlert.style.display = 'none';

  if (mode === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('d-none');
    registerForm.classList.add('d-none');
    footerText.innerHTML = `Don't have an account? <a href="#" onclick="toggleAuthForm('register')">Register Now</a>`;
  } else {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    loginForm.classList.add('d-none');
    registerForm.classList.remove('d-none');
    footerText.innerHTML = `Already have an account? <a href="#" onclick="toggleAuthForm('login')">Sign In</a>`;
  }
}

// Intercept form submissions
document.addEventListener('DOMContentLoaded', () => {
  // If user already logged in, redirect to dashboard
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = 'index.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const errAlert = document.getElementById('auth-error-alert');
  const succAlert = document.getElementById('auth-success-alert');

  function showAlert(alertEl, msg, isSuccess = false) {
    alertEl.textContent = msg;
    alertEl.style.display = 'block';
    
    // Hide opposite alert
    const opp = isSuccess ? errAlert : succAlert;
    opp.style.display = 'none';
  }

  // Handle Login Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      // Save token & user profile
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showAlert(succAlert, 'Login successful! Redirecting to dashboard...', true);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);

    } catch (err) {
      showAlert(errAlert, err.message);
    }
  });

  // Handle Registration Submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Save token & user profile
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showAlert(succAlert, 'Account registered successfully! Loading dashboard...', true);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);

    } catch (err) {
      showAlert(errAlert, err.message);
    }
  });
});
