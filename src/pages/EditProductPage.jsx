import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const EditProductPage = () => {
  const { productId } = useParams(); // Get product ID from URL
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState(null);
  const [product, setProduct] = useState(null);

  // 1. Fetch the product's current data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.getProductById(productId);
        setProduct(response.data);
        // 2. Pre-fill the form with the fetched data
        reset(response.data); 
      } catch (err) {
        setServerError(err.response?.data?.message || 'Failed to load product.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId, reset]);

  // 3. Handle the form submission
  const onSubmit = async (formData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await api.updateProduct(productId, formData);
      alert('Product updated successfully!');
      navigate('/dashboard/marketplace'); // Go back to marketplace
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update product.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !product) {
    return <div>Loading product data...</div>;
  }

  if (serverError && !product) {
    return <div style={{ color: 'red' }}>Error: {serverError}</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Edit Product: {product?.name}</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        
        <label>Product Name:</label>
        <input {...register('name', { required: true })} />
        {errors.name && <span style={{color: 'red'}}>This field is required</span>}

        <label>Description:</label>
        <textarea {...register('description', { required: true })} rows="4" />
        {errors.description && <span style={{color: 'red'}}>This field is required</span>}

        <label>County of Origin:</label>
        <input {...register('county', { required: true })} />
        {errors.county && <span style={{color: 'red'}}>This field is required</span>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label>Quantity:</label>
            <input type="number" {...register('quantity', { required: true, min: 0, valueAsNumber: true })} />
            {errors.quantity && <span style={{color: 'red'}}>Must be at least 0</span>}
          </div>
          <div style={{ flex: 1 }}>
            <label>Unit (e.g., kg, crate):</label>
            <input {...register('unit', { required: true })} />
            {errors.unit && <span style={{color: 'red'}}>Unit is required</span>}
          </div>
        </div>

        <label>Asking Price (per unit):</label>
        <input type="number" {...register('askingPrice', { required: true, min: 1, valueAsNumber: true })} />
        {errors.askingPrice && <span style={{color: 'red'}}>Must be at least 1 KES</span>}
        
        <label>Image URL:</label>
        <input {...register('imageUrl')} />
        
        {serverError && <p style={{ color: 'red' }}>{serverError}</p>}

        <button type="submit" disabled={isLoading} style={{padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditProductPage;