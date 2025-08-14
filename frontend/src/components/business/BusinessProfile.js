import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BusinessProfile = () => {
  const [businessData, setBusinessData] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    tax_id: '',
    website: '',
    logo_url: '',
    signature_url: '',
    brand_color: '#3B82F6',
    payment_terms: '30',
    bank_name: '',
    bank_account: '',
    routing_number: '',
    currency: 'USD'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [activeTab, setActiveTab] = useState('company');
  const [message, setMessage] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      // Check if user is authenticated
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No authentication token found');
        return;
      }

      // Set authorization header
      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      };

      const response = await axios.get(`${API}/business/profile`, config);
      if (response.data) {
        setBusinessData(response.data);
        console.log('Business profile loaded:', response.data);
      }
    } catch (error) {
      console.log('No existing business profile found or authentication failed:', error.response?.status);
      if (error.response?.status === 401) {
        // Clear invalid token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (file, type) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'logo') {
          setLogoFile(file);
          handleInputChange('logo_url', e.target.result);
        } else if (type === 'signature') {
          setSignatureFile(file);
          handleInputChange('signature_url', e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      setMessage('❌ Please sign in first to save your business profile.');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      // Include authorization header
      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.post(`${API}/business/profile`, businessData, config);
      console.log('Business profile saved:', response.data);
      setMessage('✅ Business profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving business profile:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = '❌ Error saving profile. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = '❌ Please sign in to save your business profile.';
        // Clear invalid token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } else if (error.response?.data?.detail) {
        errorMessage = `❌ ${error.response.data.detail}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTemplate = async () => {
    if (!businessData.company_name) {
      setMessage('❌ Please save your business profile first before generating a template.');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    // Check if user is authenticated
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      setMessage('❌ Please sign in first to generate a business template.');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    // Set authorization header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // First, save the current business data if it has changes
    try {
      setIsGeneratingTemplate(true);
      setMessage('💾 Saving business profile and generating template...');
      
      console.log('Saving business profile:', businessData);
      
      // Save business profile first
      const saveResponse = await axios.post(`${API}/business/profile`, businessData);
      console.log('Business profile saved:', saveResponse.data);
      
      // Then generate template
      console.log('Generating template with auth token:', authToken?.substring(0, 10) + '...');
      const response = await axios.post(`${API}/business/generate-template`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Template generated:', response.data);
      setGeneratedTemplate(response.data.template);
      setMessage('🎉 Business template generated successfully!');
      setTimeout(() => setMessage(''), 5000);
      
      // Notify templates page to refresh
      const refreshEvent = new CustomEvent('refreshBusinessTemplates');
      window.dispatchEvent(refreshEvent);
    } catch (error) {
      console.error('Error generating template:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = '❌ Error generating template. Please try again.';
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = '❌ Network error. Please check if the server is running and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = '❌ Please save your business profile first before generating a template.';
      } else if (error.response?.status === 401) {
        errorMessage = '❌ Please sign in to generate a business template.';
        // Clear invalid token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } else if (error.response?.status === 500) {
        errorMessage = '❌ Server error. Please try again later.';
      } else if (error.response?.data?.detail) {
        errorMessage = `❌ ${error.response.data.detail}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 6000);
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' }
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏢 Business Profile
          </h1>
          <p className="text-xl text-gray-600">
            Manage your business information for professional invoices
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`text-center p-4 rounded-lg ${
            message.includes('✅') || message.includes('🎉') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-2 flex space-x-2 shadow-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('company')}
              className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'company'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🏢 Company Info
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'branding'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🎨 Branding
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'payment'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              💳 Payment Details
            </button>
          </div>
        </div>

        {/* Company Information Tab */}
        {activeTab === 'company' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">📋</span> Basic Information
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input
                    id="companyName"
                    type="text"
                    value={businessData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="InvoiceForge LLC"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                    <input
                      id="email"
                      type="email"
                      value={businessData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@company.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      value={businessData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    id="website"
                    type="url"
                    value={businessData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.company.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">Tax ID / EIN</label>
                  <input
                    id="taxId"
                    type="text"
                    value={businessData.tax_id}
                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                    placeholder="12-3456789"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">📍</span> Business Address
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    id="address"
                    type="text"
                    value={businessData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Business Street"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      id="city"
                      type="text"
                      value={businessData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="New York"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State / Province</label>
                    <input
                      id="state"
                      type="text"
                      value={businessData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="NY"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">ZIP / Postal Code</label>
                    <input
                      id="zipCode"
                      type="text"
                      value={businessData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="10001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      id="country"
                      type="text"
                      value={businessData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="United States"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">🖼️</span> Logo & Signature
              </h3>
              
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-300">
                    {businessData.logo_url ? (
                      <div>
                        <img 
                          src={businessData.logo_url} 
                          alt="Company Logo" 
                          className="mx-auto max-h-24 mb-3"
                        />
                        <p className="text-sm text-green-600 font-medium">✅ Logo uploaded successfully</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-gray-600 font-medium">Upload your company logo</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended: 200x80px, PNG/JPG</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                      className="mt-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {/* Digital Signature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature</label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-300">
                    {businessData.signature_url ? (
                      <div>
                        <img 
                          src={businessData.signature_url} 
                          alt="Digital Signature" 
                          className="mx-auto max-h-20 mb-3"
                        />
                        <p className="text-sm text-green-600 font-medium">✅ Signature uploaded successfully</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">✍️</div>
                        <p className="text-gray-600 font-medium">Upload your digital signature</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended: Transparent PNG</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'signature')}
                      className="mt-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">🎨</span> Brand Colors
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Primary Brand Color</label>
                  <div className="grid grid-cols-4 gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleInputChange('brand_color', color.value)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                          businessData.brand_color === color.value
                            ? 'border-gray-900 ring-4 ring-gray-900 ring-opacity-30'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                      >
                        <span className="text-white font-medium text-xs">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="customColor" className="block text-sm font-medium text-gray-700 mb-2">Custom Color (Hex)</label>
                  <div className="flex space-x-3">
                    <input
                      id="customColor"
                      type="text"
                      value={businessData.brand_color}
                      onChange={(e) => handleInputChange('brand_color', e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                    <div 
                      className="w-16 h-12 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: businessData.brand_color }}
                    ></div>
                  </div>
                </div>

                <div>
                  <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-2">Default Payment Terms</label>
                  <select
                    id="paymentTerms"
                    value={businessData.payment_terms}
                    onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="0">Due on Receipt</option>
                    <option value="7">Net 7 Days</option>
                    <option value="14">Net 14 Days</option>
                    <option value="30">Net 30 Days</option>
                    <option value="60">Net 60 Days</option>
                    <option value="90">Net 90 Days</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                  <select
                    id="currency"
                    value={businessData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details Tab */}
        {activeTab === 'payment' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">🏦</span> Banking Information
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    id="bankName"
                    type="text"
                    value={businessData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    placeholder="Chase Bank"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input
                    id="bankAccount"
                    type="text"
                    value={businessData.bank_account}
                    onChange={(e) => handleInputChange('bank_account', e.target.value)}
                    placeholder="****1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
                  <input
                    id="routingNumber"
                    type="text"
                    value={businessData.routing_number}
                    onChange={(e) => handleInputChange('routing_number', e.target.value)}
                    placeholder="021000021"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="text-yellow-600 mr-4 text-2xl">⚠️</div>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Security Notice</h4>
                      <p className="text-sm text-yellow-700 leading-relaxed">
                        Banking information is encrypted and stored securely. Only use this for legitimate business transactions. 
                        Never share this information with unauthorized parties.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleSave}
            disabled={isLoading || !businessData.company_name}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : '💾 Save Business Profile'}
          </button>
          
          <button
            onClick={handleGenerateTemplate}
            disabled={isGeneratingTemplate || !businessData.company_name}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            {isGeneratingTemplate ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : '🤖 Generate Business Template'}
          </button>
        </div>

        {/* Generated Template Success Display */}
        {generatedTemplate && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-3xl font-bold text-green-800 mb-2">
                Template Generated Successfully!
              </h3>
              <p className="text-green-700 text-lg">
                Your custom business template has been created with your branding.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-green-200">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-3">📋</span>
                Template Details
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-24">Name:</span>
                      <span className="text-gray-900">{generatedTemplate.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-24">Category:</span>
                      <span className="text-gray-900 capitalize">{generatedTemplate.category}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-24">Style:</span>
                      <span className="text-gray-900 capitalize">{generatedTemplate.style}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-24">Color:</span>
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                          style={{ backgroundColor: generatedTemplate.brand_color }}
                        ></div>
                        <span className="text-gray-900 capitalize">{generatedTemplate.color}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-700 mb-3">Features Included:</h5>
                  <div className="space-y-2">
                    {generatedTemplate.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium mb-2">✨ Template Ready to Use!</p>
                <p className="text-green-700 text-sm">
                  Your custom template is now available in the Templates section. 
                  You can use it to create professional invoices with your business branding.
                </p>
              </div>
              
              <div className="flex justify-center mt-6">
                <button 
                  onClick={() => window.location.href = '/templates'}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🎨 View Template Gallery →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Card */}
        {businessData.company_name && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center flex items-center justify-center">
              <span className="mr-3">👁️</span> Invoice Header Preview
            </h3>
            
            <div 
              className="bg-white rounded-xl p-8 border-4 max-w-lg mx-auto shadow-lg"
              style={{ borderColor: businessData.brand_color }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {businessData.logo_url && (
                    <img 
                      src={businessData.logo_url} 
                      alt="Logo" 
                      className="max-h-16 mb-4"
                    />
                  )}
                  <h4 className="font-bold text-xl text-gray-900 mb-2">{businessData.company_name}</h4>
                  {businessData.email && <p className="text-sm text-gray-600 mb-1">📧 {businessData.email}</p>}
                  {businessData.phone && <p className="text-sm text-gray-600 mb-1">📞 {businessData.phone}</p>}
                  {businessData.website && <p className="text-sm text-gray-600">🌐 {businessData.website}</p>}
                </div>
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ml-4"
                  style={{ backgroundColor: businessData.brand_color }}
                >
                  INV
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessProfile;
