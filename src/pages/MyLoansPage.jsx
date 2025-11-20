import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyLoansPage = () => {
  const [loanOffer, setLoanOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { mongoUser } = useAuth(); // Get our user data

  // Get the values from the user's profile
  const transactionVolume = mongoUser?.transactionVolume || 0;
  const reserveValue = mongoUser?.verifiedReserveValue || 0;

  const handleCheckEligibility = async () => {
    setIsLoading(true);
    setError(null);
    setLoanOffer(null);
    try {
      // We don't need to send data, the backend gets
      // the user's info from their token
      const response = await api.getLoanCalculation();
      setLoanOffer(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not calculate loan terms.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>AI-Powered Micro-Loans</h2>
      <p>Check your loan eligibility based on your platform performance.</p>
      
      {/* Display user's current stats */}
      <div style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px' }}>
        <h4>Your Current Profile:</h4>
        <p>Total 6-Month Volume: <strong>KES {transactionVolume.toLocaleString()}</strong></p>
        <p>Verified Crop Reserve Value: <strong>KES {reserveValue.toLocaleString()}</strong></p>
        <small>Note: These values are updated as you complete sales on the platform.</small>
      </div>
      <br />
      
      <button onClick={handleCheckEligibility} disabled={isLoading} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
        {isLoading ? 'Analyzing Your Profile...' : 'Check My Eligibility Now'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</p>}

      {loanOffer && (
        <div style={{ marginTop: '1.5rem', border: '2px solid green', padding: '1rem', borderRadius: '8px' }}>
          <h3>Your AI-Powered Loan Offer:</h3>
          <p><strong>Max Loan Amount:</strong> KES {loanOffer.maxLoanAmount.toLocaleString()}</p>
          <p><strong>Interest Rate:</strong> {loanOffer.interestRate}% per month</p>
          <hr />
          <p><strong>Analyst's Note:</strong> {loanOffer.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default MyLoansPage;