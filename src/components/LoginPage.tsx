import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resetAdminPassword } from '../utils/credentials';
import './LoginPage.css';

const ADMIN_EMAIL = 'admin@school.com';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      navigate('/dashboard');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      // Error is handled by context and displayed in UI
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setShowForgotPassword(true);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    // Verify admin email
    if (forgotEmail !== ADMIN_EMAIL) {
      setForgotError('❌ This email is not registered for password reset. Only the admin account can reset their password.');
      return;
    }

    // Validate passwords
    if (!newPassword.trim()) {
      setForgotError('❌ Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setForgotError('❌ Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('❌ Passwords do not match.');
      return;
    }

    // Reset the admin password
    try {
      resetAdminPassword(newPassword);
      setForgotSuccess('✅ Admin password reset successfully! You can now login with the new password.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setForgotError('❌ Error resetting password. Please try again.');
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
  };

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>School Result System</h1>
          <p>Teacher Login Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              placeholder="Enter your email"
              disabled={isLoading}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="Enter your password"
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            className="forgot-password-link"
            onClick={handleForgotPasswordClick}
            disabled={isLoading}
          >
            Forgot Password?
          </button>
        </form>

        <div className="login-footer">
          <p>Contact your administrator for access credentials.</p>
          <p className="register-link-text">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="register-link"
            >
              Register your school
            </button>
          </p>
          <p className="created-by">Created by Questbridge Consulting, UK</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="forgot-password-overlay">
          <div className="forgot-password-modal">
            <div className="forgot-password-header">
              <h2>Reset Admin Password</h2>
              <button
                type="button"
                className="close-btn"
                onClick={closeForgotPassword}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="forgot-password-form">
              <div className="form-info">
                <p>⚠️ This feature is only available for the admin account (admin@school.com)</p>
              </div>

              <div className="form-group">
                <label htmlFor="forgot-email">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <small>Must be at least 8 characters long</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              {forgotError && <div className="error-message">{forgotError}</div>}
              {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}

              <div className="forgot-password-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeForgotPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="reset-btn"
                  disabled={!forgotEmail.trim() || !newPassword.trim() || !confirmPassword.trim()}
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
