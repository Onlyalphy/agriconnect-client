import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supaBaseClient';


//Basic CSS for the layout (add to your App.css or index.css)
/*
.dashboard-layout { display: flex; min-height: 100vh; }
.sidebar { width: 250px; background: #f4f4f4; padding: 20px; }
.sidebar-nav { list-style: none; padding: 0; }
.sidebar-nav li { margin-bottom: 10px; }
.sidebar-nav a { text-decoration: none; color: #333; font-weight: bold; }
.sidebar-nav a.active { color: #007bff; }
.dashboard-content { flex: 1; padding: 20px; }
*/

const DashboardLayout = () => {
  const { mongoUser, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div>
      {/* Navigation Bar */}
      <nav style={{ 
        background: '#2c3e50', 
        padding: '15px 30px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        color: 'white'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
            AgriConnect KE
          </Link>
          
          <Link to="/dashboard" style={navLinkStyle}>Home</Link>
          <Link to="/dashboard/marketplace" style={navLinkStyle}>Marketplace</Link>
          <Link to="/dashboard/transport" style={navLinkStyle}>Transport</Link>
          <Link to="/dashboard/my-orders" style={navLinkStyle}>My Orders</Link>
          
          {mongoUser?.role === 'SUPPLIER' && (
            <Link to="/dashboard/create-product" style={navLinkStyle}>List Product</Link>
          )}
          
          <Link to="/dashboard/my-loans" style={navLinkStyle}>Loans</Link>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>
            {mongoUser?.email} ({mongoUser?.role})
          </span>
          <button onClick={handleLogout} style={{
            padding: '8px 16px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            Log Out
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <Outlet />
      </div>
    </div>
  );
};

const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '8px 12px',
  borderRadius: '4px',
  transition: 'background 0.2s',
};

export default DashboardLayout;