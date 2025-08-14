import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoicesPage = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterAndSortInvoices();
  }, [invoices, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/invoices`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Use sample data if API fails
      setSampleInvoices();
    } finally {
      setLoading(false);
    }
  };

  const setSampleInvoices = () => {
    const sampleInvoices = [
      {
        id: '1',
        invoice_number: 'INV-001',
        customer_id: '1',
        customer_name: 'John Doe',
        business_name: 'Acme Corp',
        total_amount: 2750.00,
        subtotal: 2500.00,
        tax_amount: 250.00,
        status: 'sent',
        issue_date: '2024-01-15',
        due_date: '2024-02-14',
        created_at: '2024-01-15T10:30:00Z',
        ai_generated: true,
        items: [
          { description: 'Web Design Services', quantity: 1, unit_price: 1500.00, total: 1500.00 },
          { description: 'UI/UX Consultation', quantity: 10, unit_price: 100.00, total: 1000.00 }
        ]
      },
      {
        id: '2',
        invoice_number: 'INV-002',
        customer_id: '2',
        customer_name: 'Sarah Chen',
        business_name: 'Tech Solutions Inc',
        total_amount: 1650.00,
        subtotal: 1500.00,
        tax_amount: 150.00,
        status: 'paid',
        issue_date: '2024-01-12',
        due_date: '2024-02-11',
        created_at: '2024-01-12T14:20:00Z',
        ai_generated: false,
        items: [
          { description: 'Mobile App Development', quantity: 1, unit_price: 1500.00, total: 1500.00 }
        ]
      },
      {
        id: '3',
        invoice_number: 'INV-003',
        customer_id: '3',
        customer_name: 'Marcus Johnson',
        business_name: 'Johnson Consulting',
        total_amount: 550.00,
        subtotal: 500.00,
        tax_amount: 50.00,
        status: 'draft',
        issue_date: '2024-01-10',
        due_date: '2024-02-09',
        created_at: '2024-01-10T09:15:00Z',
        ai_generated: true,
        items: [
          { description: 'Business Consultation', quantity: 5, unit_price: 100.00, total: 500.00 }
        ]
      },
      {
        id: '4',
        invoice_number: 'INV-004',
        customer_id: '4',
        customer_name: 'Priya Sharma',
        business_name: 'Digital Marketing Pro',
        total_amount: 3300.00,
        subtotal: 3000.00,
        tax_amount: 300.00,
        status: 'overdue',
        issue_date: '2023-12-20',
        due_date: '2024-01-19',
        created_at: '2023-12-20T16:45:00Z',
        ai_generated: false,
        items: [
          { description: 'SEO Services', quantity: 1, unit_price: 2000.00, total: 2000.00 },
          { description: 'Content Writing', quantity: 10, unit_price: 100.00, total: 1000.00 }
        ]
      }
    ];
    setInvoices(sampleInvoices);
  };

  const filterAndSortInvoices = () => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'total_amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortBy === 'created_at' || sortBy === 'due_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    setFilteredInvoices(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return '✅';
      case 'sent':
        return '📤';
      case 'overdue':
        return '⚠️';
      case 'draft':
        return '📝';
      default:
        return '📄';
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await axios.put(`${API}/invoices/${invoiceId}/status`, { status: newStatus });
      // Update local state
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
        )
      );
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Error updating invoice status. Please try again.');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      // Create a temporary div with invoice content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateInvoiceHTML(invoice);
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoice_number}-${invoice.customer_name}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <div style="padding: 40px; font-family: Arial, sans-serif; background: white;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h1 style="color: #1f2937; font-size: 36px; margin: 0;">INVOICE</h1>
            <p style="color: #6b7280; margin: 5px 0;">${invoice.invoice_number}</p>
          </div>
          <div style="text-align: right;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <span style="color: white; font-size: 24px;">📄</span>
            </div>
            <p style="font-weight: bold; margin: 0;">InvoiceForge</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            <h3 style="color: #1f2937; margin-bottom: 10px;">Bill To:</h3>
            <p style="margin: 5px 0; color: #374151;"><strong>${invoice.customer_name}</strong></p>
            <p style="margin: 5px 0; color: #374151;">${invoice.business_name || ''}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="color: #1f2937; margin-bottom: 10px;">Invoice Details:</h3>
            <p style="margin: 5px 0; color: #374151;">Date: ${new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p style="margin: 5px 0; color: #374151;">Due: ${new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="text-align: left; padding: 10px 0; color: #1f2937;">Description</th>
              <th style="text-align: center; padding: 10px 0; color: #1f2937;">Qty</th>
              <th style="text-align: right; padding: 10px 0; color: #1f2937;">Unit Price</th>
              <th style="text-align: right; padding: 10px 0; color: #1f2937;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 15px 0; color: #374151;">${item.description}</td>
                <td style="padding: 15px 0; text-align: center; color: #374151;">${item.quantity}</td>
                <td style="padding: 15px 0; text-align: right; color: #374151;">₹${item.unit_price.toFixed(2)}</td>
                <td style="padding: 15px 0; text-align: right; color: #374151;">₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 250px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #374151;">
              <span>Subtotal:</span>
              <span>₹${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #374151;">
              <span>Tax:</span>
              <span>₹${invoice.tax_amount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0; font-size: 18px; font-weight: bold; color: #1f2937; border-top: 2px solid #e5e7eb; margin-top: 10px;">
              <span>Total:</span>
              <span>₹${invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This invoice was generated with InvoiceForge - Professional AI-Powered Invoicing
          </p>
        </div>
      </div>
    `;
  };

  const getTotalStats = () => {
    return {
      total: invoices.length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      sent: invoices.filter(inv => inv.status === 'sent').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      draft: invoices.filter(inv => inv.status === 'draft').length,
      totalRevenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0),
      pendingRevenue: invoices.filter(inv => ['sent', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + inv.total_amount, 0)
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Invoices</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage, track, and download all your previously created invoices in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card className="p-4 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </Card>
          <Card className="p-4 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-sm text-gray-600">Paid</div>
          </Card>
          <Card className="p-4 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </Card>
          <Card className="p-4 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </Card>
          <Card className="p-4 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </Card>
          <Card className="p-4 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-lg font-bold text-green-600">₹{stats.totalRevenue.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </Card>
          <Card className="p-4 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-lg font-bold text-orange-600">₹{stats.pendingRevenue.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Invoices</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by invoice number, customer name, or business..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Filter by Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="sent">Sent</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="created_at">Date Created</option>
                <option value="due_date">Due Date</option>
                <option value="total_amount">Amount</option>
                <option value="customer_name">Customer</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Order</Label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <Link to="/create">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold">
                + New Invoice
              </Button>
            </Link>
          </div>
        </Card>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <Card className="p-12 text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Invoices Found</h3>
            <p className="text-gray-600 mb-8">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start creating your first invoice with AI assistance'}
            </p>
            <Link to="/create">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg">
                Create Your First Invoice
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-6">
                    {/* Invoice Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                        invoice.ai_generated ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {invoice.ai_generated ? '🤖' : '📄'}
                      </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {invoice.invoice_number}
                        </h3>
                        <Badge className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)} {invoice.status.toUpperCase()}
                        </Badge>
                        {invoice.ai_generated && (
                          <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border-purple-200">
                            🤖 AI Generated
                          </Badge>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.customer_name}</p>
                          {invoice.business_name && (
                            <p className="text-gray-600">{invoice.business_name}</p>
                          )}
                        </div>
                        <div>
                          <p>Created: {new Date(invoice.created_at).toLocaleDateString()}</p>
                          <p>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-600">
                        <p>{invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{invoice.total_amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        ₹{invoice.subtotal.toFixed(2)} + ₹{invoice.tax_amount.toFixed(2)} tax
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-6">
                    {/* Status Change Dropdown */}
                    <select
                      value={invoice.status}
                      onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>

                    <Button
                      onClick={() => handleDownloadPDF(invoice)}
                      variant="outline"
                      size="sm"
                      className="px-3 py-1 text-sm"
                    >
                      📄 PDF
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 py-1 text-sm"
                    >
                      👁️ View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination would go here in a real app */}
      </div>
    </div>
  );
};

export default InvoicesPage;
