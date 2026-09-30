const requestResetForm = document.getElementById('requestResetForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const resetMessage = document.getElementById('resetMessage');

function showMessage(text, type) {
  resetMessage.textContent = text;
  resetMessage.classList.remove('hidden', 'success', 'error');
  resetMessage.classList.add(type);
}

requestResetForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('resetEmail').value.trim() }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to create reset token');
    }

    showMessage(data.resetToken
      ? `Development reset token: ${data.resetToken}`
      : data.message, 'success');
    resetPasswordForm.classList.remove('hidden');
    if (data.resetToken) {
      document.getElementById('resetToken').value = data.resetToken;
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

resetPasswordForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: document.getElementById('resetToken').value.trim(),
        password: document.getElementById('newPassword').value,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to reset password');
    }

    showMessage('Password reset successfully. Redirecting to login...', 'success');
    resetPasswordForm.reset();
    setTimeout(() => { window.location.href = '/login'; }, 800);
  } catch (error) {
    showMessage(error.message, 'error');
  }
});
