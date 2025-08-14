import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import VoiceAI from '../ai/VoiceAI';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to get corner design styles
const getCornerDesign = (cornerType, position, color) => {
  const baseStyles = 'decorative-corner pointer-events-none transition-opacity duration-300';
  const opacity = cornerType === 'minimal' ? 'opacity-10' : 'opacity-15';
  
  switch (cornerType) {
    case 'ornate':
      return `${baseStyles} ${opacity} bg-gradient-to-br from-yellow-300 to-yellow-500 clip-ornate-${position} hover:opacity-25`;
    case 'baroque':
      return `${baseStyles} ${opacity} bg-gradient-to-br from-purple-300 to-purple-500 clip-baroque-${position} hover:opacity-25`;
    case 'diamond':
      return `${baseStyles} ${opacity} bg-gradient-to-br from-${color}-300 to-${color}-500 transform rotate-45 origin-center hover:opacity-25`;
    case 'artdeco':
      return `${baseStyles} ${opacity} bg-gradient-to-br from-gray-400 to-gray-600 clip-artdeco-${position} hover:opacity-25`;
    case 'nature':
      return `${baseStyles} ${opacity} bg-gradient-to-br from-green-300 to-green-500 clip-nature-${position} hover:opacity-25`;
    case 'geometric':
      return `${baseStyles} ${opacity} bg-gradient-to-br from-${color}-300 to-${color}-500 clip-geometric-${position} hover:opacity-25`;
    case 'minimal':
      return `${baseStyles} opacity-5 bg-gradient-to-br from-${color}-100 to-${color}-300 rounded-full hover:opacity-10`;
    default:
      return `${baseStyles} opacity-10 bg-gradient-to-br from-${color}-200 to-${color}-400 rounded-lg hover:opacity-15`;
  }
};

const CreateInvoice = ({ user, selectedTemplate }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('voice');
  const [invoiceData, setInvoiceData] = useState({
    customer: {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      business_name: ''
    },
    items: [
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0
      }
    ],
    tax_rate: 0.10,
    notes: '',
    due_days: 30
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);

  useEffect(() => {
    // Load existing customers and business profile
    loadCustomers();
    loadBusinessProfile();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadBusinessProfile = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No authentication token found for business profile');
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      };

      const response = await axios.get(`${API}/business/profile`, config);
      if (response.data) {
        setBusinessProfile(response.data);
        console.log('Business profile loaded for invoice:', response.data);
      }
    } catch (error) {
      console.log('No business profile found or authentication failed:', error.response?.status);
      // Don't clear token here as it might be valid for other operations
    }
  };

  const handleVoiceProcessed = (voiceResult) => {
    if (voiceResult.invoice_data) {
      const voiceData = voiceResult.invoice_data;
      
      // Update invoice data with voice input
      const updatedInvoiceData = {
        ...invoiceData,
        customer: {
          ...invoiceData.customer,
          name: voiceData.customer_name || invoiceData.customer.name,
          email: voiceData.customer_email || invoiceData.customer.email,
          address: voiceData.customer_address || invoiceData.customer.address,
          city: voiceData.customer_city || invoiceData.customer.city,
          state: voiceData.customer_state || invoiceData.customer.state,
          business_name: voiceData.business_name || invoiceData.customer.business_name
        },
        items: voiceData.items || invoiceData.items,
        notes: voiceData.notes || invoiceData.notes,
        due_days: voiceData.due_days || invoiceData.due_days
      };
      
      setInvoiceData(updatedInvoiceData);
      
      // If AI suggested templates, update selectedTemplate
      if (voiceData.template_suggestions && voiceData.template_suggestions.length > 0) {
        console.log('AI suggested templates:', voiceData.template_suggestions);
        // You could implement template selection logic here
      }
      
      // Give user option to auto-create or review manually
      const userChoice = window.confirm(
        `Voice processing complete! Invoice data extracted successfully.\n\n` +
        `Customer: ${updatedInvoiceData.customer.name}\n` +
        `Items: ${updatedInvoiceData.items.length} item(s)\n` +
        `Total: ₹${(updatedInvoiceData.items.reduce((sum, item) => sum + item.total, 0) * (1 + updatedInvoiceData.tax_rate)).toFixed(2)}\n\n` +
        `Would you like to create the invoice automatically, or review it manually first?\n\n` +
        `✅ Click OK to create automatically\n` +
        `📝 Click Cancel to review/edit manually`
      );
      
      if (userChoice) {
        // Auto-create the invoice
        handleSubmit();
      } else {
        // Switch to manual tab for review/edit
        setActiveTab('manual');
      }
    } else {
      // No valid invoice data extracted, switch to manual
      setActiveTab('manual');
      alert('Voice processing completed, but no valid invoice data could be extracted. Please use manual input or try voice input again.');
    }
    
    setSuggestions(voiceResult.suggestions || []);
  };

  const updateInvoiceData = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateCustomerData = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Calculate total for the item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    updateInvoiceData('items', updatedItems);
  };

  const addItem = () => {
    updateInvoiceData('items', [
      ...invoiceData.items,
      { description: '', quantity: 1, unit_price: 0, total: 0 }
    ]);
  };

  const removeItem = (index) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    updateInvoiceData('items', updatedItems);
  };

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * invoiceData.tax_rate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // First create/find customer
      let customer;
      const existingCustomer = customers.find(c => c.email === invoiceData.customer.email);
      
      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        const customerResponse = await axios.post(`${API}/customers`, invoiceData.customer);
        customer = customerResponse.data;
      }

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + invoiceData.due_days);

      // Create invoice with template information
      const invoicePayload = {
        customer_id: customer.id,
        business_id: user?.business_id || 'default-business-id',
        due_date: dueDate.toISOString().split('T')[0],
        items: invoiceData.items,
        tax_rate: invoiceData.tax_rate,
        notes: invoiceData.notes,
        ai_generated: activeTab === 'voice',
        template_id: selectedTemplate?.id || null,
        template_name: selectedTemplate?.name || 'Default',
        template_category: selectedTemplate?.category || 'basic'
      };

      const response = await axios.post(`${API}/invoices`, invoicePayload);
      console.log('Invoice created:', response.data);
      
      // Reset form or redirect
      alert('Invoice created successfully!');
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectCustomer = (customer) => {
    setInvoiceData(prev => ({
      ...prev,
      customer: customer
    }));
  };

  // PDF Export Function
  const exportToPDF = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoiceData.customer.name || 'draft'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Excel Export Function
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Create invoice data for Excel
      const invoiceDetails = [
        ['Invoice Number', 'INV-001'],
        ['Date', new Date().toLocaleDateString()],
        ['Due Date', new Date(Date.now() + invoiceData.due_days * 24 * 60 * 60 * 1000).toLocaleDateString()],
        [''],
        ['Bill To:'],
        ['Customer Name', invoiceData.customer.name || ''],
        ['Email', invoiceData.customer.email || ''],
        ['Address', invoiceData.customer.address || ''],
        ['City', invoiceData.customer.city || ''],
        ['State', invoiceData.customer.state || ''],
        [''],
      ];
      
      // Add items header
      const itemsHeader = [['Description', 'Quantity', 'Unit Price', 'Total']];
      const itemsData = invoiceData.items.map(item => [
        item.description,
        item.quantity,
        item.unit_price,
        item.total
      ]);
      
      // Add totals
      const totalsData = [
        [''],
        ['Subtotal', '', '', calculateSubtotal().toFixed(2)],
        [`Tax (${(invoiceData.tax_rate * 100).toFixed(1)}%)`, '', '', calculateTax().toFixed(2)],
        ['Total', '', '', calculateTotal().toFixed(2)]
      ];
      
      // Add notes if present
      const notesData = invoiceData.notes ? [
        [''],
        ['Notes'],
        [invoiceData.notes]
      ] : [];
      
      // Combine all data
      const allData = [
        ...invoiceDetails,
        ...itemsHeader,
        ...itemsData,
        ...totalsData,
        ...notesData
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(allData);
      
      // Style the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;
          
          // Style headers
          if (R === invoiceDetails.length && C < 4) {
            worksheet[cellAddress].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "CCCCCC" } }
            };
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `invoice-${invoiceData.customer.name || 'draft'}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel file. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Invoice
        </h1>
        <p className="text-gray-600">
          Use AI voice input or create manually - your choice!
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-xl p-1 flex space-x-1">
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'voice'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎤 Voice AI
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'manual'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👁️ Preview
          </button>
        </div>
      </div>

      {/* Template Selection Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Invoice Template</h3>
        <div className="space-y-4">
          {selectedTemplate ? (
            <div className="p-4 bg-blue-50 border-blue-200 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full bg-${selectedTemplate.color}-500`}></div>
                  <span className="font-medium text-blue-900">
                    {selectedTemplate.name}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedTemplate.category}
                  </Badge>
                  {selectedTemplate.premium && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      ✨ Premium
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/templates')}
                  className="text-blue-600 border-blue-200"
                >
                  Change Template
                </Button>
              </div>
              <p className="text-gray-600 mt-2 text-sm">{selectedTemplate.description}</p>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h4>
              <p className="text-gray-500 mb-4">Using default template design. Choose a professional template to enhance your invoice appearance.</p>
              <Button 
                onClick={() => navigate('/templates')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Browse Templates
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'voice' && (
        <div className="space-y-6">
          <VoiceAI 
            onVoiceProcessed={handleVoiceProcessed}
            customer={invoiceData.customer}
          />
          
          {suggestions.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                🤖 AI Suggestions from Voice Input:
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h3>
              
              {/* Quick Customer Selection */}
              {customers.length > 0 && (
                <div className="mb-4">
                  <Label>Quick Select Existing Customer</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customers.slice(0, 5).map((customer) => (
                      <Button
                        key={customer.id}
                        variant="outline"
                        size="sm"
                        onClick={() => selectCustomer(customer)}
                        className="text-xs"
                      >
                        {customer.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={invoiceData.customer.name}
                    onChange={(e) => updateCustomerData('name', e.target.value)}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={invoiceData.customer.email}
                    onChange={(e) => updateCustomerData('email', e.target.value)}
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input
                    id="customerAddress"
                    value={invoiceData.customer.address}
                    onChange={(e) => updateCustomerData('address', e.target.value)}
                    placeholder="123 Main Street"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerCity">City</Label>
                  <Input
                    id="customerCity"
                    value={invoiceData.customer.city}
                    onChange={(e) => updateCustomerData('city', e.target.value)}
                    placeholder="New York"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerState">State</Label>
                  <Input
                    id="customerState"
                    value={invoiceData.customer.state}
                    onChange={(e) => updateCustomerData('state', e.target.value)}
                    placeholder="NY"
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Invoice Items */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Invoice Items</h3>
                <Button onClick={addItem} size="sm" className="bg-green-600 hover:bg-green-700">
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                    <div className="col-span-5">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Service description"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input
                        value={`₹${item.total.toFixed(2)}`}
                        readOnly
                        className="mt-1 bg-gray-100"
                      />
                    </div>
                    <div className="col-span-1">
                      {invoiceData.items.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ❌
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Additional Details */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={invoiceData.tax_rate * 100}
                    onChange={(e) => updateInvoiceData('tax_rate', (parseFloat(e.target.value) || 0) / 100)}
                    className="mt-1"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDays">Due Days</Label>
                  <Input
                    id="dueDays"
                    type="number"
                    value={invoiceData.due_days}
                    onChange={(e) => updateInvoiceData('due_days', parseInt(e.target.value) || 30)}
                    className="mt-1"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={invoiceData.notes}
                    onChange={(e) => updateInvoiceData('notes', e.target.value)}
                    placeholder="Additional notes or payment terms..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Invoice Summary */}
          <div>
            <Card className="p-6 sticky top-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Invoice Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({(invoiceData.tax_rate * 100).toFixed(1)}%):</span>
                  <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !invoiceData.customer.name}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold"
              >
                {isLoading ? 'Creating...' : 'Create Invoice'}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <Card className="p-8">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">Invoice Preview</h3>
            
            {/* Export Buttons */}
            <div className="flex justify-center space-x-4 mb-6">
              <Button
                onClick={exportToPDF}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center"
              >
                📄 Download PDF
              </Button>
              <Button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center"
              >
                📊 Download Excel
              </Button>
            </div>
            
            {/* Invoice Preview with ID */}
            <div id="invoice-preview" className={`bg-white border-2 ${selectedTemplate ? `border-${selectedTemplate.color}-200` : 'border-gray-200'} rounded-lg p-8 shadow-lg relative overflow-hidden min-h-[1123px]`} style={{minHeight: '297mm', width: '210mm', maxWidth: '210mm', margin: '0 auto', boxSizing: 'border-box'}}>
              {/* Decorative Corners */}
              {selectedTemplate && (
                <>
                  {/* Top Left Corner */}
                  <div className={`absolute top-0 left-0 w-16 h-16 ${getCornerDesign(selectedTemplate.corners, 'top-left', selectedTemplate.color)}`}></div>
                  {/* Top Right Corner */}
                  <div className={`absolute top-0 right-0 w-16 h-16 ${getCornerDesign(selectedTemplate.corners, 'top-right', selectedTemplate.color)}`}></div>
                  {/* Bottom Left Corner */}
                  <div className={`absolute bottom-0 left-0 w-16 h-16 ${getCornerDesign(selectedTemplate.corners, 'bottom-left', selectedTemplate.color)}`}></div>
                  {/* Bottom Right Corner */}
                  <div className={`absolute bottom-0 right-0 w-16 h-16 ${getCornerDesign(selectedTemplate.corners, 'bottom-right', selectedTemplate.color)}`}></div>
                </>
              )}
              
              {/* Watermark */}
              {selectedTemplate?.premium && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-gray-100 text-8xl font-bold opacity-5 rotate-45">
                    {selectedTemplate.style?.toUpperCase()}
                  </div>
                </div>
              )}
              
              {/* Invoice Content Container with Flexbox */}
              <div className="relative z-10 flex flex-col h-full min-h-full">
                {/* Main Content Area */}
                <div className="flex-grow">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h1 className={`text-3xl font-bold ${selectedTemplate?.style === 'luxury' ? 'font-serif' : 'font-sans'} ${selectedTemplate ? `text-${selectedTemplate.color}-900` : 'text-gray-900'}`}>INVOICE</h1>
                      <p className="text-gray-600 mt-2">Invoice #INV-001</p>
                      {selectedTemplate?.corners === 'ornate' && (
                        <div className="mt-2 h-1 w-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded"></div>
                      )}
                    </div>
                    <div className="text-right">
                      {/* Logo or Company Icon */}
                      {(selectedTemplate?.logo_url || businessProfile?.logo_url) ? (
                        <div className="mb-4 flex justify-end">
                          <img 
                            src={selectedTemplate?.logo_url || businessProfile?.logo_url} 
                            alt={(selectedTemplate?.business_data?.company_name || businessProfile?.company_name) || 'Company Logo'}
                            className="max-h-16 max-w-32 object-contain"
                            style={{ maxHeight: '64px', maxWidth: '128px' }}
                          />
                        </div>
                      ) : (
                        <div className={`w-16 h-16 ${selectedTemplate ? `bg-${selectedTemplate.color}-600` : (selectedTemplate?.brand_color || businessProfile?.brand_color) ? '' : 'bg-blue-600'} ${selectedTemplate?.style === 'luxury' ? 'rounded-none' : 'rounded-lg'} flex items-center justify-center mb-4 shadow-lg relative`} style={(selectedTemplate?.brand_color || businessProfile?.brand_color) ? { backgroundColor: (selectedTemplate?.brand_color || businessProfile?.brand_color) } : {}}>
                          {selectedTemplate?.corners === 'diamond' && (
                            <div className="absolute inset-1 border-2 border-white/30 transform rotate-45"></div>
                          )}
                          <svg className="w-8 h-8 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                          </svg>
                        </div>
                      )}
                      
                      {/* Company Name */}
                      <p className={`font-semibold ${selectedTemplate?.style === 'luxury' ? 'font-serif text-lg' : 'text-base'}`}>
                        {selectedTemplate?.business_data?.company_name || businessProfile?.company_name || 'InvoiceForge'}
                      </p>
                      
                      {/* Business Contact Information */}
                      {(selectedTemplate?.business_data || businessProfile) && (
                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                          {(selectedTemplate?.business_data?.email || businessProfile?.email) && (
                            <p>📧 {selectedTemplate?.business_data?.email || businessProfile?.email}</p>
                          )}
                          {(selectedTemplate?.business_data?.phone || businessProfile?.phone) && (
                            <p>📞 {selectedTemplate?.business_data?.phone || businessProfile?.phone}</p>
                          )}
                          {(selectedTemplate?.business_data?.website || businessProfile?.website) && (
                            <p>🌐 {selectedTemplate?.business_data?.website || businessProfile?.website}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Template Info */}
                      {selectedTemplate && (
                        <>
                          <p className="text-xs text-gray-500 mt-2">{selectedTemplate.name} Template</p>
                          {selectedTemplate.premium && (
                            <p className="text-xs text-yellow-600 mt-1 font-medium">✨ Premium Design</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                      <div className="text-gray-700">
                        <p className="font-medium">{invoiceData.customer.name || 'Customer Name'}</p>
                        <p>{invoiceData.customer.address || 'Customer Address'}</p>
                        <p>{invoiceData.customer.city && invoiceData.customer.state 
                            ? `${invoiceData.customer.city}, ${invoiceData.customer.state}` 
                            : 'City, State'}</p>
                        <p>{invoiceData.customer.email || 'customer@email.com'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Invoice Details:</h3>
                      <div className="text-gray-700">
                        <p>Date: {new Date().toLocaleDateString()}</p>
                        <p>Due: {new Date(Date.now() + invoiceData.due_days * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full mb-8 border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2 font-semibold">Description</th>
                        <th className="text-center py-2 font-semibold">Qty</th>
                        <th className="text-right py-2 font-semibold">Unit Price</th>
                        <th className="text-right py-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3">{item.description || 'Service description'}</td>
                          <td className="py-3 text-center">{item.quantity}</td>
                          <td className="py-3 text-right">₹{item.unit_price.toFixed(2)}</td>
                          <td className="py-3 text-right">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-64">
                      <div className="flex justify-between py-2">
                        <span>Subtotal:</span>
                        <span>₹{calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Tax ({(invoiceData.tax_rate * 100).toFixed(1)}%):</span>
                        <span>₹{calculateTax().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-xl font-bold border-t border-gray-300 mt-2 pt-2">
                        <span>Total:</span>
                        <span>₹{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoiceData.notes && (
                    <div className="mb-8 pt-8 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                      <p className="text-gray-700">{invoiceData.notes}</p>
                    </div>
                  )}
                </div>
                
                {/* Footer - Always at Bottom */}
                <div className="mt-auto pt-12 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      {(selectedTemplate?.logo_url || businessProfile?.logo_url) ? (
                        <img 
                          src={selectedTemplate?.logo_url || businessProfile?.logo_url} 
                          alt={(selectedTemplate?.business_data?.company_name || businessProfile?.company_name) || 'Company Logo'}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <div className={`w-8 h-8 ${selectedTemplate ? `bg-${selectedTemplate.color}-600` : (selectedTemplate?.brand_color || businessProfile?.brand_color) ? '' : 'bg-blue-600'} rounded-lg flex items-center justify-center shadow-sm`} style={(selectedTemplate?.brand_color || businessProfile?.brand_color) ? { backgroundColor: (selectedTemplate?.brand_color || businessProfile?.brand_color) } : {}}>
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{selectedTemplate?.business_data?.company_name || businessProfile?.company_name || 'InvoiceForge'}</p>
                        <p className="text-xs text-gray-500">Professional Invoice Generator</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {(selectedTemplate?.business_data || businessProfile) ? (
                        <>
                          {(selectedTemplate?.business_data?.email || businessProfile?.email) && (
                            <p className="text-sm text-gray-700">
                              📧 <a href={`mailto:${selectedTemplate?.business_data?.email || businessProfile?.email}`} className={`${selectedTemplate ? `text-${selectedTemplate.color}-600 hover:text-${selectedTemplate.color}-700` : 'text-blue-600 hover:text-blue-700'} font-medium transition-colors duration-200`}>
                                {selectedTemplate?.business_data?.email || businessProfile?.email}
                              </a>
                            </p>
                          )}
                          {(selectedTemplate?.business_data?.phone || businessProfile?.phone) && (
                            <p className="text-sm text-gray-700 mt-1">
                              📞 <span className="font-medium">{selectedTemplate?.business_data?.phone || businessProfile?.phone}</span>
                            </p>
                          )}
                          {(selectedTemplate?.business_data?.website || businessProfile?.website) && (
                            <p className="text-xs text-gray-500 mt-1">
                              🌐 <a href={(selectedTemplate?.business_data?.website || businessProfile?.website)?.startsWith('http') ? (selectedTemplate?.business_data?.website || businessProfile?.website) : `https://${(selectedTemplate?.business_data?.website || businessProfile?.website)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {(selectedTemplate?.business_data?.website || businessProfile?.website)?.replace(/^https?:\/\//, '')}
                              </a>
                            </p>
                          )}
                          {(selectedTemplate?.business_data?.address || businessProfile?.address) && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 {selectedTemplate?.business_data?.address || businessProfile?.address}
                              {(selectedTemplate?.business_data?.city || businessProfile?.city) && `, ${selectedTemplate?.business_data?.city || businessProfile?.city}`}
                              {(selectedTemplate?.business_data?.state || businessProfile?.state) && `, ${selectedTemplate?.business_data?.state || businessProfile?.state}`}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700">
                            📧 <a href="mailto:support@invoiceforge.com" className={`${selectedTemplate ? `text-${selectedTemplate.color}-600 hover:text-${selectedTemplate.color}-700` : 'text-blue-600 hover:text-blue-700'} font-medium transition-colors duration-200`}>
                              support@invoiceforge.com
                            </a>
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            📞 <span className="font-medium">+1 (555) 123-4567</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            🌐 www.invoiceforge.com
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Professional Footer Message */}
                  <div className="mt-4 text-center pb-8">
                    <p className="text-xs text-gray-400">
                      This invoice was generated with InvoiceForge - Professional AI-Powered Invoicing
                    </p>
                    {selectedTemplate?.premium && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ✨ Created with Premium Template: {selectedTemplate.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8 space-x-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold"
              >
                {isLoading ? 'Creating...' : 'Create Invoice'}
              </Button>
              <Button variant="outline" className="px-8 py-3 rounded-xl font-semibold">
                Save as Draft
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CreateInvoice;
