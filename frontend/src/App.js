import React, { useState, useEffect } from "react";
import "./App.css";
import "./styles/decorative-corners.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import AuthModal from "./components/auth/AuthModal";
import TemplatesPage from "./components/templates/TemplatesPage";
import PricingPage from "./components/pricing/PricingPage";
import CreateInvoice from "./components/invoice/CreateInvoice";
import ContactPage from "./components/contact/ContactPage";
import FeedbackPage from "./components/feedback/FeedbackPage";
import InvoicesPage from "./components/invoices/InvoicesPage";
import BusinessProfile from "./components/business/BusinessProfile";
import EnhancedInvoicesPage from "./components/invoices/EnhancedInvoicesPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Header Component with improved mobile navigation
const Header = ({ user, onAuthClick, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">InvoiceForge</span>
                <span className="text-xs text-gray-500 font-medium hidden lg:block">AI-Powered Invoicing</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            <a href="#features" className="nav-link group px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-50/80">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Features</span>
              </span>
            </a>
            <Link to="/templates" className="nav-link group px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-50/80">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                <span>Templates</span>
              </span>
            </Link>
            <Link to="/pricing" className="nav-link group px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-50/80">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Pricing</span>
              </span>
            </Link>
            
            {user && (
              <>
                <div className="h-6 w-px bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 mx-3"></div>
                <Link to="/create" className="nav-link group px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 rounded-lg transition-all duration-300 hover:bg-green-50/80 bg-green-50/30 border border-green-100/50">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Invoice</span>
                  </span>
                </Link>
                <Link to="/enhanced-invoices" className="nav-link group px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 rounded-lg transition-all duration-300 hover:bg-purple-50/80">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Manage</span>
                  </span>
                </Link>
                <Link to="/business-profile" className="nav-link group px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg transition-all duration-300 hover:bg-indigo-50/80">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Business Profile</span>
                  </span>
                </Link>
              </>
            )}
            
            <Link to="/contact" className="nav-link group px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-50/80">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Contact</span>
              </span>
            </Link>
          </nav>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden lg:flex items-center space-x-3 bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-indigo-50/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-blue-100/50 shadow-sm">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-gray-900 font-semibold text-sm">Welcome back!</span>
                    <span className="text-blue-600 font-medium text-xs mt-0.5">{user.name?.split(' ')[0] || 'User'}</span>
                  </div>
                </div>
                <button 
                  onClick={onLogout}
                  className="hidden lg:flex items-center space-x-2 text-gray-600 hover:text-red-600 font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-red-50 border border-gray-200 hover:border-red-200 group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onAuthClick}
                  className="hidden lg:flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm">Sign In</span>
                </button>
                <button 
                  onClick={onAuthClick}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Get Started Free</span>
                </button>
              </>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-6 space-y-4">
              {user && (
                <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-semibold text-sm">Welcome back!</span>
                    <span className="text-blue-600 font-medium text-xs">{user.name?.split(' ')[0] || 'User'}</span>
                  </div>
                </div>
              )}
              
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 p-3 rounded-lg hover:bg-blue-50 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">Features</span>
              </a>
              
              <Link to="/templates" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 p-3 rounded-lg hover:bg-blue-50 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                <span className="font-medium">Templates</span>
              </Link>
              
              <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 p-3 rounded-lg hover:bg-blue-50 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="font-medium">Pricing</span>
              </Link>
              
              {user && (
                <>
                  <div className="border-t border-gray-200 my-4"></div>
                  <Link to="/create" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 text-gray-700 hover:text-green-600 p-3 rounded-lg hover:bg-green-50 transition-all duration-200 bg-green-50/30 border border-green-100/50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">Create Invoice</span>
                  </Link>
                  <Link to="/enhanced-invoices" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 text-gray-700 hover:text-purple-600 p-3 rounded-lg hover:bg-purple-50 transition-all duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Manage Invoices</span>
                  </Link>
                  <Link to="/business-profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 text-gray-700 hover:text-indigo-600 p-3 rounded-lg hover:bg-indigo-50 transition-all duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium">Business Profile</span>
                  </Link>
                </>
              )}
              
              <div className="border-t border-gray-200 my-4"></div>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 p-3 rounded-lg hover:bg-blue-50 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Contact</span>
              </Link>
              
              {user ? (
                <button 
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center space-x-3 text-red-600 hover:text-red-700 p-3 rounded-lg hover:bg-red-50 transition-all duration-200 border border-red-200 hover:border-red-300 mt-6"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Sign Out</span>
                </button>
              ) : (
                <div className="space-y-3 mt-6">
                  <button 
                    onClick={() => { onAuthClick(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center space-x-3 text-gray-700 hover:text-gray-900 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Sign In</span>
                  </button>
                  <button 
                    onClick={() => { onAuthClick(); setIsMobileMenuOpen(false); }}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-3 rounded-xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Get Started Free</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Animated Invoice Preview Component
const AnimatedInvoicePreview = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      {/* Main Invoice Card */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white border border-gray-200 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
        
        {/* Background Image */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxvZmZpY2V8ZW58MHx8fHwxNzU1MDc0NTAwfDA&ixlib=rb-4.1.0&q=85" 
            alt="Professional workspace" 
            className="w-full h-full object-cover filter brightness-50 scale-110 hover:scale-100 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 right-4 animate-float">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          
          <div className="absolute top-8 left-4 animate-float" style={{animationDelay: '1s'}}>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg backdrop-blur-sm border border-white/30"></div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></span>
                Invoice #INV-001
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  🤖 AI Generated
                </span>
              </div>
            </div>
            
            {/* Invoice Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="font-bold text-lg">$2,500.00</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <span className="text-gray-600 font-medium">Tax (10%):</span>
                <span className="font-bold text-lg">$250.00</span>
              </div>
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <span className="text-gray-900 font-bold text-lg">Total:</span>
                  <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    $2,750.00
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
                View Invoice
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full blur-xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-24 h-16 bg-white rounded-lg shadow-lg border border-gray-200 p-3 animate-float" style={{animationDelay: '2s'}}>
        <div className="text-xs text-gray-500">Revenue</div>
        <div className="text-sm font-bold text-green-600">+15%</div>
      </div>

      <div className="absolute -right-8 top-1/4 w-20 h-20 bg-white rounded-xl shadow-lg border border-gray-200 p-3 animate-float" style={{animationDelay: '1.5s'}}>
        <div className="text-xs text-gray-500 mb-1">Invoices</div>
        <div className="text-lg font-bold text-blue-600">247</div>
      </div>
    </div>
  );
};

// Hero Section Component
const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            AI-Powered Features for 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Professional Invoicing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the future of invoice creation with advanced AI assistance, voice input, 
            and smart automation that adapts to your business needs.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Create Professional 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Invoices </span>
              with AI
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              The most advanced invoice generator with AI-powered assistance, voice input, 
              and smart auto-completion. Get paid faster with integrated payments and automated reminders.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
                <span className="flex items-center justify-center">
                  🤖 Start Creating with AI
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </span>
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300 transform hover:scale-105">
                Watch Demo
              </button>
            </div>
            
            <div className="flex items-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>AI-Powered Voice Input</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>Smart Auto-completion</span>
              </div>
            </div>
          </div>
          
          <div className="relative lg:pl-8">
            <AnimatedInvoicePreview />
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: "🤖",
      title: "AI-Powered Assistant",
      description: "Smart chatbot guide and voice input for effortless invoice creation with natural language processing",
      image: "https://images.unsplash.com/photo-1573164574511-73c773193279?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbHN8ZW58MHx8fHwxNzU1MDc0NDk1fDA&ixlib=rb-4.1.0&q=85",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "🎙️",
      title: "Voice Input Creation",
      description: "Create invoices by speaking naturally - our AI understands and structures your voice commands",
      image: "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbHN8ZW58MHx8fHwxNzU1MDc0NDk1fDA&ixlib=rb-4.1.0&q=85",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: "✨",
      title: "Smart Auto-completion",
      description: "AI-powered suggestions for client details, services, and pricing based on your patterns",
      image: "https://images.unsplash.com/photo-1562935345-5080389daccd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHw0fHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbHN8ZW58MHx8fHwxNzU1MDc0NDk1fDA&ixlib=rb-4.1.0&q=85",
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: "📝",
      title: "Drag & Drop Editor",
      description: "Intuitive visual editor with real-time preview and layer controls for perfect customization",
      image: "https://images.unsplash.com/photo-1735825764485-93a381fd5779?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxpbnZvaWNpbmd8ZW58MHx8fHwxNzU1MDc0NTA1fDA&ixlib=rb-4.1.0&q=85",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: "💳",
      title: "Payment Integration",
      description: "Stripe integration for instant payments and automated reminders with AI-optimized follow-ups",
      image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxvZmZpY2V8ZW58MHx8fHwxNzU1MDc0NTAwfDA&ixlib=rb-4.1.0&q=85",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: "🔐",
      title: "Digital Signatures",
      description: "Secure electronic signatures with password protection and AI-powered document verification",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxBSSUyMHRlY2hub2xvZ3l8ZW58MHx8fHwxNzU1MDc0NTEwfDA&ixlib=rb-4.1.0&q=85",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fadeInUp">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            AI-Powered Features for Professional Invoicing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of invoice creation with advanced AI assistance, voice input, 
            and smart automation that adapts to your business needs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 animate-fadeInUp" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-80 group-hover:opacity-70 transition-opacity duration-300`}></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center text-3xl border border-white/30 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
                  <span>Learn More</span>
                  <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section Component
const CTASection = () => {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
      
      <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 animate-fadeInUp">
          Ready to Transform Your Invoicing with AI?
        </h2>
        <p className="text-xl text-blue-100 mb-8 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
          Join thousands of businesses already using InvoiceForge to streamline their billing process.
        </p>
        <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl animate-fadeInUp" style={{animationDelay: '0.4s'}}>
          Start Creating with AI →
        </button>
      </div>
    </section>
  );
};

// Main Home Component
const Home = ({ user, onAuthClick }) => {
  const testBackendConnection = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log("✅ Backend connected:", response.data.message);
    } catch (e) {
      console.error("❌ Backend connection failed:", e);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load business profile when user logs in
  const loadBusinessProfile = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API}/business/profile`);
      setBusinessProfile(response.data);
    } catch (error) {
      console.log('No business profile found or error loading:', error);
    }
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (authToken && userData) {
      try {
        setUser(JSON.parse(userData));
        // Set axios default header for authenticated requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  // Load business profile when user changes
  useEffect(() => {
    loadBusinessProfile();
  }, [user]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Header 
          user={user} 
          onAuthClick={handleAuthClick} 
          onLogout={handleLogout} 
        />
        
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                user={user} 
                onAuthClick={handleAuthClick} 
              />
            } 
          />
          <Route 
            path="/templates" 
            element={
              <TemplatesPage 
                onTemplateSelect={handleTemplateSelect}
              />
            } 
          />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route 
            path="/invoices" 
            element={
              user ? (
                <InvoicesPage 
                  user={user}
                />
              ) : (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Please Sign In
                    </h2>
                    <p className="text-gray-600 mb-8">
                      You need to be signed in to view your invoices.
                    </p>
                    <button
                      onClick={handleAuthClick}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
                    >
                      Sign In to Continue
                    </button>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/create" 
            element={
              user ? (
                <CreateInvoice 
                  user={user} 
                  selectedTemplate={selectedTemplate}
                />
              ) : (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Please Sign In
                    </h2>
                    <p className="text-gray-600 mb-8">
                      You need to be signed in to create invoices.
                    </p>
                    <button
                      onClick={handleAuthClick}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
                    >
                      Sign In to Continue
                    </button>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/enhanced-invoices" 
            element={
              user ? (
                <EnhancedInvoicesPage 
                  user={user}
                />
              ) : (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Please Sign In
                    </h2>
                    <p className="text-gray-600 mb-8">
                      You need to be signed in to manage invoices.
                    </p>
                    <button
                      onClick={handleAuthClick}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
                    >
                      Sign In to Continue
                    </button>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/business-profile" 
            element={
              user ? (
                <BusinessProfile 
                  user={user}
                />
              ) : (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Please Sign In
                    </h2>
                    <p className="text-gray-600 mb-8">
                      You need to be signed in to manage your business profile.
                    </p>
                    <button
                      onClick={handleAuthClick}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
                    >
                      Sign In to Continue
                    </button>
                  </div>
                </div>
              )
            } 
          />
        </Routes>
        
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;