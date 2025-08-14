import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      tagline: 'Perfect for getting started',
      price: { monthly: 0, annually: 0 },
      features: [
        '5 invoices per month',
        '3 basic templates',
        'PDF export',
        'Email invoices',
        'Basic AI assistance',
        'Community support',
        'Mobile app access'
      ],
      limitations: [
        'No voice input',
        'Limited templates',
        'InvoiceForge watermark'
      ],
      popular: false,
      cta: 'Get Started Free'
    },
    {
      id: 'professional',
      name: 'Professional',
      tagline: 'Best for growing businesses',
      price: { monthly: 1579, annually: 1245 },
      features: [
        'Unlimited invoices',
        '20+ premium templates',
        'AI voice input (Hindi + English)',
        'Custom branding',
        'Advanced AI assistance',
        'Payment integration (Stripe)',
        'Automated reminders',
        'Priority email support',
        'Mobile app access',
        'Custom invoice numbers',
        'Multi-currency support'
      ],
      limitations: [],
      popular: true,
      cta: 'Start Professional Trial'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'For large teams and organizations',
      price: { monthly: 4067, annually: 3237 },
      features: [
        'Everything in Professional',
        'Unlimited team members',
        'Custom AI training',
        'Advanced analytics',
        'API access',
        'White-label solution',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom integrations',
        'Advanced reporting',
        'Bulk operations',
        'SSO integration'
      ],
      limitations: [],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  const getPrice = (plan) => {
    const price = isAnnual ? plan.price.annually : plan.price.monthly;
    return price === 0 ? 'Free' : `₹${price}`;
  };

  const getSavings = (plan) => {
    if (plan.price.monthly === 0) return null;
    const monthlyCost = plan.price.monthly * 12;
    const annualCost = plan.price.annually * 12;
    const savings = monthlyCost - annualCost;
    return savings > 0 ? savings : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your business. All plans include our AI-powered features, 
            secure payments, and world-class support.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`font-semibold ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-green-600"
            />
            <span className={`font-semibold ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge className="bg-green-100 text-green-800 ml-2">
                Save up to 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                plan.popular 
                  ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-2xl transform scale-105' 
                  : 'hover:transform hover:scale-105'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center text-sm font-semibold">
                  🔥 Most Popular
                </div>
              )}

              <div className={`p-8 ${plan.popular ? 'pt-16' : 'pt-8'}`}>
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.tagline}</p>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {getPrice(plan)}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-gray-600 ml-1">
                        /{isAnnual ? 'month' : 'month'}
                      </span>
                    )}
                  </div>

                  {isAnnual && getSavings(plan) > 0 && (
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm inline-block mb-4">
                      Save ₹{getSavings(plan)}/year
                    </div>
                  )}

                  <Button 
                    className={`w-full py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                        : plan.id === 'free'
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    What's included:
                  </h4>
                  
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-semibold text-gray-600 text-sm mb-2">Limitations:</h5>
                    <div className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                            <svg className="w-2.5 h-2.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <span className="text-gray-500 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <Card className="p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Compare All Features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Starter</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Professional</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { name: 'Monthly Invoices', values: ['5', 'Unlimited', 'Unlimited'] },
                  { name: 'AI Voice Input', values: ['❌', '✅', '✅'] },
                  { name: 'Premium Templates', values: ['3 Basic', '20+', 'All + Custom'] },
                  { name: 'Custom Branding', values: ['❌', '✅', '✅'] },
                  { name: 'Payment Integration', values: ['❌', '✅', '✅'] },
                  { name: 'Team Members', values: ['1', '5', 'Unlimited'] },
                  { name: 'API Access', values: ['❌', '❌', '✅'] },
                  { name: 'Priority Support', values: ['❌', '✅', '24/7'] }
                ].map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{feature.name}</td>
                    {feature.values.map((value, valueIndex) => (
                      <td key={valueIndex} className="py-4 px-4 text-center text-gray-700">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* FAQ Section */}
        <Card className="p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                question: 'Can I change plans anytime?',
                answer: 'Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately.'
              },
              {
                question: 'Is there a free trial?',
                answer: 'Professional and Enterprise plans come with a 14-day free trial. No credit card required.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.'
              },
              {
                question: 'How does AI voice input work?',
                answer: 'Our AI can understand voice commands in both English and Hindi to create invoices automatically.'
              },
              {
                question: 'Is my data secure?',
                answer: 'Absolutely! We use bank-level encryption and comply with SOC 2 and GDPR standards.'
              },
              {
                question: 'Do you offer customer support?',
                answer: 'Yes! We provide email support for all plans, with priority support for Professional and 24/7 for Enterprise.'
              }
            ].map((faq, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-semibold text-gray-900">{faq.question}</h4>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Final CTA */}
        <Card className="p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Invoicing?</h2>
          <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of businesses using InvoiceForge to create professional invoices 
            with AI-powered voice input and smart automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105">
              Start Free Trial →
            </Button>
            <Button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-xl font-semibold transition-all duration-300">
              Schedule Demo
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PricingPage;
