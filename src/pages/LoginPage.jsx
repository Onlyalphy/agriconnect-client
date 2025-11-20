import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supaBaseClient'; // Import supabase client

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const onSubmit = async (formData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log('🔐 Starting direct API login attempt...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error:', errorData);
        throw new Error(errorData.error_description || errorData.msg || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ Login successful!', data);

      // Set the session in Supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      console.log('✅ Session set in Supabase client');

      navigate('/dashboard');

    } catch (error) {
      console.error('💥 Caught error:', error);
      
      if (error.name === 'AbortError') {
        setAuthError('Request timed out. Please check your connection and try again.');
      } else if (error.message.includes('Invalid login credentials')) {
        setAuthError('Invalid email or password.');
      } else if (error.message.includes('fetch')) {
        setAuthError('Network error. Please check your internet connection.');
      } else {
        setAuthError(error.message || 'An error occurred during login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Log In to AgriConnect KE</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div>
          <label>Email:</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.email && <p style={{ color: 'red', fontSize: '12px' }}>{errors.email.message}</p>}
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.password && <p style={{ color: 'red', fontSize: '12px' }}>{errors.password.message}</p>}
        </div>

        {authError && (
          <div style={{ 
            padding: '10px', 
            background: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '4px',
            color: '#c33',
            fontSize: '14px'
          }}>
            {authError}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ 
            padding: '10px', 
            background: isLoading ? '#ccc' : '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isLoading ? 'not-allowed' : 'pointer' 
          }}
        >
          {isLoading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default LoginPage;