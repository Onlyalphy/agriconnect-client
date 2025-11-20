import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ProductCard } from '../components/ProductCard';  

const MarketplacePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // To trigger refresh  

  const handleProductDeleted = () => {
    setRefreshKey(oldKey => oldKey + 1); // Change the key to trigger useEffect
  };  


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.getProducts();
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [refreshKey]); // Re-run when refreshKey changes

  if (loading) return <div>Loading products...</div>;

  return (
    <div>
      <h2>Available Products ({products.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
        {products.map(product => (
          <ProductCard key={product._id} product={product} onProductDeleted={handleProductDeleted}/>
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;