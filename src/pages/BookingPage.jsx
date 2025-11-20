import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const BookingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch order details and the list of available transporters
        const orderResponse = await api.getMyOrders(); // Need to filter this response
        const orderDetails = orderResponse.data.find(o => o._id === orderId);
        
        if (!orderDetails) {
            throw new Error("Order not found or not visible.");
        }
        
        const transportersResponse = await api.getTransporters();
        
        setOrder(orderDetails);
        setTransporters(transportersResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load booking data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  const handleBook = async (transporterId) => {
    setLoading(true);
    try {
      await api.bookTransport(orderId, transporterId);
      alert('✅ Transport booked! The transporter has been notified.');
      navigate('/dashboard/my-orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading booking interface...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;
  if (!order) return <div style={{ color: 'red', padding: '20px' }}>Order details unavailable.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Assign Transporter to Order #{orderId.slice(-6)}</h2>
      <p>Product: <strong>{order.product.name} ({order.product.quantity} {order.product.unit})</strong></p>
      <p>Pickup: <strong>{order.pickupLocation}</strong> | Dropoff: <strong>{order.deliveryLocation}</strong></p>
      
      <h3>Available Transporters Near {order.pickupLocation} ({transporters.length})</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        {transporters.map(t => (
          <div key={t._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: '#f8f8f8' }}>
            <h4>🚚 {t.profile?.name || t.email.split('@')[0]}</h4>
            <p style={{ margin: '5px 0' }}>Base: {t.profile.location || 'N/A'}</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>Vehicle: {t.profile.vehicleDetails || 'Standard'}</p>
            <button 
              onClick={() => handleBook(t._id)} 
              disabled={loading}
              style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginTop: '10px' }}
            >
              Book Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingPage;