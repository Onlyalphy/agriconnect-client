import React, { useState, useEffect, useMemo } from 'react';
import { 
  GoogleMap, 
  useJsApiLoader, 
  Marker,
  InfoWindow 
} from '@react-google-maps/api';
import api from '../services/api';
import axios from 'axios';

const containerStyle = {
  width: '100%',
  height: '70vh',
  borderRadius: '8px',
};

const center = {
  lat: -0.0236,
  lng: 37.9062
};

const TransportPage = () => {
  // --- New State ---
  const [allTransporters, setAllTransporters] = useState([]); // Stores all fetched transporters
  const [filteredTransporters, setFilteredTransporters] = useState([]); // Stores transporters to be displayed
  const [counties, setCounties] = useState([]); // Stores unique county names
  const [selectedCounty, setSelectedCounty] = useState('all'); // Stores the filter value
  const [selected, setSelected] = useState(null); // For the map info window
  // -------------------
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const getGeocode = async (locationString) => {
    const address = `${locationString}, Kenya`;
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    try {
      const response = await axios.get(url);
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].geometry.location;
      }
    } catch (error) {
      console.error(`Geocoding failed for ${locationString}:`, error);
    }
    return null;
  };

  // 1. Fetch and Geocode Transporters (runs once)
  useEffect(() => {
    const fetchAndGeocodeTransporters = async () => {
      try {
        const response = await api.getTransporters();
        const transporters = response.data;
        
        const geocodedTransporters = await Promise.all(
          transporters.map(async (t) => {
            const locationString = t.profile?.location || 'Nairobi'; // Get location from profile
            const coords = await getGeocode(locationString);
            return {
              ...t,
              location: locationString, // Ensure location is standardized
              position: coords
            };
          })
        );
        
        const validTransporters = geocodedTransporters.filter(t => t.position !== null);
        
        // --- New Logic ---
        setAllTransporters(validTransporters); // Save all transporters
        setFilteredTransporters(validTransporters); // By default, show all
        
        // Create a unique, sorted list of counties
        const uniqueCounties = [...new Set(validTransporters.map(t => t.location))]
          .sort();
        setCounties(uniqueCounties);
        // -------------------
        
      } catch (error) {
        console.error("Failed to fetch transporters:", error);
      }
    };

    if (isLoaded) {
      fetchAndGeocodeTransporters();
    }
  }, [isLoaded]);

  // 2. Filter Logic (runs when 'selectedCounty' changes)
  useEffect(() => {
    if (selectedCounty === 'all') {
      setFilteredTransporters(allTransporters); // Show all
    } else {
      // Show only those that match the selected county
      setFilteredTransporters(
        allTransporters.filter(t => t.location === selectedCounty)
      );
    }
  }, [selectedCounty, allTransporters]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div>
      <h2>🚚 Logistics Marketplace</h2>
      <p>Find available transporters for your produce. Filter by county to narrow your search.</p>
      
      {/* --- New Filter UI --- */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="county-filter" style={{ fontWeight: 'bold', marginRight: '10px' }}>
          Filter by County:
        </label>
        <select 
          id="county-filter"
          value={selectedCounty}
          onChange={(e) => setSelectedCounty(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', borderRadius: '4px' }}
        >
          <option value="all">All Counties</option>
          {counties.map(county => (
            <option key={county} value={county}>{county}</option>
          ))}
        </select>
      </div>
      {/* ----------------------- */}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Map View */}
        <div style={{ flex: 3 }}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={7}
          >
            {/* 3. Map over FILTERED transporters */}
            {filteredTransporters.map((transporter) => (
              <Marker
                key={transporter._id}
                position={transporter.position}
                title={transporter.profile?.name || transporter.email}
                onClick={() => setSelected(transporter)}
              />
            ))}

            {selected && (
              <InfoWindow
                position={selected.position}
                onCloseClick={() => setSelected(null)}
              >
                <div>
                  <h4 style={{ margin: 0 }}>{selected.profile?.name || 'Transporter'}</h4>
                  <p style={{ margin: 0 }}>{selected.email}</p>
                  <p style={{ margin: 0, color: '#555' }}>Base: {selected.location}</p>
                  <button style={{ marginTop: '5px' }}>Contact</button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {/* List View */}
        <div style={{ flex: 1, background: '#f9f9f9', padding: '20px', borderRadius: '8px', overflowY: 'auto', height: '70vh' }}>
          <h3>Available Transporters ({filteredTransporters.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {/* 4. List FILTERED transporters */}
            {filteredTransporters.map(t => (
              <li key={t._id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{t.profile?.name || t.email}</p>
                <small>{t.email}</small>
                <p style={{ margin: '4px 0 0', color: '#007bff', fontWeight: 'bold' }}>{t.location}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TransportPage;