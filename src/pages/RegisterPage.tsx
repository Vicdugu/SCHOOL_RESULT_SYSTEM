import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './RegisterPage.css';

interface RegisterFormData {
  school_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>({
    school_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const validateForm = (): boolean => {
    if (!formData.school_name.trim()) {
      setError('School name is required');
      return false;
    }

    if (formData.school_name.length > 255) {
      setError('School name must be 255 characters or less');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school_name: formData.school_name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = (data as ApiError).error || (data as ApiError).message || 'Registration failed';
        setError(errorMessage);
        return;
      }

      // Store token and redirect
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('schoolId', data.user.school_id);

      // Update auth context
      login(data.token, data.user);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Register Your School</h1>
          <p>Create an account to get started with School Result System</p>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          {/* School Name */}
          <div className="form-group">
            <label htmlFor="school_name">School Name</label>
            <input
              id="school_name"
              type="text"
              name="school_name"
              placeholder="e.g., St. John's Academy"
              value={formData.school_name}
              onChange={handleInputChange}
              disabled={loading}
              maxLength={255}
            />
            <small className="char-count">
              {formData.school_name.length}/255
            </small>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Admin Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="e.g., admin@yourschool.edu"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
            <small className="help-text">
              This will be your login username
            </small>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
            <small className="help-text">
              Minimum 6 characters
            </small>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              'Register School'
            )}
          </button>
        </form>

        {/* Terms and Help */}
        <div className="register-footer">
          <p className="terms-text">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="login-text">
            Already have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/login')}
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <h3>What happens next?</h3>
          <ul>
            <li>✓ Your school account is created instantly</li>
            <li>✓ You'll be logged in as the admin</li>
            <li>✓ You can immediately add teachers and pupils</li>
            <li>✓ Start entering results right away</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
