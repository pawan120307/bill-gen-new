#!/usr/bin/env python3
"""
InvoiceForge System Test & Diagnostic Script
Tests all core functionality and identifies issues
"""

import requests
import json
import time
import sys
from typing import Dict, Any

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"
API_BASE = f"{BACKEND_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(60)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_info(text: str):
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")

def test_basic_connectivity():
    """Test basic connectivity to both backend and frontend"""
    print_header("CONNECTIVITY TESTS")
    
    # Test Backend API
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Backend API: {data.get('message', 'Connected')}")
        else:
            print_error(f"Backend API: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Backend API: Connection failed - {str(e)}")
    
    # Test Frontend
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print_success("Frontend: Connected")
        else:
            print_error(f"Frontend: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Frontend: Connection failed - {str(e)}")

def test_user_authentication():
    """Test user registration and authentication"""
    print_header("AUTHENTICATION TESTS")
    
    # Test user registration
    test_user = {
        "name": "Test User",
        "email": f"test_{int(time.time())}@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/register", json=test_user, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_success("User Registration: Success")
            
            # Extract token for further tests
            token = data.get("access_token")
            if token:
                print_success("JWT Token: Generated successfully")
                
                # Test authenticated endpoint
                headers = {"Authorization": f"Bearer {token}"}
                auth_response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
                if auth_response.status_code == 200:
                    print_success("Authentication: Token validated")
                    return token
                else:
                    print_error("Authentication: Token validation failed")
            else:
                print_error("JWT Token: Not found in response")
        else:
            print_error(f"User Registration: HTTP {response.status_code}")
            if response.content:
                try:
                    error_data = response.json()
                    print_error(f"Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print_error(f"Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print_error(f"User Registration: Connection failed - {str(e)}")
    
    return None

def test_business_profile(token: str):
    """Test business profile functionality"""
    print_header("BUSINESS PROFILE TESTS")
    
    if not token:
        print_warning("Skipping business profile tests - no authentication token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test saving business profile
    test_profile = {
        "company_name": "Test Company LLC",
        "email": "contact@testcompany.com",
        "phone": "+1-555-0123",
        "address": "123 Test Street",
        "city": "Test City",
        "state": "TS",
        "zip_code": "12345",
        "country": "United States",
        "website": "https://testcompany.com",
        "tax_id": "12-3456789",
        "brand_color": "#3B82F6"
    }
    
    try:
        response = requests.post(f"{API_BASE}/business/profile", json=test_profile, headers=headers, timeout=10)
        if response.status_code == 200:
            print_success("Business Profile: Saved successfully")
        else:
            print_error(f"Business Profile Save: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Business Profile Save: Connection failed - {str(e)}")
    
    # Test retrieving business profile
    try:
        response = requests.get(f"{API_BASE}/business/profile", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_success("Business Profile: Retrieved successfully")
            
            # Test template generation
            template_response = requests.post(f"{API_BASE}/business/generate-template", headers=headers, timeout=10)
            if template_response.status_code == 200:
                template_data = template_response.json()
                print_success("Business Template: Generated successfully")
                if template_data.get("template", {}).get("_id"):
                    print_success("Template ID: Generated correctly")
                else:
                    print_warning("Template ID: Missing from response")
            else:
                print_error(f"Business Template Generation: HTTP {template_response.status_code}")
        elif response.status_code == 404:
            print_warning("Business Profile: Not found (expected if not created)")
        else:
            print_error(f"Business Profile Retrieve: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Business Profile Retrieve: Connection failed - {str(e)}")

def test_template_endpoints(token: str):
    """Test template-related endpoints"""
    print_header("TEMPLATE TESTS")
    
    if not token:
        print_warning("Skipping template tests - no authentication token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test business templates endpoint
    try:
        response = requests.get(f"{API_BASE}/business/templates", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_success("Business Templates: Retrieved successfully")
            
            templates = data.get("templates", {})
            default_templates = templates.get("default", [])
            custom_templates = templates.get("custom", [])
            
            print_info(f"Default Templates: {len(default_templates)} found")
            print_info(f"Custom Templates: {len(custom_templates)} found")
            
            if len(default_templates) >= 6:  # We added 6 default templates
                print_success("Default Templates: All templates present")
            else:
                print_warning(f"Default Templates: Expected 6, found {len(default_templates)}")
        else:
            print_error(f"Business Templates: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Business Templates: Connection failed - {str(e)}")
    
    # Test custom templates endpoint
    try:
        response = requests.get(f"{API_BASE}/business/custom-templates", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_success("Custom Templates: Retrieved successfully")
        else:
            print_error(f"Custom Templates: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Custom Templates: Connection failed - {str(e)}")

def test_ai_functionality(token: str):
    """Test AI-powered features"""
    print_header("AI FUNCTIONALITY TESTS")
    
    if not token:
        print_warning("Skipping AI tests - no authentication token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test AI voice-to-invoice
    test_voice_request = {
        "voice_input": "Create invoice for John Doe, web design services, 500 dollars",
        "customer_name": "John Doe",
        "business_id": "test-business"
    }
    
    try:
        response = requests.post(f"{API_BASE}/ai/voice-to-invoice", json=test_voice_request, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_success("AI Voice to Invoice: Working correctly")
            
            # Check if AI extracted information correctly
            invoice_data = data.get("invoice_data", {})
            items = invoice_data.get("items", [])
            if items and len(items) > 0:
                print_success("AI Data Extraction: Successfully extracted items")
                first_item = items[0]
                if "web design" in first_item.get("description", "").lower():
                    print_success("AI Service Detection: Correctly identified web design")
                if first_item.get("unit_price") == 500.0:
                    print_success("AI Price Extraction: Correctly extracted $500")
            else:
                print_warning("AI Data Extraction: No items extracted")
        else:
            print_error(f"AI Voice to Invoice: HTTP {response.status_code}")
            if response.content:
                try:
                    error_data = response.json()
                    print_error(f"Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print_error(f"Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print_error(f"AI Voice to Invoice: Connection failed - {str(e)}")
    
    # Test enhanced voice processing
    try:
        response = requests.post(f"{API_BASE}/ai/enhanced-voice-processing", json=test_voice_request, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_success("AI Enhanced Processing: Working correctly")
            
            # Check template suggestions
            invoice_data = data.get("invoice_data", {})
            template_suggestions = invoice_data.get("template_suggestions", [])
            if template_suggestions:
                print_success(f"AI Template Suggestions: Generated {len(template_suggestions)} suggestions")
            else:
                print_warning("AI Template Suggestions: No suggestions generated")
        else:
            print_error(f"AI Enhanced Processing: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"AI Enhanced Processing: Connection failed - {str(e)}")

def test_invoice_management(token: str):
    """Test invoice creation and management"""
    print_header("INVOICE MANAGEMENT TESTS")
    
    if not token:
        print_warning("Skipping invoice tests - no authentication token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test getting invoices
    try:
        response = requests.get(f"{API_BASE}/invoices", timeout=10)
        if response.status_code == 200:
            invoices = response.json()
            print_success(f"Invoice Retrieval: Found {len(invoices)} invoices")
        else:
            print_error(f"Invoice Retrieval: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Invoice Retrieval: Connection failed - {str(e)}")
    
    # Test getting customers
    try:
        response = requests.get(f"{API_BASE}/customers", timeout=10)
        if response.status_code == 200:
            customers = response.json()
            print_success(f"Customer Retrieval: Found {len(customers)} customers")
        else:
            print_error(f"Customer Retrieval: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Customer Retrieval: Connection failed - {str(e)}")

def test_dashboard_stats(token: str):
    """Test dashboard statistics"""
    print_header("DASHBOARD TESTS")
    
    try:
        response = requests.get(f"{API_BASE}/dashboard/stats", timeout=10)
        if response.status_code == 200:
            stats = response.json()
            print_success("Dashboard Stats: Retrieved successfully")
            print_info(f"Total Invoices: {stats.get('total_invoices', 0)}")
            print_info(f"Total Customers: {stats.get('total_customers', 0)}")
            print_info(f"Total Revenue: ${stats.get('total_revenue', 0)}")
            print_info(f"AI Interactions: {stats.get('ai_interactions', 0)}")
        else:
            print_error(f"Dashboard Stats: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Dashboard Stats: Connection failed - {str(e)}")

def main():
    print_header("InvoiceForge System Diagnostic & Test")
    print_info("Testing all system components...")
    
    # Run all tests
    test_basic_connectivity()
    
    # Get authentication token
    token = test_user_authentication()
    
    # Run authenticated tests
    test_business_profile(token)
    test_template_endpoints(token)
    test_ai_functionality(token)
    test_invoice_management(token)
    test_dashboard_stats(token)
    
    print_header("SYSTEM TEST COMPLETE")
    print_info("Check results above for any issues that need attention.")
    print_info(f"Frontend URL: {FRONTEND_URL}")
    print_info(f"Backend URL: {BACKEND_URL}")
    print_info(f"API Documentation: {BACKEND_URL}/docs")

if __name__ == "__main__":
    main()
