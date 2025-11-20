import React, { useState } from 'react';
import api from '../services/api';

const CreateProductForm = ({ onProductCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: 'kg',
    askingPrice: '',
    county: '',
    imageUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.askingPrice || parseFloat(formData.askingPrice) <= 0) {
      setError('Please enter a valid asking price');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('📤 Submitting product...');
      
      const productData = {
        name: formData.name,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        askingPrice: parseFloat(formData.askingPrice),
        county: formData.county,
        imageUrl: formData.imageUrl || null,
      };

      const response = await api.createProduct(productData);
      console.log('Product created:', response.data);

      // Show success message with AI suggestion if available
      const aiPrice = response.data.aiSuggestedPrice;
      let priceInfo = '';
      
      if (aiPrice && aiPrice.min && aiPrice.max) {
        priceInfo = ` AI suggests KES ${aiPrice.min} - ${aiPrice.max} per ${formData.unit}.`;
      } else {
        priceInfo = ' (AI price suggestion was unavailable)';
      }
      
      setSuccessMessage(`Product "${formData.name}" listed successfully!${priceInfo}`);

      // Reset form
      setFormData({
        name: '',
        description: '',
        quantity: '',
        unit: 'kg',
        askingPrice: '',
        county: '',
        imageUrl: '',
      });

      // Notify parent to refresh product list
      if (onProductCreated) {
        onProductCreated(response.data);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>List New Produce for Sale</h2>

      {successMessage && (
        <div style={{ 
          padding: '15px', 
          background: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '4px',
          color: '#155724',
          marginBottom: '20px'
        }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '15px', 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffc107', 
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        <strong>💡 How it works:</strong>
        <ul style={{ margin: '10px 0 0 20px', paddingLeft: '0' }}>
          <li>Fill in all product details below</li>
          <li>Set your asking price (required)</li>
          <li>Our AI will analyze market data and suggest a price range</li>
          <li>If AI suggestion fails, your product will still be listed</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* ... rest of your form fields ... */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Product Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g., Fresh Tomatoes, Sukuma Wiki, Maize"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            name="description"
            placeholder="Describe your product (quality, freshness, special features)"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            County of Origin <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            name="county"
            placeholder="e.g., Kiambu, Nakuru, Meru"
            value={formData.county}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Quantity <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="e.g., 100"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              style={{ 
                width: '100%', 
                padding: '10px', 
                fontSize: '16px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Unit <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                fontSize: '16px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="Litres">Litres</option>
              <option value="crate">Crates</option>
              <option value="bag">Bags</option>
              <option value="piece">Pieces</option>
              <option value="bunch">Bunches</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Your Asking Price (per unit) <span style={{ color: 'red' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              fontSize: '16px',
              color: '#666'
            }}>
              KES
            </span>
            <input
              type="number"
              step="0.01"
              name="askingPrice"
              placeholder="Enter your price"
              value={formData.askingPrice}
              onChange={handleChange}
              required
              min="0.01"
              style={{ 
                width: '100%', 
                padding: '10px 10px 10px 50px', 
                fontSize: '16px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <small style={{ color: '#666', fontSize: '12px' }}>
            💡 AI will compare your price with market rates after submission
          </small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Image URL (optional)
          </label>
          <input
            type="url"
            name="imageUrl"
            placeholder="https://example.com/image.jpg"
            value={formData.imageUrl}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '15px',
            background: isSubmitting ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          {isSubmitting ? '⏳ Listing Product (AI analyzing...)' : '📝 List Product Now'}
        </button>
      </form>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#e7f3ff', 
        borderRadius: '4px', 
        fontSize: '14px',
        borderLeft: '4px solid #007bff'
      }}>
        <strong>🤖 About AI Pricing:</strong>
        <p style={{ margin: '10px 0 0 0' }}>
          Our AI analyzes market data, location, season, and quantity to suggest fair prices. 
          This may take 10-20 seconds. Your product will be listed with AI suggestions if available.
        </p>
      </div>
    </div>
  );
};

export default CreateProductForm;