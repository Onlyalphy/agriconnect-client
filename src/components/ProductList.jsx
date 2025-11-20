import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ProductList = ({ refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getProducts();
      setProducts(response.data);
      console.log('✅ Loaded products:', response.data);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]); // Refresh when refreshTrigger changes

  if (loading) return <div style={{ padding: '20px' }}>Loading products...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Available Products ({products.length})</h2>
      
      {products.length === 0 ? (
        <p>No products listed yet. Create your first product above!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {products.map((product) => (
            <div 
              key={product._id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {product.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }}
                />
              )}
              <h3 style={{ margin: '10px 0', color: '#333' }}>{product.name}</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>{product.description}</p>
              <p style={{ margin: '5px 0' }}><strong>Quantity:</strong> {product.quantity} {product.unit}</p>
              <p style={{ margin: '5px 0', fontSize: '18px', color: '#28a745', fontWeight: 'bold' }}>
                KES {product.askingPrice} per {product.unit}
              </p>
              <p style={{ margin: '5px 0' }}><strong>Origin:</strong> {product.county}</p>
              
              {product.aiSuggestedPrice && product.aiSuggestedPrice.min && product.aiSuggestedPrice.max ? (
                <div style={{ marginTop: '15px', padding: '10px', background: '#e7f3ff', borderRadius: '4px', fontSize: '13px' }}>
                  <strong>🤖 AI Suggests:</strong> KES {product.aiSuggestedPrice.min} - {product.aiSuggestedPrice.max}
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                    {product.aiSuggestedPrice.explanation}
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', fontSize: '13px', color: '#666' }}>
                  🤖 AI pricing was unavailable
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;