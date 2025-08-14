import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';
import FontCustomizer from './FontCustomizer';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TemplatesPage = ({ onTemplateSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [fontSettings, setFontSettings] = useState(null);
  const [businessTemplates, setBusinessTemplates] = useState([]);
  const [isLoadingBusinessTemplates, setIsLoadingBusinessTemplates] = useState(true);
  const navigate = useNavigate();

  const templates = [
    // PROFESSIONAL TEMPLATES
    {
      id: 'royal-blue',
      name: 'Royal Executive',
      category: 'professional',
      description: 'Luxury design with ornate corner details and royal blue accents',
      image: '/api/placeholder/300/400',
      color: 'blue',
      features: ['Ornate Corner Designs', 'Premium Typography', 'Watermark Ready', 'Executive Layout'],
      premium: true,
      corners: 'ornate',
      style: 'executive'
    },
    {
      id: 'corporate-navy',
      name: 'Corporate Navy',
      category: 'professional',
      description: 'Professional navy blue design with subtle corner embellishments',
      image: '/api/placeholder/300/400',
      color: 'indigo',
      features: ['Corporate Identity', 'Subtle Elegance', 'Professional Corners', 'Clean Typography'],
      premium: false,
      corners: 'subtle',
      style: 'corporate'
    },
    {
      id: 'forest-professional',
      name: 'Forest Professional',
      category: 'professional',
      description: 'Nature-inspired professional design with leaf corner motifs',
      image: '/api/placeholder/300/400',
      color: 'green',
      features: ['Nature Corners', 'Eco-Friendly Design', 'Professional Look', 'Organic Elements'],
      premium: false,
      corners: 'nature',
      style: 'professional'
    },
    {
      id: 'steel-corporate',
      name: 'Steel Corporate',
      category: 'professional',
      description: 'Bold steel-gray design perfect for industrial and tech companies',
      image: '/api/placeholder/300/400',
      color: 'gray',
      features: ['Industrial Design', 'Bold Headers', 'Tech-Friendly', 'Corporate Branding'],
      premium: false,
      corners: 'geometric',
      style: 'corporate'
    },
    {
      id: 'midnight-pro',
      name: 'Midnight Professional',
      category: 'professional',
      description: 'Sophisticated dark theme with elegant white accents',
      image: '/api/placeholder/300/400',
      color: 'slate',
      features: ['Dark Theme', 'High Contrast', 'Modern Appeal', 'Eye-Catching'],
      premium: true,
      corners: 'minimal',
      style: 'modern'
    },

    // LUXURY TEMPLATES
    {
      id: 'elegant-gold',
      name: 'Golden Prestige',
      category: 'luxury',
      description: 'Premium gold template with decorative borders and elegant flourishes',
      image: '/api/placeholder/300/400',
      color: 'yellow',
      features: ['Gold Accents', 'Decorative Borders', 'Luxury Finish', 'Premium Branding'],
      premium: true,
      corners: 'decorative',
      style: 'luxury'
    },
    {
      id: 'crimson-luxury',
      name: 'Crimson Luxury',
      category: 'luxury',
      description: 'Sophisticated crimson template with baroque corner details',
      image: '/api/placeholder/300/400',
      color: 'red',
      features: ['Baroque Corners', 'Luxury Finish', 'Rich Colors', 'Premium Details'],
      premium: true,
      corners: 'baroque',
      style: 'luxury'
    },
    {
      id: 'platinum-elite',
      name: 'Platinum Elite',
      category: 'luxury',
      description: 'Ultra-premium platinum design with diamond corner accents',
      image: '/api/placeholder/300/400',
      color: 'gray',
      features: ['Diamond Corners', 'Platinum Finish', 'Elite Design', 'Ultra Premium'],
      premium: true,
      corners: 'diamond',
      style: 'elite'
    },
    {
      id: 'sapphire-deluxe',
      name: 'Sapphire Deluxe',
      category: 'luxury',
      description: 'Exquisite sapphire blue with ornate decorative elements',
      image: '/api/placeholder/300/400',
      color: 'blue',
      features: ['Sapphire Accents', 'Ornate Design', 'Luxury Typography', 'Premium Feel'],
      premium: true,
      corners: 'ornate',
      style: 'luxury'
    },
    {
      id: 'rose-gold-premium',
      name: 'Rose Gold Premium',
      category: 'luxury',
      description: 'Elegant rose gold design with sophisticated pink undertones',
      image: '/api/placeholder/300/400',
      color: 'pink',
      features: ['Rose Gold Finish', 'Elegant Colors', 'Premium Layout', 'Sophisticated Appeal'],
      premium: true,
      corners: 'decorative',
      style: 'luxury'
    },

    // CREATIVE TEMPLATES
    {
      id: 'vintage-emerald',
      name: 'Vintage Emerald',
      category: 'creative',
      description: 'Vintage-inspired design with art deco corner elements',
      image: '/api/placeholder/300/400',
      color: 'emerald',
      features: ['Art Deco Corners', 'Vintage Typography', 'Emerald Accents', 'Classic Borders'],
      premium: true,
      corners: 'artdeco',
      style: 'vintage'
    },
    {
      id: 'neon-cyber',
      name: 'Neon Cyber',
      category: 'creative',
      description: 'Futuristic cyberpunk-inspired design with electric blue highlights',
      image: '/api/placeholder/300/400',
      color: 'cyan',
      features: ['Cyberpunk Style', 'Neon Accents', 'Futuristic Look', 'Tech-Forward'],
      premium: true,
      corners: 'geometric',
      style: 'futuristic'
    },
    {
      id: 'sunset-creative',
      name: 'Sunset Creative',
      category: 'creative',
      description: 'Vibrant gradient design inspired by beautiful sunsets',
      image: '/api/placeholder/300/400',
      color: 'orange',
      features: ['Gradient Design', 'Sunset Colors', 'Creative Layout', 'Artistic Appeal'],
      premium: false,
      corners: 'nature',
      style: 'artistic'
    },
    {
      id: 'ocean-wave',
      name: 'Ocean Wave',
      category: 'creative',
      description: 'Flowing ocean-inspired design with wave-like elements',
      image: '/api/placeholder/300/400',
      color: 'teal',
      features: ['Wave Elements', 'Ocean Colors', 'Fluid Design', 'Nature Inspired'],
      premium: false,
      corners: 'nature',
      style: 'organic'
    },
    {
      id: 'retro-synthwave',
      name: 'Retro Synthwave',
      category: 'creative',
      description: '80s-inspired synthwave design with neon pink and purple gradients',
      image: '/api/placeholder/300/400',
      color: 'purple',
      features: ['80s Aesthetic', 'Synthwave Colors', 'Retro Typography', 'Nostalgic Feel'],
      premium: true,
      corners: 'geometric',
      style: 'retro'
    },
    {
      id: 'botanical-art',
      name: 'Botanical Art',
      category: 'creative',
      description: 'Artistic botanical design with hand-drawn leaf illustrations',
      image: '/api/placeholder/300/400',
      color: 'green',
      features: ['Botanical Elements', 'Artistic Style', 'Hand-Drawn Feel', 'Nature Theme'],
      premium: false,
      corners: 'nature',
      style: 'artistic'
    },
    {
      id: 'galaxy-space',
      name: 'Galaxy Space',
      category: 'creative',
      description: 'Cosmic-inspired design with deep space colors and star elements',
      image: '/api/placeholder/300/400',
      color: 'indigo',
      features: ['Space Theme', 'Cosmic Colors', 'Star Elements', 'Universe Inspired'],
      premium: true,
      corners: 'minimal',
      style: 'cosmic'
    },

    // MINIMAL TEMPLATES
    {
      id: 'modern-slate',
      name: 'Modern Slate',
      category: 'minimal',
      description: 'Contemporary slate design with geometric corner accents',
      image: '/api/placeholder/300/400',
      color: 'slate',
      features: ['Geometric Corners', 'Modern Typography', 'Minimalist Design', 'Professional Appeal'],
      premium: false,
      corners: 'geometric',
      style: 'modern'
    },
    {
      id: 'clean-white',
      name: 'Clean White',
      category: 'minimal',
      description: 'Ultra-clean white design with subtle gray accents',
      image: '/api/placeholder/300/400',
      color: 'gray',
      features: ['Pure White', 'Subtle Accents', 'Clean Lines', 'Minimal Approach'],
      premium: false,
      corners: 'minimal',
      style: 'minimal'
    },
    {
      id: 'zen-minimal',
      name: 'Zen Minimal',
      category: 'minimal',
      description: 'Peaceful zen-inspired design with balanced spacing and soft colors',
      image: '/api/placeholder/300/400',
      color: 'green',
      features: ['Zen Philosophy', 'Balanced Layout', 'Soft Colors', 'Peaceful Design'],
      premium: false,
      corners: 'minimal',
      style: 'zen'
    },
    {
      id: 'monochrome-chic',
      name: 'Monochrome Chic',
      category: 'minimal',
      description: 'Sophisticated black and white design with bold typography',
      image: '/api/placeholder/300/400',
      color: 'black',
      features: ['Black & White', 'Bold Typography', 'High Contrast', 'Timeless Design'],
      premium: false,
      corners: 'minimal',
      style: 'monochrome'
    },
    {
      id: 'scandinavian-light',
      name: 'Scandinavian Light',
      category: 'minimal',
      description: 'Nordic-inspired design with light colors and clean aesthetics',
      image: '/api/placeholder/300/400',
      color: 'blue',
      features: ['Nordic Style', 'Light Colors', 'Clean Aesthetic', 'Hygge Feeling'],
      premium: false,
      corners: 'minimal',
      style: 'scandinavian'
    },

    // INDUSTRY SPECIFIC
    {
      id: 'medical-clinic',
      name: 'Medical Clinic',
      category: 'industry',
      description: 'Professional medical template with health-focused design elements',
      image: '/api/placeholder/300/400',
      color: 'blue',
      features: ['Medical Icons', 'Health Colors', 'Professional Look', 'Trust Building'],
      premium: false,
      corners: 'minimal',
      style: 'medical'
    },
    {
      id: 'legal-firm',
      name: 'Legal Firm',
      category: 'industry',
      description: 'Authoritative legal template with traditional design elements',
      image: '/api/placeholder/300/400',
      color: 'indigo',
      features: ['Legal Styling', 'Authoritative Look', 'Traditional Elements', 'Professional Trust'],
      premium: true,
      corners: 'ornate',
      style: 'legal'
    },
    {
      id: 'tech-startup',
      name: 'Tech Startup',
      category: 'industry',
      description: 'Modern tech-focused design perfect for startups and IT companies',
      image: '/api/placeholder/300/400',
      color: 'cyan',
      features: ['Tech Elements', 'Modern Look', 'Innovation Focus', 'Startup Vibe'],
      premium: false,
      corners: 'geometric',
      style: 'tech'
    },
    {
      id: 'restaurant-hospitality',
      name: 'Restaurant & Hospitality',
      category: 'industry',
      description: 'Warm hospitality design perfect for restaurants and food services',
      image: '/api/placeholder/300/400',
      color: 'orange',
      features: ['Warm Colors', 'Hospitality Feel', 'Food Industry', 'Welcoming Design'],
      premium: false,
      corners: 'nature',
      style: 'hospitality'
    },
    {
      id: 'creative-agency',
      name: 'Creative Agency',
      category: 'industry',
      description: 'Bold creative design for agencies and design studios',
      image: '/api/placeholder/300/400',
      color: 'purple',
      features: ['Creative Elements', 'Bold Colors', 'Artistic Flair', 'Agency Style'],
      premium: true,
      corners: 'geometric',
      style: 'creative'
    },
    {
      id: 'construction-build',
      name: 'Construction & Build',
      category: 'industry',
      description: 'Robust design for construction and building companies',
      image: '/api/placeholder/300/400',
      color: 'yellow',
      features: ['Industrial Look', 'Robust Design', 'Construction Theme', 'Strong Appeal'],
      premium: false,
      corners: 'geometric',
      style: 'industrial'
    },

    // SEASONAL & THEMED
    {
      id: 'christmas-holiday',
      name: 'Christmas Holiday',
      category: 'seasonal',
      description: 'Festive Christmas design with holiday colors and decorations',
      image: '/api/placeholder/300/400',
      color: 'red',
      features: ['Holiday Theme', 'Festive Colors', 'Seasonal Elements', 'Christmas Spirit'],
      premium: false,
      corners: 'decorative',
      style: 'holiday'
    },
    {
      id: 'spring-fresh',
      name: 'Spring Fresh',
      category: 'seasonal',
      description: 'Fresh spring design with blooming flowers and pastel colors',
      image: '/api/placeholder/300/400',
      color: 'green',
      features: ['Spring Colors', 'Fresh Look', 'Floral Elements', 'Renewal Theme'],
      premium: false,
      corners: 'nature',
      style: 'seasonal'
    },
    {
      id: 'summer-bright',
      name: 'Summer Bright',
      category: 'seasonal',
      description: 'Vibrant summer design with sunny colors and beach vibes',
      image: '/api/placeholder/300/400',
      color: 'yellow',
      features: ['Summer Colors', 'Bright Design', 'Beach Vibes', 'Sunny Feel'],
      premium: false,
      corners: 'nature',
      style: 'seasonal'
    },
    {
      id: 'autumn-warm',
      name: 'Autumn Warm',
      category: 'seasonal',
      description: 'Cozy autumn design with warm fall colors and leaf motifs',
      image: '/api/placeholder/300/400',
      color: 'orange',
      features: ['Fall Colors', 'Cozy Feel', 'Leaf Motifs', 'Warm Tones'],
      premium: false,
      corners: 'nature',
      style: 'seasonal'
    }
  ];

  // Load business templates on component mount
  useEffect(() => {
    loadBusinessTemplates();
  }, []);

  // Listen for template refresh events
  useEffect(() => {
    const handleTemplateRefresh = () => {
      console.log('Refreshing templates after new template generation');
      loadBusinessTemplates();
    };

    // Listen for custom event
    window.addEventListener('refreshBusinessTemplates', handleTemplateRefresh);
    
    return () => {
      window.removeEventListener('refreshBusinessTemplates', handleTemplateRefresh);
    };
  }, []);

  const loadBusinessTemplates = async () => {
    try {
      // Check if user is authenticated
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token found, skipping business templates');
        setBusinessTemplates([]);
        setIsLoadingBusinessTemplates(false);
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      };

      const response = await axios.get(`${API}/business/templates`, config);
      
      // Handle the nested response structure
      if (response.data && response.data.templates) {
        const customTemplates = response.data.templates.custom || [];
        
        // Transform custom templates to match the expected structure
        const transformedTemplates = customTemplates.map(template => ({
          ...template,
          category: 'business', // Ensure they appear in the business category
          image: '/api/placeholder/300/400' // Add placeholder image
        }));
        
        setBusinessTemplates(transformedTemplates);
        console.log('Loaded business templates:', transformedTemplates.length);
      } else {
        setBusinessTemplates([]);
      }
    } catch (error) {
      console.log('No business templates found or error:', error.response?.status);
      setBusinessTemplates([]);
    } finally {
      setIsLoadingBusinessTemplates(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length + businessTemplates.length },
    { id: 'business', name: 'Your Business', count: businessTemplates.length },
    { id: 'professional', name: 'Professional', count: templates.filter(t => t.category === 'professional').length },
    { id: 'luxury', name: 'Luxury', count: templates.filter(t => t.category === 'luxury').length },
    { id: 'creative', name: 'Creative', count: templates.filter(t => t.category === 'creative').length },
    { id: 'minimal', name: 'Minimal', count: templates.filter(t => t.category === 'minimal').length },
    { id: 'industry', name: 'Industry Specific', count: templates.filter(t => t.category === 'industry').length },
    { id: 'seasonal', name: 'Seasonal & Themed', count: templates.filter(t => t.category === 'seasonal').length }
  ];

  const filteredTemplates = (() => {
    if (selectedCategory === 'all') {
      return [...businessTemplates, ...templates];
    } else if (selectedCategory === 'business') {
      return businessTemplates;
    } else {
      return templates.filter(template => template.category === selectedCategory);
    }
  })();

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const getColorClasses = (color, type = 'bg') => {
    const colorMap = {
      blue: type === 'bg' ? 'bg-blue-500' : 'text-blue-500 border-blue-200',
      purple: type === 'bg' ? 'bg-purple-500' : 'text-purple-500 border-purple-200',
      gray: type === 'bg' ? 'bg-gray-500' : 'text-gray-500 border-gray-200',
      green: type === 'bg' ? 'bg-green-500' : 'text-green-500 border-green-200',
      black: type === 'bg' ? 'bg-black' : 'text-black border-gray-200',
      orange: type === 'bg' ? 'bg-orange-500' : 'text-orange-500 border-orange-200',
      yellow: type === 'bg' ? 'bg-yellow-500' : 'text-yellow-500 border-yellow-200',
      indigo: type === 'bg' ? 'bg-indigo-500' : 'text-indigo-500 border-indigo-200',
      emerald: type === 'bg' ? 'bg-emerald-500' : 'text-emerald-500 border-emerald-200',
      slate: type === 'bg' ? 'bg-slate-500' : 'text-slate-500 border-slate-200',
      red: type === 'bg' ? 'bg-red-500' : 'text-red-500 border-red-200',
      pink: type === 'bg' ? 'bg-pink-500' : 'text-pink-500 border-pink-200',
      cyan: type === 'bg' ? 'bg-cyan-500' : 'text-cyan-500 border-cyan-200',
      teal: type === 'bg' ? 'bg-teal-500' : 'text-teal-500 border-teal-200'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Invoice Template
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select from our collection of professionally designed invoice templates. 
            Customize colors, fonts, and layouts to match your brand.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
            <Button
              onClick={() => setActiveTab('browse')}
              variant={activeTab === 'browse' ? 'default' : 'ghost'}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'browse'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              🎨 Browse Templates
            </Button>
            <Button
              onClick={() => setActiveTab('customize')}
              variant={activeTab === 'customize' ? 'default' : 'ghost'}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ml-2 ${
                activeTab === 'customize'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              ✏️ Customize Fonts
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'browse' && (
          <>
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'hover:bg-gray-100 border-2 border-gray-200'
                  }`}
                >
                  {category.name}
                  <Badge className="ml-2 bg-blue-100 text-blue-800">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </>
        )}

        {/* Browse Tab Content */}
        {activeTab === 'browse' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer ${
                  selectedTemplate?.id === template.id 
                    ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-2xl' 
                    : ''
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                {/* Template Preview */}
                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {/* Mock Invoice Preview */}
                  <div className="absolute inset-4">
                    <div className={`w-full h-full ${getColorClasses(template.color, 'border')} border-2 rounded-lg bg-white p-4 shadow-lg`}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-8 h-8 ${getColorClasses(template.color)} rounded`}></div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-800">INVOICE</div>
                          <div className="text-xs text-gray-600">#INV-001</div>
                        </div>
                      </div>
                      
                      {/* Content Lines */}
                      <div className="space-y-2">
                        <div className={`h-1 ${getColorClasses(template.color)} rounded w-3/4`}></div>
                        <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-1 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      
                      {/* Table Mock */}
                      <div className="mt-4 space-y-1">
                        <div className="flex space-x-2">
                          <div className="h-1 bg-gray-300 rounded flex-1"></div>
                          <div className="h-1 bg-gray-300 rounded w-8"></div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="h-1 bg-gray-200 rounded flex-1"></div>
                          <div className="h-1 bg-gray-200 rounded w-8"></div>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="mt-4 flex justify-end">
                        <div className={`w-16 h-2 ${getColorClasses(template.color)} rounded`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Premium Badge */}
                  {template.premium && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                      ✨ Premium
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    <div className={`w-4 h-4 ${getColorClasses(template.color)} rounded-full`}></div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  
                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Button */}
                  <Button 
                    className={`w-full font-semibold transition-all duration-300 ${
                      selectedTemplate?.id === template.id
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : getColorClasses(template.color, 'text') + ' hover:bg-gray-100'
                    }`}
                    variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                  >
                    {selectedTemplate?.id === template.id ? (
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Selected
                      </div>
                    ) : (
                      'Select Template'
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Customize Tab Content */}
        {activeTab === 'customize' && (
          <div className="max-w-6xl mx-auto">
            {!selectedTemplate ? (
              <Card className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">✏️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a Template First</h3>
                <p className="text-gray-600 mb-6">
                  Choose a template from the "Browse Templates" tab to start customizing its fonts.
                </p>
                <Button 
                  onClick={() => setActiveTab('browse')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                >
                  Browse Templates →
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Selected Template Info */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Customizing: {selectedTemplate.name}
                      </h3>
                      <p className="text-gray-600">{selectedTemplate.description}</p>
                    </div>
                    <div className={`w-12 h-12 ${getColorClasses(selectedTemplate.color)} rounded-lg`}></div>
                  </div>
                </Card>

                {/* Font Customizer */}
                <FontCustomizer
                  selectedTemplate={selectedTemplate}
                  onFontChange={(settings) => setFontSettings(settings)}
                />

                {/* Apply Changes Button */}
                {fontSettings && (
                  <Card className="p-6 text-center bg-green-50 border-2 border-green-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Font Settings Applied!</h3>
                    <p className="text-gray-600 mb-4">
                      Your custom font settings have been configured for the {selectedTemplate.name} template.
                    </p>
                    <Button 
                      onClick={() => navigate('/create')}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      Create Invoice with Custom Fonts →
                    </Button>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected Template Info - Browse Tab Only */}
        {selectedTemplate && activeTab === 'browse' && (
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 mb-8">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {selectedTemplate.name} Template Selected
              </h3>
              <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {selectedTemplate.features.map((feature, index) => (
                  <Badge key={index} className="bg-blue-100 text-blue-800">
                    {feature}
                  </Badge>
                ))}
              </div>
              
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={() => navigate('/create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Continue with This Template →
                </Button>
                <Button 
                  onClick={() => setActiveTab('customize')}
                  variant="outline"
                  className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  ✏️ Customize Fonts
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Custom Template CTA */}
        <Card className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Need a Custom Template?</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Can't find the perfect template for your business? Our AI-powered design system can create a custom template based on your brand colors, logo, and preferences.
          </p>
          <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105">
            🤖 Create Custom Template with AI
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default TemplatesPage;
