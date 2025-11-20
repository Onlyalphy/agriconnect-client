import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supaBaseClient';
import { useNavigate } from 'react-router-dom';
import CreateProductForm from '../components/CreateProductForm';
import ProductList from '../components/ProductList';

const DashboardPage = () => {
  const { user, mongoUser, loading, error, refetchUser } = useAuth(); 
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleProductCreated = (newProduct) => {
    console.log('New product created, refreshing list...');
    setRefreshTrigger(prev => prev + 1);
  };

  // Auto-retry on error
  useEffect(() => {
    if (!loading && !mongoUser && error && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        refetchUser();
        setRetryCount(prev => prev + 1);
      }, 2000 * (retryCount + 1)); // 2s, 4s, 6s

      return () => clearTimeout(timer);
    }
  }, [loading, mongoUser, error, retryCount, refetchUser]);

  // Loading state
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
          Loading Dashboard...
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

  // Error state
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
            ⚠️ Could Not Load Profile
          </h2>
          <p style={{ color: '#856404', marginBottom: '20px' }}>
            {error || "Unable to load your profile after multiple attempts."}
          </p>
          <button
            onClick={() => {
              setRetryCount(0);
              refetchUser();
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
            🔄 Try Again
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // No user but not loading
  if (!mongoUser) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Initializing... (Attempt {retryCount + 1}/{MAX_RETRIES})</p>
      </div>
    );
  }

  // Success - show dashboard
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button 
        onClick={handleLogout}
        style={{ 
          padding: '10px 20px', 
          background: '#dc3545', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer', 
          float: 'right',
          fontWeight: 'bold'
        }}
      >
        Log Out
      </button>
      
      <h1>Welcome, {mongoUser.profile?.name || mongoUser.email?.split('@')[0] || 'User'}!</h1>
      <p>Your Role: <strong>{mongoUser.role}</strong></p>
      
      {mongoUser._fallback && (
        <div style={{ 
          padding: '10px', 
          background: '#fff3cd', 
          border: '1px solid #ffc107', 
          borderRadius: '4px',
          marginBottom: '20px',
          clear: 'both'
        }}>
          ⚠️ Using temporary profile data. Backend connection unavailable.
        </div>
      )}

      <hr style={{ margin: '2rem 0', clear: 'both' }} />

      {mongoUser.role === 'SUPPLIER' && (
        <>
          <CreateProductForm onProductCreated={handleProductCreated} />
          <ProductList refreshTrigger={refreshTrigger} />
        </>
      )}
      
      {mongoUser.role === 'BUYER' && (
        <div>
          <h2>Marketplace</h2>
          <ProductList refreshTrigger={refreshTrigger} />
        </div>
      )}

      {mongoUser.role === 'TRANSPORTER' && (
        <div>
          <h2>Available Deliveries</h2>
          <p>This is where the map and list of delivery jobs will go.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;