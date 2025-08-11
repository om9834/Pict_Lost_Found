import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCalendarAlt, FaMapMarkerAlt, FaTag, FaInfoCircle, FaUser, FaTimes } from 'react-icons/fa';
import ClaimForm from '../components/ClaimForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
const API_URL = process.env.REACT_APP_API_URL 
const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isGuard, user } = useContext(AuthContext);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClaimForm, setShowClaimForm] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = `${API_URL}/api/items/${id}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.data) {
          setItem(response.data.data);
        } else if (response.data) {
          setItem(response.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching item details:', err);
        setError(err.response?.data?.message || 'Failed to load item details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItemDetails();
    } else {
      setError('Item ID is missing');
      setLoading(false);
    }
  }, [id]);

  const handleClaim = () => {
    if (!user) {
      toast.info('Please login to claim items');
      // Store the current URL in localStorage to redirect back after login
      localStorage.setItem('redirectAfterLogin', `/items/${id}`);
      navigate('/login');
      return;
    }
    setShowClaimForm(true);
  };

  const handleCloseForm = () => {
    setShowClaimForm(false);
  };

  const handleClaimSubmitted = () => {
    // Update item status locally
    setItem(prev => ({ ...prev, status: 'claimed' }));
    // Close the form
    setShowClaimForm(false);
    // Show success message
    toast.success('Claim submitted successfully! Please visit the security office with your ID to collect the item.');
  };

  const handleMarkAsDelivered = async () => {
    try {
      // Create update data preserving the claimed information
      const updateData = {
        claimedBy: {
          ...item.claimedBy,
          claimedDate: item.claimedBy?.claimedDate || new Date().toISOString()
        }
      };
      
      await axios.put(
        `${API_URL}/api/items/${id}/delivered`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      setItem((prevItem) => ({
        ...prevItem,
        status: 'delivered',
      }));
      
      toast.success('Item marked as delivered successfully');
    } catch (err) {
      console.error('Error marking item as delivered:', err);
      toast.error('Failed to mark item as delivered');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
      // Convert to dd-mm-yyyy format
      return new Date(dateString).toLocaleDateString('en-GB', options);
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Function to get the full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    
    // If it's a Cloudinary object with url property
    if (typeof imagePath === 'object' && imagePath.url) {
      return imagePath.url;
    }
    
    // If it's a full URL already, return as is
    if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Otherwise, prepend the server URL
    return `${API_URL}${imagePath}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate('/lost-items')}
            className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Item Not Found</h2>
          <p className="text-gray-700">The requested item could not be found.</p>
          <button
            onClick={() => navigate('/lost-items')}
            className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-6">
        <button
          onClick={() => navigate('/lost-items')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Lost Items
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <div className="h-80 bg-gray-200 flex items-center justify-center overflow-hidden">
              {item.image ? (
                <img 
                  src={getImageUrl(item.image)} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/images/placeholder.png';
                  }}
                />
              ) : (
                <div className="text-gray-400">No image available</div>
              )}
            </div>
          </div>
          
          <div className="md:w-1/2 p-6">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${
              item.status === 'available' 
                ? 'bg-green-100 text-green-800' 
                : item.status === 'claimed' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{item.name || 'Unnamed Item'}</h1>
            
            <div className="mb-6">
              <div className="flex items-center text-gray-600 mb-2">
                <FaTag className="mr-2" />
                <span>Category: </span>
                <span className="font-medium ml-1">{item.category || 'Uncategorized'}</span>
              </div>
              
              <div className="flex items-center text-gray-600 mb-2">
                <FaCalendarAlt className="mr-2" />
                <span>Found on: </span>
                <span className="font-medium ml-1">{formatDate(item.foundDate)}</span>
              </div>
              
              <div className="flex items-center text-gray-600 mb-2">
                <FaMapMarkerAlt className="mr-2" />
                <span>Location: </span>
                <span className="font-medium ml-1">{item.location || 'Unknown'}</span>
              </div>
              
              {item.claimedBy && (
                <>
                  <div className="flex items-center text-gray-600 mb-2">
                    <FaUser className="mr-2" />
                    <span>Claimed by: </span>
                    <span className="font-medium ml-1">
                      {item.claimedBy.studentName || item.claimedBy.name || 'Unknown'} 
                      {item.claimedBy.rollNumber ? `(${item.claimedBy.rollNumber})` : ''}
                    </span>
                  </div>
                  {item.claimedBy.claimedDate && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaCalendarAlt className="mr-2" />
                      <span>Claimed on: </span>
                      <span className="font-medium ml-1">{formatDate(item.claimedBy.claimedDate)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="flex items-center text-gray-700 font-semibold mb-2">
                <FaInfoCircle className="mr-2" />
                Description
              </h3>
              <p className="text-gray-600">{item.description || 'No description provided.'}</p>
            </div>
            
            {item.status === 'available' && !isGuard && (
              <button
                onClick={handleClaim}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Claim Item
              </button>
            )}
            
            {item.status === 'claimed' && isGuard && (
              <button
                onClick={handleMarkAsDelivered}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-300"
              >
                Mark as Delivered
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Claim Form Modal */}
      {showClaimForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto relative">
            <button 
              onClick={handleCloseForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="h-6 w-6" />
            </button>
            <div className="p-6">
              <ClaimForm 
                itemId={id} 
                onClaimSubmitted={handleClaimSubmitted} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetails;