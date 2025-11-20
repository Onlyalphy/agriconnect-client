import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AssignedJobsPage = () => {
    const { mongoUser } = useAuth();
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // To trigger refresh  

    // 1. Fetch Orders assigned to the current user (Transporter)
    useEffect(() => {
        const fetchOrders = async () => {
            if (mongoUser?.role !== 'TRANSPORTER') {
                setLoading(false);
                return;
            }
            try {
                // NOTE: We assume a backend route GET /api/orders/assigned-jobs exists 
                // that filters orders where transportId matches req.user._id
                // Since we didn't explicitly create it, we'll fetch all and filter.
                const response = await api.getMyOrders(); // Use existing route for speed
                
                // Filter locally (less efficient but faster to implement)
                const jobs = response.data.filter(
                    order => order.transportId && 
                             order.transportId.toString() === mongoUser._id.toString() &&
                             order.status !== 'Delivered'
                );
                
                setAssignedOrders(jobs);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch assigned jobs.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [mongoUser, refreshKey]); // Refresh on key change

    // 2. Handle status update (Accept/Complete)
    const handleStatusUpdate = async (orderId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this order as "${newStatus}"?`)) {
            return;
        }
        setLoading(true);
        try {
            await api.updateOrderStatus(orderId, { newStatus });
            setRefreshKey(prev => prev + 1); // Trigger data refresh
            alert(`Order ${orderId.slice(-6)} marked as ${newStatus}!`);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to update status to ${newStatus}.`);
        } finally {
            // Loading state will be set by the new fetch triggered by refreshKey
        }
    };

    if (loading) return <div>Loading assigned jobs...</div>;
    if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>🚛 My Assigned Shipments ({assignedOrders.length})</h2>
            
            {assignedOrders.length === 0 && <p>You currently have no shipments assigned to you. Check the Transport page for available bids.</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {assignedOrders.map(order => (
                    <div key={order._id} style={{ border: '2px solid #03a9f4', padding: '15px', borderRadius: '8px', background: 'white' }}>
                        <h4>📦 {order.product.name} ({order.product.quantity} {order.product.unit})</h4>
                        <p><strong>Status:</strong> <span style={{ color: order.status === 'In Transit' ? 'orange' : 'green' }}>{order.status}</span></p>
                        <p><strong>From:</strong> {order.pickupLocation}</p>
                        <p><strong>To:</strong> {order.deliveryLocation}</p>
                        <p><strong>Revenue:</strong> KES {order.totalPrice.toLocaleString()}</p> 
                        
                        {order.status === 'Awaiting Shipment' && (
                            <button onClick={() => handleStatusUpdate(order._id, 'In Transit')} style={jobBtn('#ff9800')}>
                                Start Shipment (In Transit)
                            </button>
                        )}

                        {order.status === 'In Transit' && (
                            <button onClick={() => handleStatusUpdate(order._id, 'Delivered')} style={jobBtn('#4caf50')}>
                                Mark as Delivered
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const jobBtn = (bgColor) => ({
    padding: '10px 15px', background: bgColor, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px'
});

export default AssignedJobsPage;