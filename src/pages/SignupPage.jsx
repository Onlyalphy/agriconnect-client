import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supaBaseClient';
import { publicSignup } from '../services/api';

const SignupPage = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const selectedRole = watch('role');
  
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (formData) => {
    setIsLoading(true);
    setAuthError(null);

    let supabaseUserId = null;

    try {
      console.log('📝 Starting signup process...');
      
      // Step 1: Create Supabase Auth User
      console.log('1️⃣ Creating Supabase user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role,
            full_name: formData.fullName 
          }
        }
      });

      if (authError) {
        console.error('❌ Supabase signup error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error("No user data returned from Supabase.");
      }
      
      supabaseUserId = authData.user.id;
      console.log('✅ Supabase user created:', supabaseUserId);
      
      // Step 2: Create MongoDB Profile via Backend API
      console.log('2️⃣ Creating MongoDB profile...');
      const mongoProfileData = {
        supabaseUserId: supabaseUserId,
        email: formData.email,
        role: formData.role,
        fullName: formData.fullName,
        location: formData.location,
        vehicleDetails: formData.vehicleDetails || null
      };
      
      console.log('📤 Sending to backend:', mongoProfileData);
      
      const backendResponse = await publicSignup(mongoProfileData);
      console.log('✅ MongoDB profile created:', backendResponse.data);
      
      alert('Sign up successful! Please check your email to confirm your account.');
      navigate('/login');

    } catch (error) {
      console.error('❌ Signup error:', error);
      
      // If Supabase user was created but MongoDB failed, still allow login with fallback
      if (supabaseUserId && error.response?.status >= 400) {
        console.warn('⚠️ Supabase user created but MongoDB profile failed');
        alert('Account created! Please log in. Some features may be limited until your profile is fully set up.');
        navigate('/login');
        return;
      }
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Signup failed. Please try again.';
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '40px auto', 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Create Your AgriConnect KE Account
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Role Selector */}
        <div>
          <label style={{ fontWeight: 'bold' }}>I am a:</label>
          <select 
            {...register('role', { required: 'Please select your role' })}
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">-- Select Your Role --</option>
            <option value="SUPPLIER">Supplier (Farmer)</option>
            <option value="BUYER">Buyer (Retailer, Wholesaler)</option>
            <option value="TRANSPORTER">Transporter</option>
          </select>
          {errors.role && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.role.message}</p>}
        </div>

        {/* Full Name Field */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Full Name:</label>
          <input
            type="text"
            {...register('fullName', { required: 'Full name is required' })}
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="e.g., John Kamau"
          />
          {errors.fullName && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.fullName.message}</p>}
        </div>

        {/* Location Field */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Your County:</label>
          <input
            type="text"
            {...register('location', { required: 'Your county is required' })}
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="e.g., Kiambu, Nairobi"
          />
          {errors.location && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.location.message}</p>}
        </div>

        {/* Email Input */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Email:</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="your@email.com"
          />
          {errors.email && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>}
        </div>

        {/* Password Input */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Password:</label>
          <input
            type="password"
            {...register('password', { 
              required: 'Password is required', 
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="At least 6 characters"
          />
          {errors.password && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.password.message}</p>}
        </div>

        {/* Conditional Transporter Field */}
        {selectedRole === 'TRANSPORTER' && (
          <div>
            <label style={{ fontWeight: 'bold' }}>Vehicle Details:</label>
            <input
              type="text"
              {...register('vehicleDetails', { required: 'Vehicle details are required' })}
              style={{ 
                width: '100%', 
                padding: '10px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="e.g., 5-tonne truck"
            />
            {errors.vehicleDetails && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.vehicleDetails.message}</p>}
          </div>
        )}

        {authError && (
          <div style={{ 
            padding: '10px', 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00'
          }}>
            {authError}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ 
            padding: '12px', 
            background: isLoading ? '#ccc' : '#4caf50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background 0.3s'
          }}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account? <Link to="/login" style={{ color: '#4caf50', fontWeight: 'bold' }}>Log In</Link>
      </p>
    </div>
  );
};

export default SignupPage;