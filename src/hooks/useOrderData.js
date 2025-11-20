import React, { useState, useEffect } from 'react';
import api from '../services/api';

const useOrderData = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await api.getMyOrders();
            setOrders(response.data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch on component mount
        fetchOrders(); 
    }, []);

    // Function to manually refresh data (for post-payment update)
    const refreshOrders = () => {
        fetchOrders();
    };

    return { orders, isLoading, refreshOrders };
};

export default useOrderData;