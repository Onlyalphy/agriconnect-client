import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';

// Import Pages
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardHomePage from './pages/DashboardHomePage'; // NEW - Import the home page
import MarketplacePage from './pages/MarketplacePage';
import CreateProductPage from './pages/CreateproductPage';
import MyLoansPage from './pages/MyLoansPage';
import TransportPage from './pages/TransportPage';
import MyOrdersPage from './pages/MyOrdersPage';  
import EditProductPage from './pages/EditProductPage';
import BookingPage from './pages/BookingPage'; 
import AssignedJobsPage from './pages/AssignedJobsPage';

// Import Components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

const Home = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>Welcome to AgriConnect KE 🌾</h1>
    <p>Connect farmers, buyers, and transporters in Kenya's agricultural marketplace</p>
    <div style={{ marginTop: '20px' }}>
      <Link to="/login" style={{ margin: '0 10px', padding: '10px 20px', background: '#4caf50', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Log In
      </Link>
      <Link to="/signup" style={{ margin: '0 10px', padding: '10px 20px', background: '#2196f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Sign Up
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
    <div className="min-h-screen bg-red-500 p-4">
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* --- PROTECTED ROUTES --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            
            {/* Dashboard Home - Shows role-specific overview */}
            <Route index element={<DashboardHomePage />} />
            
            {/* Marketplace - Browse all products */}
            <Route path="marketplace" element={<MarketplacePage />} />
            
            {/* Create Product - Suppliers only */}
            <Route path="create-product" element={<CreateProductPage />} />
            
            {/* Loans - All roles */}
            <Route path="my-loans" element={<MyLoansPage />} />

            {/* Transport - All roles */}
            <Route path="transport" element={<TransportPage />} />

            {/* My Orders - Buyers and Suppliers */}
            <Route path="my-orders" element={<MyOrdersPage />} />

            {/* My assigned Jobs - Transporters only */}
            <Route path="jobs" element={<AssignedJobsPage />} />

            {/* Booking Page - Assign transporter to order */}
            <Route path= "book-transport/:orderId" element={<BookingPage />} />

            {/* Edit Product - Suppliers only */}
            <Route path="edit-product/:productId" element={<EditProductPage />} />

            {/* Booking Page - Assign transporter to order */}
            <Route path="book-transport/:orderId" element={<BookingPage />} /> 

            {/* Assigned Jobs Page - Transporters only */}
            <Route path="assigned-jobs" element={<AssignedJobsPage />} />

          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;