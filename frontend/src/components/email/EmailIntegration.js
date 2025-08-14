import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmailIntegration = ({ invoice, onClose, onSent }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    subject: '',
    message: '',
    template: 'invoice_send'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState({});

  const templates = {
    invoice_send: {
      subject: 'Invoice {invoice_number} from {company_name}',
      message: `Dear {customer_name},

I hope this email finds you well. Please find attached invoice {invoice_number} for the services provided.

Invoice Details:
- Invoice Number: {invoice_number}
- Amount: {total_amount}
- Due Date: {due_date}

Payment can be made via:
- Bank Transfer: {bank_details}
- Online Payment: {payment_link}

If you have any questions about this invoice, please don't hesitate to contact me.

Thank you for your business!

Best regards,
{sender_name}
{company_name}
{contact_info}`
    },
    
    payment_reminder: {
      subject: 'Payment Reminder - Invoice {invoice_number}',
      message: `Dear {customer_name},

This is a friendly reminder that invoice {invoice_number} is due for payment.

Invoice Details:
- Invoice Number: {invoice_number}
- Amount: {total_amount}
- Original Due Date: {due_date}
- Days Overdue: {days_overdue}

Please arrange payment at your earliest convenience to avoid any late fees.

Payment Options:
- Bank Transfer: {bank_details}
- Online Payment: {payment_link}

If you have already made this payment, please disregard this message. If you have any questions, please contact me immediately.

Thank you for your prompt attention to this matter.

Best regards,
{sender_name}
{company_name}
{contact_info}`
    },
    
    payment_confirmation: {
      subject: 'Payment Received - Invoice {invoice_number}',
      message: `Dear {customer_name},

Thank you! We have successfully received your payment for invoice {invoice_number}.

Payment Details:
- Invoice Number: {invoice_number}
- Amount Paid: {total_amount}
- Payment Date: {payment_date}

Your account is now up to date. We appreciate your business and look forward to serving you again.

If you need a receipt or have any questions, please let me know.

Best regards,
{sender_name}
{company_name}
{contact_info}`
    },

    follow_up: {
      subject: 'Following up on Invoice {invoice_number}',
      message: `Dear {customer_name},

I wanted to follow up on invoice {invoice_number} that was sent on {sent_date}.

Invoice Details:
- Invoice Number: {invoice_number}
- Amount: {total_amount}
- Due Date: {due_date}

Could you please confirm receipt of this invoice and let me know when we can expect payment?

If there are any issues or questions about the invoice, I'm happy to discuss them with you.

Payment Options:
- Bank Transfer: {bank_details}
- Online Payment: {payment_link}

Thank you for your time and I look forward to hearing from you soon.

Best regards,
{sender_name}
{company_name}
{contact_info}`
    }
  };

  useEffect(() => {
    if (invoice) {
      setEmailData(prev => ({
        ...prev,
        to: invoice.customer?.email || '',
        subject: processTemplate(templates[prev.template].subject, invoice),
        message: processTemplate(templates[prev.template].message, invoice)
      }));
    }
  }, [invoice]);

  const processTemplate = (template, invoiceData) => {
    if (!invoiceData) return template;
    
    const variables = {
      invoice_number: invoiceData.invoice_number || `INV-${invoiceData.id}`,
      customer_name: invoiceData.customer?.name || 'Valued Customer',
      company_name: 'InvoiceForge', // This should come from business profile
      total_amount: formatCurrency(invoiceData.total_amount || 0),
      due_date: formatDate(invoiceData.due_date),
      sent_date: formatDate(invoiceData.created_at),
      payment_date: formatDate(new Date()),
      days_overdue: calculateDaysOverdue(invoiceData.due_date),
      sender_name: 'Your Business', // This should come from user profile
      contact_info: 'support@invoiceforge.com | +1 (555) 123-4567',
      bank_details: 'Bank: Chase, Account: ****1234',
      payment_link: `${window.location.origin}/pay/${invoiceData.id}`
    };

    let processed = template;
    Object.keys(variables).forEach(key => {
      processed = processed.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
    });

    return processed;
  };

  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleTemplateChange = (templateKey) => {
    setEmailData(prev => ({
      ...prev,
      template: templateKey,
      subject: processTemplate(templates[templateKey].subject, invoice),
      message: processTemplate(templates[templateKey].message, invoice)
    }));
  };

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSend = async () => {
    if (!emailData.to || !emailData.subject || !emailData.message) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const emailPayload = {
        ...emailData,
        invoice_id: invoice.id,
        attachPDF: true
      };

      await axios.post(`${API}/email/send-invoice`, emailPayload);
      
      // Update invoice status if it was a first send
      if (invoice.status === 'draft' && emailData.template === 'invoice_send') {
        await axios.patch(`${API}/invoices/${invoice.id}/status`, { status: 'sent' });
      }

      alert('Email sent successfully!');
      if (onSent) onSent();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const previewEmail = () => {
    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    previewWindow.document.write(`
      <html>
        <head>
          <title>Email Preview</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .email-header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .email-body { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="email-header">
            <strong>To:</strong> ${emailData.to}<br>
            ${emailData.cc ? `<strong>CC:</strong> ${emailData.cc}<br>` : ''}
            <strong>Subject:</strong> ${emailData.subject}
          </div>
          <div class="email-body">${emailData.message}</div>
        </body>
      </html>
    `);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Send Invoice Email</h2>
              <p className="text-gray-600">
                {invoice?.invoice_number || `INV-${invoice?.id}`} - {invoice?.customer?.name}
              </p>
            </div>
            <Button 
              onClick={onClose}
              variant="outline"
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>

          {/* Email Template Selection */}
          <div className="mb-6">
            <Label className="text-base font-semibold">Email Template</Label>
            <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(templates).map(([key, template]) => (
                <Button
                  key={key}
                  onClick={() => handleTemplateChange(key)}
                  variant={emailData.template === key ? 'default' : 'outline'}
                  className={`p-3 h-auto text-left ${
                    emailData.template === key ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">
                      {key.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Email Composition */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="to">To Email *</Label>
                <Input
                  id="to"
                  type="email"
                  value={emailData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  placeholder="customer@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cc">CC Email (Optional)</Label>
                <Input
                  id="cc"
                  type="email"
                  value={emailData.cc}
                  onChange={(e) => handleInputChange('cc', e.target.value)}
                  placeholder="manager@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={emailData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={12}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>

            {/* Email Preview & Options */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Email Preview</Label>
                <Card className="p-4 bg-gray-50 mt-2">
                  <div className="space-y-2 text-sm">
                    <div><strong>To:</strong> {emailData.to || 'customer@example.com'}</div>
                    {emailData.cc && <div><strong>CC:</strong> {emailData.cc}</div>}
                    <div><strong>Subject:</strong> {emailData.subject}</div>
                    <div className="border-t pt-2 mt-2">
                      <div className="whitespace-pre-wrap text-xs bg-white p-3 rounded border max-h-64 overflow-y-auto">
                        {emailData.message}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <Label className="text-base font-semibold">Attachments</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded border">
                    <div className="flex items-center">
                      <div className="text-blue-600 mr-2">📄</div>
                      <div>
                        <div className="font-medium text-blue-900">
                          {invoice?.invoice_number || 'Invoice'}.pdf
                        </div>
                        <div className="text-xs text-blue-600">Invoice PDF will be attached</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Auto-attach</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Email Options</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Request read receipt</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Schedule for later</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Update invoice status when sent</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div className="flex space-x-3">
              <Button
                onClick={previewEmail}
                variant="outline"
                className="flex items-center"
              >
                👁️ Full Preview
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center"
              >
                💾 Save Template
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleSend}
                disabled={isLoading || !emailData.to || !emailData.subject || !emailData.message}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <>📤 Send Email</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailIntegration;
