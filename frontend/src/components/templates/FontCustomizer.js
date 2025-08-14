import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';

const FontCustomizer = ({ selectedTemplate, onFontChange }) => {
  const [fontSettings, setFontSettings] = useState({
    headerFont: 'Inter',
    bodyFont: 'Inter',
    headerSize: 'text-2xl',
    bodySize: 'text-base',
    headerWeight: 'font-bold',
    bodyWeight: 'font-normal',
    letterSpacing: 'tracking-normal',
    lineHeight: 'leading-relaxed'
  });

  // Font families organized by category
  const fontFamilies = {
    'Modern & Sans-Serif': [
      { name: 'Inter', class: 'font-inter', description: 'Clean, modern, highly readable' },
      { name: 'Roboto', class: 'font-roboto', description: 'Google\'s friendly, professional font' },
      { name: 'Open Sans', class: 'font-open-sans', description: 'Optimized for print, web, and mobile' },
      { name: 'Lato', class: 'font-lato', description: 'Humanist design with warmth' },
      { name: 'Montserrat', class: 'font-montserrat', description: 'Urban, geometric style' },
      { name: 'Nunito', class: 'font-nunito', description: 'Rounded, friendly appearance' },
      { name: 'Poppins', class: 'font-poppins', description: 'Geometric, international appeal' }
    ],
    'Professional & Corporate': [
      { name: 'Arial', class: 'font-arial', description: 'Classic business standard' },
      { name: 'Helvetica', class: 'font-helvetica', description: 'Timeless Swiss design' },
      { name: 'Calibri', class: 'font-calibri', description: 'Microsoft Office standard' },
      { name: 'Avenir', class: 'font-avenir', description: 'Clean, balanced letterforms' },
      { name: 'Proxima Nova', class: 'font-proxima', description: 'Modern geometric sans-serif' }
    ],
    'Classic & Serif': [
      { name: 'Times New Roman', class: 'font-times', description: 'Traditional, authoritative' },
      { name: 'Georgia', class: 'font-georgia', description: 'Screen-optimized serif' },
      { name: 'Playfair Display', class: 'font-playfair', description: 'Elegant, high-contrast' },
      { name: 'Merriweather', class: 'font-merriweather', description: 'Pleasant reading serif' },
      { name: 'Crimson Text', class: 'font-crimson', description: 'Old-style book typography' }
    ],
    'Creative & Display': [
      { name: 'Oswald', class: 'font-oswald', description: 'Condensed, impactful headers' },
      { name: 'Raleway', class: 'font-raleway', description: 'Elegant, thin strokes' },
      { name: 'Source Sans Pro', class: 'font-source', description: 'Adobe\'s first open source font' },
      { name: 'Ubuntu', class: 'font-ubuntu', description: 'Distinctive, humanist design' },
      { name: 'Work Sans', class: 'font-work', description: 'Mid-contrast, optimized for screens' }
    ],
    'Monospace & Technical': [
      { name: 'Fira Code', class: 'font-fira-code', description: 'Programming ligatures' },
      { name: 'JetBrains Mono', class: 'font-jetbrains', description: 'Developer-focused monospace' },
      { name: 'Courier New', class: 'font-courier', description: 'Classic typewriter font' },
      { name: 'Monaco', class: 'font-monaco', description: 'Apple\'s monospace standard' }
    ]
  };

  // Font sizes for different elements
  const fontSizes = {
    'Extra Small': 'text-xs',
    'Small': 'text-sm',
    'Base': 'text-base',
    'Large': 'text-lg',
    'Extra Large': 'text-xl',
    'Double Large': 'text-2xl',
    'Triple Large': 'text-3xl',
    'Quadruple Large': 'text-4xl',
    'Massive': 'text-5xl'
  };

  // Font weights
  const fontWeights = {
    'Thin': 'font-thin',
    'Light': 'font-light',
    'Normal': 'font-normal',
    'Medium': 'font-medium',
    'Semi Bold': 'font-semibold',
    'Bold': 'font-bold',
    'Extra Bold': 'font-extrabold',
    'Black': 'font-black'
  };

  // Letter spacing options
  const letterSpacings = {
    'Tight': 'tracking-tight',
    'Normal': 'tracking-normal',
    'Wide': 'tracking-wide',
    'Wider': 'tracking-wider',
    'Widest': 'tracking-widest'
  };

  // Line height options
  const lineHeights = {
    'Tight': 'leading-tight',
    'Snug': 'leading-snug',
    'Normal': 'leading-normal',
    'Relaxed': 'leading-relaxed',
    'Loose': 'leading-loose'
  };

  // Update font settings and notify parent
  const updateFontSetting = (key, value) => {
    const newSettings = { ...fontSettings, [key]: value };
    setFontSettings(newSettings);
    if (onFontChange) {
      onFontChange(newSettings);
    }
  };

  // Preset combinations for quick selection
  const fontPresets = [
    {
      name: 'Modern Professional',
      settings: {
        headerFont: 'Montserrat',
        bodyFont: 'Inter',
        headerSize: 'text-3xl',
        bodySize: 'text-base',
        headerWeight: 'font-bold',
        bodyWeight: 'font-normal',
        letterSpacing: 'tracking-normal',
        lineHeight: 'leading-relaxed'
      }
    },
    {
      name: 'Classic Elegant',
      settings: {
        headerFont: 'Playfair Display',
        bodyFont: 'Georgia',
        headerSize: 'text-4xl',
        bodySize: 'text-lg',
        headerWeight: 'font-bold',
        bodyWeight: 'font-normal',
        letterSpacing: 'tracking-wide',
        lineHeight: 'leading-loose'
      }
    },
    {
      name: 'Tech Startup',
      settings: {
        headerFont: 'Roboto',
        bodyFont: 'Open Sans',
        headerSize: 'text-2xl',
        bodySize: 'text-sm',
        headerWeight: 'font-semibold',
        bodyWeight: 'font-normal',
        letterSpacing: 'tracking-tight',
        lineHeight: 'leading-snug'
      }
    },
    {
      name: 'Creative Agency',
      settings: {
        headerFont: 'Oswald',
        bodyFont: 'Lato',
        headerSize: 'text-3xl',
        bodySize: 'text-base',
        headerWeight: 'font-bold',
        bodyWeight: 'font-light',
        letterSpacing: 'tracking-wider',
        lineHeight: 'leading-relaxed'
      }
    },
    {
      name: 'Legal Firm',
      settings: {
        headerFont: 'Times New Roman',
        bodyFont: 'Times New Roman',
        headerSize: 'text-2xl',
        bodySize: 'text-base',
        headerWeight: 'font-bold',
        bodyWeight: 'font-normal',
        letterSpacing: 'tracking-normal',
        lineHeight: 'leading-normal'
      }
    }
  ];

  const applyPreset = (preset) => {
    setFontSettings(preset.settings);
    if (onFontChange) {
      onFontChange(preset.settings);
    }
  };

  const getFontDisplayClass = (fontName) => {
    const allFonts = Object.values(fontFamilies).flat();
    const font = allFonts.find(f => f.name === fontName);
    return font?.class || 'font-inter';
  };

  return (
    <div className="space-y-6">
      {/* Font Presets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Quick Font Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fontPresets.map((preset, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => applyPreset(preset)}
              className="p-4 h-auto text-left hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
            >
              <div>
                <div className="font-semibold text-sm text-gray-900 mb-1">{preset.name}</div>
                <div className="text-xs text-gray-600">
                  {preset.settings.headerFont} + {preset.settings.bodyFont}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Font Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔤 Font Families</h3>
          
          {/* Header Font */}
          <div className="mb-6">
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Header Font</Label>
            <div className="space-y-3">
              {Object.entries(fontFamilies).map(([category, fonts]) => (
                <div key={category}>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">{category}</h4>
                  <div className="grid gap-2">
                    {fonts.map((font) => (
                      <Button
                        key={font.name}
                        variant={fontSettings.headerFont === font.name ? "default" : "outline"}
                        onClick={() => updateFontSetting('headerFont', font.name)}
                        className={`justify-start h-auto p-3 ${
                          fontSettings.headerFont === font.name 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-left">
                          <div className={`${getFontDisplayClass(font.name)} font-bold text-base`}>
                            {font.name}
                          </div>
                          <div className="text-xs opacity-75 mt-1">{font.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body Font */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Body Font</Label>
            <div className="space-y-2">
              {fontFamilies['Modern & Sans-Serif'].concat(fontFamilies['Professional & Corporate']).map((font) => (
                <Button
                  key={`body-${font.name}`}
                  variant={fontSettings.bodyFont === font.name ? "default" : "outline"}
                  onClick={() => updateFontSetting('bodyFont', font.name)}
                  size="sm"
                  className={`justify-start h-auto p-2 ${
                    fontSettings.bodyFont === font.name 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`${getFontDisplayClass(font.name)}`}>
                    {font.name}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Typography Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Typography Settings</h3>
          
          <div className="space-y-6">
            {/* Font Sizes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Header Size</Label>
                <select
                  value={fontSettings.headerSize}
                  onChange={(e) => updateFontSetting('headerSize', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Object.entries(fontSizes).map(([name, className]) => (
                    <option key={className} value={className}>{name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Body Size</Label>
                <select
                  value={fontSettings.bodySize}
                  onChange={(e) => updateFontSetting('bodySize', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Object.entries(fontSizes).map(([name, className]) => (
                    <option key={className} value={className}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Font Weights */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Header Weight</Label>
                <select
                  value={fontSettings.headerWeight}
                  onChange={(e) => updateFontSetting('headerWeight', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Object.entries(fontWeights).map(([name, className]) => (
                    <option key={className} value={className}>{name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Body Weight</Label>
                <select
                  value={fontSettings.bodyWeight}
                  onChange={(e) => updateFontSetting('bodyWeight', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Object.entries(fontWeights).map(([name, className]) => (
                    <option key={className} value={className}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Letter Spacing & Line Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Letter Spacing</Label>
                <select
                  value={fontSettings.letterSpacing}
                  onChange={(e) => updateFontSetting('letterSpacing', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Object.entries(letterSpacings).map(([name, className]) => (
                    <option key={className} value={className}>{name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Line Height</Label>
                <select
                  value={fontSettings.lineHeight}
                  onChange={(e) => updateFontSetting('lineHeight', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Object.entries(lineHeights).map(([name, className]) => (
                    <option key={className} value={className}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👁️ Live Preview</h3>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-inner">
          {/* Header Preview */}
          <div className={`${getFontDisplayClass(fontSettings.headerFont)} ${fontSettings.headerSize} ${fontSettings.headerWeight} ${fontSettings.letterSpacing} mb-4`}>
            INVOICE #INV-001
          </div>
          
          {/* Body Text Preview */}
          <div className={`${getFontDisplayClass(fontSettings.bodyFont)} ${fontSettings.bodySize} ${fontSettings.bodyWeight} ${fontSettings.lineHeight} text-gray-700 mb-4`}>
            This is how your invoice body text will appear. It includes customer information, service descriptions, and other important details that make up the main content of your professional invoice.
          </div>
          
          {/* Table Preview */}
          <div className="border-t pt-4">
            <div className={`${getFontDisplayClass(fontSettings.bodyFont)} ${fontSettings.bodyWeight} text-sm`}>
              <div className="grid grid-cols-4 gap-4 py-2 border-b font-semibold">
                <div>Description</div>
                <div className="text-center">Qty</div>
                <div className="text-right">Price</div>
                <div className="text-right">Total</div>
              </div>
              <div className="grid grid-cols-4 gap-4 py-2">
                <div>Web Design Services</div>
                <div className="text-center">1</div>
                <div className="text-right">$1,500.00</div>
                <div className="text-right">$1,500.00</div>
              </div>
            </div>
          </div>
          
          {/* Total Preview */}
          <div className="mt-4 flex justify-end">
            <div className={`${getFontDisplayClass(fontSettings.headerFont)} ${fontSettings.headerWeight} text-lg`}>
              Total: $1,650.00
            </div>
          </div>
        </div>
      </Card>

      {/* Current Settings Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Current Font Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Header Font</div>
            <Badge className="mt-1 bg-blue-100 text-blue-800">{fontSettings.headerFont}</Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Body Font</div>
            <Badge className="mt-1 bg-green-100 text-green-800">{fontSettings.bodyFont}</Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Header Size</div>
            <Badge className="mt-1 bg-purple-100 text-purple-800">{fontSettings.headerSize}</Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Body Size</div>
            <Badge className="mt-1 bg-orange-100 text-orange-800">{fontSettings.bodySize}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FontCustomizer;
