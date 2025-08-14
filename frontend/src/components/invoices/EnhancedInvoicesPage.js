import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnhancedInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0
  });

  const invoiceStatuses = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📝' },
    { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: '📤' },
    { value: 'viewed', label: 'Viewed', color: 'bg-yellow-100 text-yellow-800', icon: '👁️' },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800', icon: '✅' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800', icon: '⚠️' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' }
  ];

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, statusFilter, dateFilter]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      // Fetch invoices and customers in parallel
      const [invoicesResponse, customersResponse] = await Promise.all([
        axios.get(`${API}/invoices`),
        axios.get(`${API}/customers`)
      ]);
      
      const customers = customersResponse.data;
      const customersMap = customers.reduce((map, customer) => {
        map[customer.id] = customer;
        return map;
      }, {});
      
      const invoicesData = invoicesResponse.data.map(invoice => {
        const customer = customersMap[invoice.customer_id] || {};
        return {
          ...invoice,
          customer: customer,
          customer_name: customer.name || 'Unknown Customer',
          status: invoice.status || 'draft',
          created_at: invoice.created_at || new Date().toISOString(),
          due_date: invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total_amount: invoice.total_amount || calculateInvoiceTotal(invoice)
        };
      });
      
      console.log('Loaded invoices:', invoicesData.length);
      setInvoices(invoicesData);
      calculateStats(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      alert('Error loading invoices. Please make sure you are logged in and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateInvoiceTotal = (invoice) => {
    if (!invoice.items) return 0;
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax = subtotal * (invoice.tax_rate || 0);
    return subtotal + tax;
  };

  const calculateStats = (invoicesData) => {
    const stats = invoicesData.reduce((acc, invoice) => {
      acc.total += 1;
      acc.totalAmount += invoice.total_amount;
      
      if (invoice.status === 'paid') {
        acc.paid += 1;
        acc.paidAmount += invoice.total_amount;
      } else if (invoice.status === 'overdue') {
        acc.overdue += 1;
      } else if (['sent', 'viewed', 'draft'].includes(invoice.status)) {
        acc.pending += 1;
      }
      
      return acc;
    }, { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0, paidAmount: 0 });
    
    setStats(stats);
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.total_amount?.toString().includes(searchQuery)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setDate(now.getDate());
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(invoice => 
        new Date(invoice.created_at) >= filterDate
      );
    }

    setFilteredInvoices(filtered);
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      await axios.patch(`${API}/invoices/${invoiceId}/status`, { status: newStatus });
      
      // Update local state
      const updatedInvoices = invoices.map(invoice =>
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
      );
      setInvoices(updatedInvoices);
      calculateStats(updatedInvoices);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Error updating invoice status. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = invoiceStatuses.find(s => s.value === status) || invoiceStatuses[0];
    return (
      <Badge className={`${statusInfo.color} font-medium`}>
        <span className="mr-1">{statusInfo.icon}</span>
        {statusInfo.label}
      </Badge>
    );
  };

  const isOverdue = (invoice) => {
    return new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const sendPaymentReminder = async (invoiceId) => {
    try {
      await axios.post(`${API}/invoices/${invoiceId}/reminder`);
      alert('Payment reminder sent successfully!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Error sending reminder. Please try again.');
    }
  };

  const deleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API}/invoices/${invoiceId}`);
      
      // Update local state by removing the deleted invoice
      const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
      setInvoices(updatedInvoices);
      calculateStats(updatedInvoices);
      
      alert('Invoice deleted successfully!');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice. Please try again.');
    }
  };

  const deleteAllInvoices = async () => {
    if (!window.confirm('Are you sure you want to delete ALL invoices? This action cannot be undone and will remove all invoice data permanently.')) {
      return;
    }

    if (!window.confirm('This is your final warning. Are you absolutely sure you want to delete ALL invoices? Type "DELETE ALL" to confirm.')) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/invoices`);
      
      // Clear local state
      setInvoices([]);
      setFilteredInvoices([]);
      calculateStats([]);
      
      alert(`All invoices deleted successfully! ${response.data.deleted_count} invoices were removed.`);
    } catch (error) {
      console.error('Error deleting all invoices:', error);
      alert('Error deleting invoices. Please try again.');
    }
  };

  const downloadInvoicePDF = async (invoice) => {
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
      pdf.save(`${invoice.invoice_number}-${invoice.customer_name || 'Invoice'}.pdf`);
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
            <p style="margin: 5px 0; color: #374151;"><strong>${invoice.customer_name || 'Unknown Customer'}</strong></p>
            <p style="margin: 5px 0; color: #374151;">${invoice.customer?.business_name || ''}</p>
            <p style="margin: 5px 0; color: #374151;">${invoice.customer?.email || ''}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="color: #1f2937; margin-bottom: 10px;">Invoice Details:</h3>
            <p style="margin: 5px 0; color: #374151;">Date: ${formatDate(invoice.issue_date || invoice.created_at)}</p>
            <p style="margin: 5px 0; color: #374151;">Due: ${formatDate(invoice.due_date)}</p>
            <p style="margin: 5px 0; color: #374151;">Status: ${invoice.status}</p>
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
            ${(invoice.items || []).map(item => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 15px 0; color: #374151;">${item.description}</td>
                <td style="padding: 15px 0; text-align: center; color: #374151;">${item.quantity}</td>
                <td style="padding: 15px 0; text-align: right; color: #374151;">${formatCurrency(item.unit_price)}</td>
                <td style="padding: 15px 0; text-align: right; color: #374151;">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 250px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #374151;">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #374151;">
              <span>Tax:</span>
              <span>${formatCurrency(invoice.tax_amount || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0; font-size: 18px; font-weight: bold; color: #1f2937; border-top: 2px solid #e5e7eb; margin-top: 10px;">
              <span>Total:</span>
              <span>${formatCurrency(invoice.total_amount)}</span>
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

  const viewInvoiceDetails = (invoice) => {
    // Create a modal or navigate to detailed view
    alert(`Invoice Details:\n\nInvoice: ${invoice.invoice_number}\nCustomer: ${invoice.customer_name}\nAmount: ${formatCurrency(invoice.total_amount)}\nStatus: ${invoice.status}\nDue Date: ${formatDate(invoice.due_date)}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Invoice Management
        </h1>
        <p className="text-gray-600">
          Track, manage, and monitor all your invoices
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Paid</p>
              <p className="text-2xl font-bold text-green-900">{stats.paid}</p>
              <p className="text-xs text-green-700">{formatCurrency(stats.paidAmount)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              <p className="text-xs text-yellow-700">{formatCurrency(stats.totalAmount - stats.paidAmount)}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search invoices by customer name, number, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Statuses</option>
              {invoiceStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
            </select>
          </div>

          <Button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDateFilter('all');
            }}
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-gray-600">No invoices found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id}
                    className={`hover:bg-gray-50 ${isOverdue(invoice) ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number || `INV-${invoice.id}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(invoice.created_at)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.customer?.name || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.customer?.email}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                      {isOverdue(invoice) && invoice.status !== 'paid' && (
                        <Badge className="ml-2 bg-red-100 text-red-800">
                          OVERDUE
                        </Badge>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.due_date)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <div className="flex flex-col space-y-1">
                        {/* Status Update Dropdown */}
                        <select
                          value={invoice.status}
                          onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                        >
                          {invoiceStatuses.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>

                        {/* Action Buttons Row 1 */}
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewInvoiceDetails(invoice)}
                            className="text-xs px-2 py-1"
                            title="View Details"
                          >
                            👁️
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadInvoicePDF(invoice)}
                            className="text-xs px-2 py-1"
                            title="Download PDF"
                          >
                            📄
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteInvoice(invoice.id)}
                            className="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Invoice"
                          >
                            🗑️
                          </Button>
                        </div>

                        {/* Action Buttons Row 2 */}
                        {(invoice.status === 'sent' || invoice.status === 'viewed' || isOverdue(invoice)) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendPaymentReminder(invoice.id)}
                            className="text-xs py-1 w-full"
                            title="Send Payment Reminder"
                          >
                            📧 Remind
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => window.location.href = '/create'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            + Create New Invoice
          </Button>
          
          <Button
            variant="outline"
            className="px-6 py-3 rounded-xl font-semibold"
          >
            📊 Export Report
          </Button>
        </div>
        
        {/* Danger Zone */}
        {stats.total > 0 && (
          <div className="flex justify-center mt-4 sm:mt-0">
            <Button
              onClick={deleteAllInvoices}
              variant="outline"
              className="px-6 py-3 rounded-xl font-semibold text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              🗑️ Delete All Invoices ({stats.total})
            </Button>
          </div>
        )}
      </div>
      
      {/* Help Text */}
      <div className="text-center text-sm text-gray-500 mt-4">
        <p>
          💡 <strong>Pro Tips:</strong> Use the status dropdown to quickly update invoice status. 
          Click the 👁️ to view details, 📄 to download PDF, or 🗑️ to delete individual invoices.
        </p>
        <p className="mt-1">
          You can also use the search and filters above to quickly find specific invoices.
        </p>
      </div>
    </div>
  );
};

export default EnhancedInvoicesPage;
