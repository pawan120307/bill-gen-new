import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuickInvoice = ({ onInvoiceCreated, onClose }) => {
  const [step, setStep] = useState(1);
  const [quickData, setQuickData] = useState({
    customer_id: null,
    customer: {
      name: '',
      email: '',
      address: '',
      city: '',
      state: ''
    },
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    template: null,
    tax_rate: 0.10,
    due_days: 30,
    notes: ''
  });
  
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [quickTemplates, setQuickTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const serviceTemplates = [
    {
      name: 'Consulting Services',
      items: [
        { description: 'Business Consultation', quantity: 1, unit_price: 150, total: 150 },
        { description: 'Strategy Planning', quantity: 1, unit_price: 200, total: 200 }
      ],
      icon: '💼'
    },
    {
      name: 'Web Development',
      items: [
        { description: 'Website Design', quantity: 1, unit_price: 800, total: 800 },
        { description: 'Frontend Development', quantity: 20, unit_price: 75, total: 1500 },
        { description: 'Backend Setup', quantity: 10, unit_price: 100, total: 1000 }
      ],
      icon: '💻'
    },
    {
      name: 'Graphic Design',
      items: [
        { description: 'Logo Design', quantity: 1, unit_price: 300, total: 300 },
        { description: 'Brand Guidelines', quantity: 1, unit_price: 250, total: 250 }
      ],
      icon: '🎨'
    },
    {
      name: 'Marketing Services',
      items: [
        { description: 'Social Media Management', quantity: 1, unit_price: 500, total: 500 },
        { description: 'Content Creation', quantity: 10, unit_price: 50, total: 500 }
      ],
      icon: '📱'
    },
    {
      name: 'Photography',
      items: [
        { description: 'Event Photography', quantity: 4, unit_price: 200, total: 800 },
        { description: 'Photo Editing', quantity: 50, unit_price: 5, total: 250 }
      ],
      icon: '📸'
    },
    {
      name: 'Blank Invoice',
      items: [
        { description: '', quantity: 1, unit_price: 0, total: 0 }
      ],
      icon: '📄'
    }
  ];

  useEffect(() => {
    loadRecentData();
  }, []);

  const loadRecentData = async () => {
    try {
      // Load recent customers
      const customersResponse = await axios.get(`${API}/customers?limit=6`);
      setRecentCustomers(customersResponse.data.slice(0, 6));

      // Load recent invoices for templates
      const invoicesResponse = await axios.get(`${API}/invoices?limit=5`);
      setRecentInvoices(invoicesResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent data:', error);
    }
  };

  const handleCustomerSelect = (customer) => {
    setQuickData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer: customer
    }));
    setStep(2);
  };

  const handleNewCustomer = () => {
    setQuickData(prev => ({
      ...prev,
      customer_id: null,
      customer: {
        name: '',
        email: '',
        address: '',
        city: '',
        state: ''
      }
    }));
    setStep(2);
  };

  const handleTemplateSelect = (template) => {
    setQuickData(prev => ({
      ...prev,
      items: [...template.items]
    }));
    setStep(3);
  };

  const handleRecentInvoiceDuplicate = (invoice) => {
    setQuickData(prev => ({
      ...prev,
      items: invoice.items || [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      tax_rate: invoice.tax_rate || 0.10,
      due_days: invoice.due_days || 30
    }));
    setStep(3);
  };

  const updateCustomerField = (field, value) => {
    setQuickData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...quickData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setQuickData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setQuickData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (quickData.items.length > 1) {
      const updatedItems = quickData.items.filter((_, i) => i !== index);
      setQuickData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

  const calculateSubtotal = () => {
    return quickData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * quickData.tax_rate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCreateInvoice = async () => {
    setIsLoading(true);
    try {
      // Create or get customer
      let customer = quickData.customer;
      if (!quickData.customer_id) {
        const customerResponse = await axios.post(`${API}/customers`, quickData.customer);
        customer = customerResponse.data;
      }

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + quickData.due_days);

      // Create invoice
      const invoicePayload = {
        customer_id: customer.id,
        business_id: 'default-business-id',
        due_date: dueDate.toISOString().split('T')[0],
        items: quickData.items,
        tax_rate: quickData.tax_rate,
        notes: quickData.notes,
        status: 'draft'
      };

      const response = await axios.post(`${API}/invoices`, invoicePayload);
      const newInvoice = response.data;

      if (onInvoiceCreated) {
        onInvoiceCreated(newInvoice);
      }

      alert('Quick invoice created successfully!');
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error creating quick invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Invoice Creator</h2>
              <p className="text-gray-600">Create invoices in 3 simple steps</p>
            </div>
            <Button 
              onClick={onClose}
              variant="outline"
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  <div className="ml-2 text-sm font-medium">
                    {stepNum === 1 ? 'Customer' : stepNum === 2 ? 'Template' : 'Details'}
                  </div>
                  {stepNum < 3 && <div className="ml-4 w-8 h-0.5 bg-gray-200"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Customer Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Customer</h3>
                <p className="text-gray-600">Select an existing customer or create a new one</p>
              </div>

              {/* Recent Customers */}
              {recentCustomers.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Customers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentCustomers.map((customer) => (
                      <Card 
                        key={customer.id}
                        className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-bold text-lg">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* New Customer Option */}
              <div className="text-center">
                <Button
                  onClick={handleNewCustomer}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold"
                >
                  + Create New Customer
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Template/Service Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Template</h3>
                <p className="text-gray-600">Select a service template or start from scratch</p>
              </div>

              {/* Service Templates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Service Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serviceTemplates.map((template, index) => (
                    <Card 
                      key={index}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{template.icon}</div>
                        <div className="font-semibold text-gray-900 mb-2">{template.name}</div>
                        <div className="text-sm text-gray-600">
                          {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-blue-600 mt-1">
                          {formatCurrency(template.items.reduce((sum, item) => sum + item.total, 0))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Invoices for Duplication */}
              {recentInvoices.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Duplicate Recent Invoice</h4>
                  <div className="space-y-2">
                    {recentInvoices.map((invoice) => (
                      <Card 
                        key={invoice.id}
                        className="p-3 cursor-pointer hover:shadow-md transition-shadow border hover:border-blue-300"
                        onClick={() => handleRecentInvoiceDuplicate(invoice)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {invoice.invoice_number || `INV-${invoice.id}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {invoice.customer?.name} • {new Date(invoice.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(invoice.total_amount || 0)}
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Duplicate
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Invoice Details */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Details</h3>
                <p className="text-gray-600">Review and finalize your invoice</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Customer Info */}
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  {!quickData.customer_id ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Customer Name *"
                        value={quickData.customer.name}
                        onChange={(e) => updateCustomerField('name', e.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={quickData.customer.email}
                        onChange={(e) => updateCustomerField('email', e.target.value)}
                      />
                      <Input
                        placeholder="Address"
                        value={quickData.customer.address}
                        onChange={(e) => updateCustomerField('address', e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="City"
                          value={quickData.customer.city}
                          onChange={(e) => updateCustomerField('city', e.target.value)}
                        />
                        <Input
                          placeholder="State"
                          value={quickData.customer.state}
                          onChange={(e) => updateCustomerField('state', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{quickData.customer.name}</div>
                      <div>{quickData.customer.email}</div>
                      <div>{quickData.customer.address}</div>
                      <div>{quickData.customer.city}, {quickData.customer.state}</div>
                    </div>
                  )}
                </Card>

                {/* Invoice Summary */}
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Invoice Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({(quickData.tax_rate * 100).toFixed(1)}%):</span>
                      <span>{formatCurrency(calculateTax())}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                      Due in {quickData.due_days} days
                    </div>
                  </div>
                </Card>
              </div>

              {/* Invoice Items */}
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900">Invoice Items</h4>
                  <Button onClick={addItem} size="sm" className="bg-green-600 hover:bg-green-700">
                    + Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {quickData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded">
                      <div className="col-span-5">
                        <Input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-gray-900 px-3 py-2">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {quickData.items.length > 1 && (
                          <Button
                            onClick={() => removeItem(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            ❌
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div>
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                >
                  ← Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !quickData.customer_id && !quickData.customer.name) ||
                    (step === 2 && quickData.items.length === 0)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={handleCreateInvoice}
                  disabled={isLoading || !quickData.customer.name || quickData.items.length === 0}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    '🚀 Create Invoice'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuickInvoice;
