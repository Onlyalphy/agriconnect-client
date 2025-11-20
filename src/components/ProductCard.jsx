import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const ProductCard = ({ product, onProductDeleted }) => {
  const { mongoUser } = useAuth();
  const navigate = useNavigate();
  
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null); // 'ordering', 'paying', 'verifying', 'success', 'failed'
  
  // Payment State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  
  // Payment verification polling
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // Used to display the final result
  const pollingIntervalRef = useRef(null);
  const pollCountRef = useRef(0);

  const isOwner = mongoUser?._id === product.supplierId;
  const aiData = product.aiSuggestedPrice;
  const isAiSuggestionAvailable = aiData && aiData.explanation;

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Auto-check payment status after STK push
  const startPaymentVerification = (orderId) => {
    console.log('🔍 Starting payment verification for order:', orderId);
    setIsCheckingPayment(true);
    pollCountRef.current = 0;

    // Clear previous interval if any
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Poll every 3 seconds for up to 2 minutes (40 attempts)
    pollingIntervalRef.current = setInterval(async () => {
      pollCountRef.current++;
      
      if (pollCountRef.current > 40) {
        console.log('⏱️ Payment verification timeout');
        clearInterval(pollingIntervalRef.current);
        setIsCheckingPayment(false);
        setPaymentStatus('failed'); // Set status to failed for display
        setError('Payment verification timed out. Please check "My Orders" for status.');
        return;
      }

      try {
        const response = await api.checkPaymentStatus(orderId);
        console.log(`📊 Payment check #${pollCountRef.current}:`, response.data.status);

        if (response.data.status === 'Paid') {
          console.log('✅ Payment CONFIRMED!');
          clearInterval(pollingIntervalRef.current);
          setStatus('success'); // General success status
          setPaymentStatus('confirmed'); // Final result status
          setIsCheckingPayment(false);
          
          // Refresh the page to update product stock and hide payment UI
          setTimeout(() => window.location.reload(), 2000); 
          
        } else if (response.data.status === 'Payment Failed') {
          console.log('❌ Payment FAILED');
          clearInterval(pollingIntervalRef.current);
          setStatus('failed');
          setPaymentStatus('failed');
          setIsCheckingPayment(false);
          setError('Payment failed. Please try again or check My Orders.');
        }
      } catch (err) {
        console.error('Error checking payment:', err);
      }
    }, 3000); // Check every 3 seconds
  };

  // Step 1: Create Order
  const handleInitiateBuy = async () => {
    setIsLoading(true);
    setError(null);

    if (quantity > product.quantity) {
      setError(`Only ${product.quantity} available.`);
      setIsLoading(false);
      return;
    }

    try {
      const orderData = {
        productId: product._id,
        quantity: Number(quantity),
      };
      
      const response = await api.createOrder(orderData);
      console.log('Order created:', response.data); 
      setCreatedOrder(response.data); // Set the order details
      setStatus('ordering');
      setShowPaymentInput(true); // Proceed to payment step
      setIsLoading(false);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating order.');
      setIsLoading(false);
    }
  };

  // Step 2: Trigger M-Pesa STK Push
  const handlePay = async () => {
    if (!phoneNumber.startsWith('254') && !phoneNumber.startsWith('07') && !phoneNumber.startsWith('01')) {
      setError('Please enter a valid Safaricom number (e.g., 0712...)');
      return;
    }

    setIsLoading(true);
    setStatus('paying');
    setError(null);
    
    try {
      // NOTE: We now use the totalPrice from the backend's saved order
      await api.requestStkPush({
        amount: createdOrder.totalPrice,
        phoneNumber: phoneNumber,
        orderId: createdOrder._id
      });

      setStatus('verifying'); // Set UI state to 'Verifying'
      alert(`📱 STK Push sent to ${phoneNumber}! Checking your phone...`);
      
      // Start automatic payment verification
      startPaymentVerification(createdOrder._id);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Payment request failed. Check backend logs.');
      setStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Supplier Actions (Delete)
  const handleDelete = async () => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setIsLoading(true);
    try {
      await api.deleteProduct(product._id);
      if (onProductDeleted) onProductDeleted();
    } catch (err) {
      setError('Delete failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', background: 'white', position: 'relative' }}>
      <img 
        src={product.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" font-size="18" text-anchor="middle" fill="%23999" dy=".3em"%3ENo Image%3C/svg%3E'} 
        alt={product.name} 
        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} 
      />
      
      <h3 style={{ marginBottom: '0.5rem' }}>{product.name}</h3>
      <p style={{ color: '#e67e22', fontWeight: 'bold' }}>In Stock: {product.quantity} {product.unit}</p>
      <p style={{ fontWeight: 'bold', fontSize: '18px' }}>KES {product.askingPrice} /{product.unit}</p>
      <p style={{ fontSize: '14px', color: '#555' }}>📍 {product.county}</p>
      
      {/* --- FIX: Display the AI Suggestion Correctly --- */}
      {isAiSuggestionAvailable && (
        <div style={{ background: '#e8e9f5ff', padding: '8px', borderRadius: '5px', fontSize: '12px', margin: '10px 0', border: '1px solid #4CAF50', color: '#1b5e20' }}>
          <p style={{ margin: '0 0 5px', fontWeight: 'bold', fontSize: '13px' }}>
            AI Price Recommendation: KES {aiData.min} - KES {aiData.max} / {product.unit}
          </p>
          <p style={{ margin: 0, fontSize: '12px' }}>
            {aiData.explanation.substring(0, 200)}
            {aiData.explanation.length > 200 && '...'}
          </p>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && <div style={{ color: 'red', fontSize: '13px', margin: '5px 0', padding: '5px', background: '#fee' }}>{error}</div>}

      {/* VERIFICATION STATUS */}
      {isCheckingPayment && (
        <div style={{ color: '#ff9800', fontWeight: 'bold', margin: '10px 0', textAlign: 'center', padding: '10px', background: '#fff3e0', borderRadius: '5px' }}>
          ⏳ Verifying payment... (Check #{pollCountRef.current})
          <br />
          <small>Please complete payment on your phone</small>
        </div>
      )}

      {/* FINAL STATUS MESSAGES */}
      {paymentStatus === 'confirmed' && (
        <div style={{ color: 'green', fontWeight: 'bold', margin: '10px 0', textAlign: 'center', padding: '10px', background: '#e8f5e9', borderRadius: '5px' }}>
          ✅ Payment Confirmed! Order Successful!
        </div>
      )}
      {paymentStatus === 'failed' && (
        <div style={{ color: 'red', fontWeight: 'bold', margin: '10px 0', textAlign: 'center', padding: '10px', background: '#ffebee', borderRadius: '5px' }}>
          ❌ Payment Failed. Check My Orders for details.
        </div>
      )}

      {/* SUPPLIER CONTROLS */}
      {isOwner && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={() => navigate(`/dashboard/edit-product/${product._id}`)} disabled={isLoading || isCheckingPayment} style={btn('#3498db')}>Edit</button>
          <button onClick={handleDelete} disabled={isLoading || isCheckingPayment} style={btn('#e74c3c')}>Delete</button>
        </div>
      )}

      {/* BUYER CONTROLS (Only visible if not owner and not success/verifying) */}
      {!isOwner && paymentStatus !== 'confirmed' && (
        <>
          {/* Main Buy Input */}
          {!showPaymentInput && (
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
              <input 
                type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} 
                min="1" max={product.quantity} 
                style={{ width: '60px', padding: '8px' }} 
              />
              <button onClick={handleInitiateBuy} 
                disabled={isLoading || isCheckingPayment || product.quantity === 0}// Disable if out of stock 
                //style={btn('#28a745', '100%')}//
                className="w-full py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition">
                {isLoading ? 'Processing...' : isCheckingPayment ? 'Verifying...' : 'Buy Now'}
              </button>
            </div>
          )}

          {/* Payment Modal/Input */}
          {showPaymentInput && paymentStatus !== 'failed' && (
            <div style={{ marginTop: '15px' }}>
              <p style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 'bold' }}>
                Pay KES {createdOrder?.totalPrice?.toLocaleString()}
              </p>
              <input 
                type="text" 
                placeholder="0712345678" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={isCheckingPayment}
              />
              <button 
                onClick={handlePay} 
                disabled={isLoading || isCheckingPayment} 
                style={btn('#28a745', '100%')}
              >
                {isLoading ? 'Sending Push...' : 'Pay with M-Pesa'}
              </button>
              <button 
                onClick={() => {
                  setShowPaymentInput(false);
                  setStatus(null);
                  setPaymentStatus(null);
                }} 
                style={{ ...btn('#777', '100%'), marginTop: '5px' }}
                disabled={isCheckingPayment}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const btn = (bg, width = 'auto') => ({
  padding: '8px 12px', background: bg, color: 'white', border: 'none', 
  borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width
});