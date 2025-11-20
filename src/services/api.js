// src/services/api.js - OPTIMIZED FOR SPEED
import axios from 'axios';
import { supabase } from '../supaBaseClient';

const API_URL =   import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('🔗 API Client configured for:', API_URL);

// REDUCED TIMEOUT - Backend must respond fast
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
});

let tokenRefreshPromise = null;

apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (tokenRefreshPromise) {
        console.log('⏳ Waiting for ongoing token refresh...');
        await tokenRefreshPromise;
      }

      tokenRefreshPromise = supabase.auth.getSession();
      const { data: { session }, error } = await tokenRefreshPromise;
      tokenRefreshPromise = null;

      if (error) {
        console.error('❌ Failed to get session:', error);
        throw error;
      }

      if (session?.access_token) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('✅ Token attached to request:', config.url);
      } else {
        console.warn('⚠️ No session token available for request:', config.url);
      }

      return config;
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('❌ Request interceptor setup error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method.toUpperCase()} ${response.config.url} (${response.status})`);
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      code: error.code,
    };

    console.error('❌ API Error:', errorDetails);

    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out (5s). Backend is too slow!';
    } else if (error.code === 'ERR_NETWORK') {
      error.message = 'Network error. Check if backend is running at ' + API_URL;
    } else if (error.response?.status === 401) {
      error.message = 'Authentication failed. Please log in again.';
    } else if (error.response?.status === 404) {
      error.message = 'Resource not found: ' + error.config?.url;
    } else if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }

    return Promise.reject(error);
  }
);

// --- PUBLIC API CALLS ---
export const publicSignup = (signupData) => {
  console.log('📝 Public signup request');
  
  return axios.post(`${API_URL}/auth/signup`, signupData, { 
    timeout: 10000, // 10s for signup (more complex)
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('✅ Signup response:', response.data);
    return response;
  }).catch(error => {
    console.error('❌ Signup failed:', error.response?.data || error.message);
    throw error;
  });
};

// --- PROTECTED API FUNCTIONS ---
export const getMe = () => {
  console.log('👤 Fetching user profile...');
  return apiClient.get('/users/me');
};

export const getProductById = (productId) => {
  console.log(`📦 Fetching single product ${productId}...`);
  return apiClient.get(`/products/${productId}`);
};

export const getProducts = () => {
  console.log('📦 Fetching products...');
  return apiClient.get('/products');
};

export const createProduct = (productData) => {
  console.log('✨ Creating new product...');
  return apiClient.post('/products', productData);
};

export const getLoanCalculation = () => {
  console.log('💰 Calculating loan eligibility...');
  return apiClient.post('/ai/calculate-loan');
};

export const getTransporters = () => {
  console.log('🚚 Fetching transporters...');
  return apiClient.get('/transporters');
};

export const createOrder = (orderData) => {
  console.log('🛒 Creating new order...');
  return apiClient.post('/orders', orderData);
};

export const bookTransport = (orderId, transporterId) => {
  console.log(`🚚 Assigning order ${orderId} to transporter ${transporterId}...`);
  return apiClient.post(`/orders/book-transport/${orderId}`, { transporterId });
};

export const getMyOrders = () => {
  console.log('📋 Fetching my orders...');
  return apiClient.get('/orders/my-orders');
};

export const requestStkPush = (paymentData) => {
  console.log(`📱 Requesting M-Pesa STK push for ${paymentData.phoneNumber}...`);
  return apiClient.post('/payments/stk-push', paymentData);
};

export const checkPaymentStatus = (orderId) => {
  console.log(`🔍 Checking payment status for order: ${orderId}`);
  return apiClient.get(`/payments/status/${orderId}`);
};

export const updateProduct = (productId, updateData) => {
  console.log(`✨ Updating product ${productId}...`);
  return apiClient.put(`/products/${productId}`, updateData);
};

export const deleteProduct = (productId) => {
  console.log(`🗑️ Deleting product ${productId}...`);
  return apiClient.delete(`/products/${productId}`);
};

export const updateOrderStatus = (orderId, newStatusData) => {
  console.log(`Updating order ${orderId} status to ${newStatusData.newStatus}...`);
  return apiClient.put('/orders/status/${orderId}',  newStatusData );
};

const api = {
  getMe,
  getProducts,
  getProductById,
  createProduct,
  getLoanCalculation,
  getTransporters,
  createOrder,
  bookTransport,
  updateOrderStatus,
  getMyOrders,
  requestStkPush,
  checkPaymentStatus,
  updateProduct,
  deleteProduct
};

export default api;