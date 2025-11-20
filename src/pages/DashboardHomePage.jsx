import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DashboardHomePage = () => {
  const { mongoUser, loading, error, refetchUser } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const hasRetriedRef = useRef(false); // Prevent infinite retries

  // Auto-retry logic ONLY if user fails to load (removed aggressive retry)
  useEffect(() => {
    // Only retry if:
    // 1. Not loading
    // 2. No user
    // 3. No error shown yet
    // 4. Haven't exceeded retries
    // 5. Haven't already tried
    if (!loading && !mongoUser && !error && retryCount < MAX_RETRIES && !hasRetriedRef.current) {
      hasRetriedRef.current = true;
      
      const timer = setTimeout(() => {
        console.log(`Retrying user fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        if (refetchUser) {
          refetchUser();
        }
        setRetryCount(prev => prev + 1);
        hasRetriedRef.current = false; // Allow next retry if needed
      }, 2000); // Single retry after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [loading, mongoUser, error, retryCount, refetchUser]);

  // Still loading
  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #4caf50',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <p style={{ fontSize: '18px', color: '#666' }}>
          Loading your dashboard...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state - but allow retry
  if (!mongoUser && (error || retryCount >= MAX_RETRIES)) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '30px',
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#856404', marginBottom: '15px' }}>
            ⚠️ Profile Load Failed
          </h2>
          <p style={{ color: '#856404', marginBottom: '20px' }}>
            {error || "We couldn't load your profile. This might be a temporary connection issue."}
          </p>
          <button
            onClick={() => {
              setRetryCount(0);
              hasRetriedRef.current = false;
              if (refetchUser) refetchUser();
            }}
            style={{
              padding: '12px 24px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Retry Loading
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '12px 24px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Still waiting for mongoUser
  if (!mongoUser) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Initializing profile...</p>
      </div>
    );
  }

  // Success - user loaded!
  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to AgriConnect KE, {mongoUser.profile?.name || mongoUser.email.split('@')[0]}! 👋</h1>
      
      {/* Role Display */}
      <div style={{ 
        padding: '15px', 
        background: '#e3f2fd', 
        border: '2px solid #2196f3',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <p style={{ fontSize: '18px', margin: 0 }}>
          Your Role: <strong style={{ color: '#1976d2' }}>{mongoUser.role}</strong>
        </p>
      </div>

      {/* Fallback warning */}
      {mongoUser._fallback && (
        <div style={{ 
          padding: '15px', 
          background: '#fff3cd', 
          border: '2px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ⚠️ Using cached profile. Some features may be limited.
        </div>
      )}

      {/* Role-Specific Dashboard */}
      {mongoUser.role === 'SUPPLIER' && <SupplierDashboard mongoUser={mongoUser} />}
      {mongoUser.role === 'BUYER' && <BuyerDashboard mongoUser={mongoUser} />}
      {mongoUser.role === 'TRANSPORTER' && <TransporterDashboard mongoUser={mongoUser} />}
    </div>
  );
};

// Supplier/Farmer Dashboard
const SupplierDashboard = ({ mongoUser }) => (
  <div>
    <h2>Supplier Dashboard</h2>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
      
      {/* Stats Cards */}
      <div style={{ padding: '20px', background: '#fff3e0', borderRadius: '8px', border: '2px solid #ff9800' }}>
        <h3>Transaction Volume</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
          KES {mongoUser.transactionVolume?.toLocaleString() || 0}
        </p>
        <small>Last 6 months</small>
      </div>

      <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '8px', border: '2px solid #4caf50' }}>
        <h3>Reserve Value</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
          KES {mongoUser.verifiedReserveValue?.toLocaleString() || 0}
        </p>
        <small>Verified crops</small>
      </div>
    </div>

    {/* Quick Actions */}
    <div style={{ marginTop: '30px' }}>
      <h3>Quick Actions</h3>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <Link to="/dashboard/create-product" style={buttonStyle('#4caf50')}>
          List New Product
        </Link>
        <Link to="/dashboard/my-loans" style={buttonStyle('#2196f3')}>
          Check Loan Eligibility
        </Link>
        <Link to="/dashboard" style={buttonStyle('#9c27b0')}>
          View Marketplace
        </Link>
        <Link to="/dashboard/transport" style={buttonStyle('#03a9f4')}>
          View Transport Services
        </Link>
      </div>
    </div>
  </div>
);

// Buyer Dashboard
const BuyerDashboard = ({ mongoUser }) => (
  <div>
    <h2>Buyer Dashboard</h2>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmin(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
      
      <div style={{ padding: '20px', background: '#f3e5f5', borderRadius: '8px', border: '2px solid #9c27b0' }}>
        <h3>Total Purchases</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
          KES {mongoUser.transactionVolume?.toLocaleString() || 0}
        </p>
        <small>Last 6 months</small>
      </div>
    </div>

    <div style={{ marginTop: '30px' }}>
      <h3>Quick Actions</h3>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <Link to="/dashboard/marketplace" style={buttonStyle('#9c27b0')}>
          Browse Products
        </Link>
        <Link to="/dashboard/my-loans" style={buttonStyle('#2196f3')}>
          Financing Options
        </Link>
        <Link to="/dashboard/transport" style={buttonStyle('#03a9f4')}>
          View Transport Services
        </Link>
      </div>
    </div>
  </div>
);

// Transporter Dashboard
const TransporterDashboard = ({ mongoUser }) => (
  <div>
    <h2>Transporter Dashboard</h2>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
      
      <div style={{ padding: '20px', background: '#e1f5fe', borderRadius: '8px', border: '2px solid #03a9f4' }}>
        <h3>Total Deliveries</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0288d1' }}>
          KES {mongoUser.transactionVolume?.toLocaleString() || 0}
        </p>
        <small>Last 6 months</small>
      </div>
    </div>

<div style={{ marginTop: '30px', padding: '20px', background: '#5c6fee80', borderRadius: '8px' }}>
    <h3>Current Assignments</h3>
    <p>🚧 Orders assigned to you will appear here (Status: Awaiting Shipment).</p>
  </div>

    <div style={{ marginTop: '30px' }}>
      <h3>Quick Actions</h3>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <Link to="/dashboard/transport" style={buttonStyle('#03a9f4')}>
          View Available Jobs
        </Link>
        <Link to="/dashboard/jobs" style={buttonStyle('#03a9f4')}>
          View My Assigned Jobs
        </Link>
        <Link to="/dashboard/my-loans" style={buttonStyle('#2196f3')}>
          Equipment Financing
        </Link>
      </div>
    </div>

    <div style={{ marginTop: '30px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
      <p><strong>Coming Soon:</strong> Interactive delivery map and real-time job matching!</p>
    </div>
  </div>
);

// Reusable button style
const buttonStyle = (bgColor) => ({
  display: 'inline-block',
  padding: '12px 24px',
  background: bgColor,
  color: 'white',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  transition: 'transform 0.2s',
  cursor: 'pointer',
  border: 'none',
});

export default DashboardHomePage;