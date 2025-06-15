// Admin login functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin login script loaded');
  console.log('API URL:', API_URL);
  
  // Check if already logged in
  const token = localStorage.getItem('adminToken');
  if (token) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  const loginForm = document.getElementById('login-form');
  const loginAlert = document.getElementById('login-alert');
  
  if (!loginForm) {
    console.error('Login form not found');
    return;
  }
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
      showLoginError('Please enter both username and password');
      return;
    }
    
    try {
      console.log('Sending login request to:', `${API_URL}/admin/login`);
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);
      
      if (data.success && data.token) {
        // Store token and redirect to dashboard
        localStorage.setItem('adminToken', data.token);
        window.location.href = 'dashboard.html';
      } else {
        showLoginError(data.error || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      showLoginError('Failed to connect to the server. Please try again later.');
    }
  });
  
  function showLoginError(message) {
    console.error('Login error:', message);
    loginAlert.textContent = message;
    loginAlert.classList.remove('d-none');
    
    // Hide after 5 seconds
    setTimeout(() => {
      loginAlert.classList.add('d-none');
    }, 5000);
  }
});