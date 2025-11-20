import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { mongoUser } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.getMyOrders();
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div>Loading your orders...</div>;

  return (
    <div>
      <h2>My Orders ({orders.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.length === 0 && <p>You have not placed any orders yet.</p>}
        
        {orders.map(order => (
          <div key={order._id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Order ID: {order._id.slice(-6)}</h3>
              <span style={{ padding: '5px 10px', background: '#eee', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                {order.status}
              </span>
            </div>
            <hr />
            <p><strong>Product:</strong> {order.product.name}</p>
            <p><strong>Quantity:</strong> {order.product.quantity} {order.product.unit}</p>
            <p><strong>Total Price:</strong> KES {order.totalPrice.toLocaleString()}</p>
            
            {/* Show the other party in the transaction */}
            {mongoUser.role === 'BUYER' && (
              <p><strong>Supplier:</strong> {order.supplierId?.profile?.name || 'N/A'}</p>
            )}
            {mongoUser.role === 'SUPPLIER' && (
              <p><strong>Buyer:</strong> {order.buyerId?.profile?.name || 'N/A'}</p>
            )}

            {order.status === 'Paid' && !order.transportId && (
              <button 
                onClick={() => navigate(`/dashboard/book-transport/${order._id}`)} // <-- UPDATE LOGIC
                style={{ marginTop: '10px', background: '#007bff', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px' }}
              >
                Book Transport
              </button>
            )}

            {/* Display Transporter Info if already booked */}
            {order.transportId && (
                <p style={{ marginTop: '10px' }}>
                    🚚 **Booked:** {order.transportId.profile?.name || order.transportId.email} 
                    <span style={{ color: 'green', fontWeight: 'bold', marginLeft: '10px' }}>({order.status})</span>
                </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrdersPage;