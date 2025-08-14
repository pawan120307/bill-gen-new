from fastapi import FastAPI, HTTPException, APIRouter, UploadFile, File, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import logging
import jwt
import bcrypt
import re
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal
import asyncio
import json
from enum import Enum
import speech_recognition as sr
from io import BytesIO
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 InvoiceForge API started successfully!")
    yield
    # Shutdown
    client.close()
    logger.info("🔒 InvoiceForge API shut down successfully!")

# Create the main app without a prefix
app = FastAPI(
    title="InvoiceForge API", 
    description="AI-Powered Invoice Generator",
    lifespan=lifespan
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models for InvoiceForge

class BusinessInfo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BusinessInfoCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: str
    city: str
    state: str
    zip_code: str
    business_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: str
    city: str
    state: str
    zip_code: str
    business_name: Optional[str] = None

class InvoiceItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total: float

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    customer_id: str
    business_id: str
    issue_date: date
    due_date: date
    items: List[InvoiceItem]
    subtotal: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None
    status: str = "draft"  # draft, sent, paid, overdue
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ai_generated: bool = False

class InvoiceCreate(BaseModel):
    customer_id: str
    business_id: str
    due_date: date
    items: List[InvoiceItem]
    tax_rate: float = 0.10
    notes: Optional[str] = None
    ai_generated: bool = False

class AIInvoiceRequest(BaseModel):
    voice_input: Optional[str] = None
    text_input: Optional[str] = None
    customer_name: str
    business_id: str

# Authentication Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    password_hash: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    business_ids: List[str] = []

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    business_ids: List[str] = []

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

# AI Response Models
class AIResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message: str
    suggestions: List[str] = []
    invoice_data: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Enhanced AI Models
class VoiceToTextRequest(BaseModel):
    language: str = "en-US"  # Default to English US
    customer_name: Optional[str] = None
    business_id: Optional[str] = None

class AIVoiceResponse(BaseModel):
    transcript: str
    confidence: float
    language_detected: str
    invoice_suggestions: List[str]
    structured_data: Optional[Dict[str, Any]] = None

# Helper Functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return User(**user)

def detect_language(text: str) -> str:
    """Detect language from text (simplified)"""
    hindi_chars = "अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ"
    if any(char in text for char in hindi_chars):
        return "hi-IN"
    return "en-US"

def extract_invoice_info_from_text(text: str, language: str = "en-US") -> Dict[str, Any]:
    """Extract invoice information from voice/text input using enhanced AI-like processing"""
    
    extracted_data = {
        "items": [],
        "customer_info": {},
        "amounts": [],
        "services": [],
        "customer_name": ""
    }
    
    import re
    
    # Enhanced amount patterns for multiple languages
    amount_patterns = [
        r'\$([\d,]+\.?\d*)',  # $500, $1,000.50
        r'([\d,]+) dollars?',  # 500 dollars
        r'([\d,]+) rupees?',   # 500 rupees
        r'([\d,]+) डॉलर',      # Hindi: 500 डॉलर
        r'([\d,]+) रुपए',       # Hindi: 500 रुपए
        r'([\d,]+) रुपये',      # Hindi: 500 रुपये
        r'(\d+) सौ',           # Hindi: 5 सौ (500)
        r'(\d+) हज़ार',         # Hindi: 1 हज़ार (1000)
        r'(\d+) हजार',         # Hindi: 1 हजार (1000)
        # Devanagari numbers
        r'([०-९,]+) डॉलर',
        r'([०-९,]+) रुपए',
    ]
    
    # Convert Devanagari numbers to Arabic
    devanagari_to_arabic = {
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    }
    
    def convert_devanagari_to_arabic(text):
        for dev, arab in devanagari_to_arabic.items():
            text = text.replace(dev, arab)
        return text
    
    # Extract amounts
    for pattern in amount_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            # Convert Devanagari numbers if present
            match = convert_devanagari_to_arabic(str(match))
            try:
                amount = float(match.replace(',', '')) if match else 0
                # Handle special Hindi number words
                if 'सौ' in text and amount < 100:
                    amount *= 100
                elif 'हज़ार' in text or 'हजार' in text:
                    if amount < 100:
                        amount *= 1000
                
                if amount > 0:
                    extracted_data["amounts"].append(amount)
            except ValueError:
                continue
    
    # Enhanced service keywords with more Hindi terms
    service_keywords = {
        "en-US": [
            "web design", "website", "ui/ux", "consulting", "development",
            "programming", "design", "marketing", "seo", "maintenance",
            "software", "app", "application", "mobile app", "e-commerce",
            "logo design", "graphic design", "content writing", "translation"
        ],
        "hi-IN": [
            "वेब डिज़ाइन", "वेबसाइट", "वेब साइट", "परामर्श", "सलाह",
            "विकास", "डिज़ाइन", "डिजाइन", "प्रोग्रामिंग", "सॉफ्टवेयर",
            "एप्लिकेशन", "ऐप", "मोबाइल ऐप", "ई-कॉमर्स", "लोगो डिज़ाइन",
            "ग्राफिक डिज़ाइन", "कंटेंट राइटिंग", "अनुवाद", "मार्केटिंग",
            "एसईओ", "रखरखाव", "मेंटेनेंस", "सेवा", "काम", "प्रोजेक्ट"
        ]
    }
    
    # Extract customer name patterns - improved for better name recognition
    name_patterns = {
        "en-US": [
            # Pattern for "create invoice for [Name]" - prioritizing this pattern
            r'(?:create|make)\s+(?:a\s+)?invoice\s+for\s+([A-Za-z][A-Za-z\s]*?)\s+for\s+',
            r'(?:create|make)\s+(?:a\s+)?invoice\s+for\s+([A-Za-z][A-Za-z\s]*?)\s+(?:web|design|consulting|project|software|development|service)',
            r'(?:create|make)\s+(?:a\s+)?invoice\s+for\s+([A-Za-z][A-Za-z\s]*?)\s+\$',
            r'(?:create|make)\s+(?:a\s+)?invoice\s+for\s+([A-Za-z][A-Za-z\s]*?)\s+(?:[0-9])',
            # More general patterns
            r'for\s+([A-Za-z][A-Za-z\s]*?)\s+for\s+',
            r'for\s+([A-Za-z][A-Za-z\s]*?)\s+(?:web|design|consulting|project|software|development|service)',
            r'for\s+([A-Za-z][A-Za-z\s]*?)\s+\$',
            r'for\s+([A-Za-z][A-Za-z\s]*?)\s+(?:[0-9])',
            r'invoice\s+for\s+([A-Za-z][A-Za-z\s]*?)\s+(?:,|\.|$|web|design|consulting|project|software|development|\$|[0-9])',
            r'client\s+([A-Za-z][A-Za-z\s]*?)\s+(?:,|\.|$|web|design|consulting|project|software|development|\$|[0-9])',
            r'customer\s+([A-Za-z][A-Za-z\s]*?)\s+(?:,|\.|$|web|design|consulting|project|software|development|\$|[0-9])'
        ],
        "hi-IN": [
            r'([अ-ह\s]+?) के लिए',
            r'ग्राहक ([अ-ह\s]+?)(?:,|\.|$)',
            r'क्लाइंट ([अ-ह\s]+?)(?:,|\.|$)',
            # English names in Hindi context with improved patterns
            r'([A-Za-z][A-Za-z\s]*?) के लिए\s+(?:वेब|डिज़ाइन|सॉफ्टवेयर|विकास|सेवा)',
            r'([A-Za-z][A-Za-z\s]*?) का चालान',
            r'([A-Za-z][A-Za-z\s]*?) के लिए\s+(?:[0-9]|\$)'
        ]
    }
    
    # Extract customer names
    name_patterns_list = name_patterns.get(language, name_patterns["en-US"])
    for pattern in name_patterns_list:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            extracted_data["customer_name"] = matches[0].strip()
            break
    
    # Extract services
    keywords = service_keywords.get(language, service_keywords["en-US"])
    for keyword in keywords:
        if keyword.lower() in text.lower():
            extracted_data["services"].append(keyword)
    
    # Fallback: if no specific services found, try to extract general service descriptions
    if not extracted_data["services"]:
        if language == "hi-IN":
            # Look for general service indicators in Hindi
            general_patterns = [r'(.*?) की सेवा', r'(.*?) का काम', r'(.*?) प्रोजेक्ट']
            for pattern in general_patterns:
                matches = re.findall(pattern, text)
                if matches:
                    extracted_data["services"].extend(matches[:2])  # Limit to 2 services
        else:
            # Look for service patterns in English
            general_patterns = [r'(\w+\s*\w*) service', r'(\w+\s*\w*) work', r'(\w+\s*\w*) project']
            for pattern in general_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    extracted_data["services"].extend([match.strip() for match in matches[:2]])
    
    # Create items from extracted info
    if extracted_data["services"] and extracted_data["amounts"]:
        for i, service in enumerate(extracted_data["services"][:len(extracted_data["amounts"])]):
            amount = extracted_data["amounts"][i] if i < len(extracted_data["amounts"]) else extracted_data["amounts"][0]
            extracted_data["items"].append({
                "description": service.title(),
                "quantity": 1,
                "unit_price": amount,
                "total": amount
            })
    elif extracted_data["services"] and not extracted_data["amounts"]:
        # If services found but no amounts, create items with default pricing
        default_price = 500.0
        for service in extracted_data["services"][:3]:  # Limit to 3 services
            extracted_data["items"].append({
                "description": service.title(),
                "quantity": 1,
                "unit_price": default_price,
                "total": default_price
            })
    elif not extracted_data["services"] and extracted_data["amounts"]:
        # If amounts found but no services, create generic service items
        for amount in extracted_data["amounts"][:3]:  # Limit to 3 items
            service_name = "Professional Services" if language == "en-US" else "व्यावसायिक सेवा"
            extracted_data["items"].append({
                "description": service_name,
                "quantity": 1,
                "unit_price": amount,
                "total": amount
            })
    
    return extracted_data

# API Routes

@api_router.get("/")
async def root():
    return {"message": "InvoiceForge API - AI-Powered Invoice Generator"}

# Authentication Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Create user
    user_dict = user_data.dict()
    user_dict["password_hash"] = hash_password(user_data.password)
    del user_dict["password"]
    
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    
    # Create access token
    access_token_expires = timedelta(hours=JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={"sub": user_obj.id}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user_obj.id,
        name=user_obj.name,
        email=user_obj.email,
        is_active=user_obj.is_active,
        created_at=user_obj.created_at,
        business_ids=user_obj.business_ids
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_EXPIRATION_HOURS * 3600,
        user=user_response
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    
    # Find user
    user_data = await db.users.find_one({"email": credentials.email})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = User(**user_data)
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token_expires = timedelta(hours=JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=datetime.utcnow(),
        business_ids=user.business_ids
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_EXPIRATION_HOURS * 3600,
        user=user_response
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        business_ids=current_user.business_ids
    )

# Business Profile Routes (MUST come before parameterized routes)
@api_router.get("/business/profile")
async def get_business_profile(current_user: User = Depends(get_current_user)):
    """Get current user's business profile"""
    profile = await db.business_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    return profile

@api_router.post("/business/profile")
async def save_business_profile(profile_data: dict, current_user: User = Depends(get_current_user)):
    """Save or update business profile"""
    try:
        profile_data["user_id"] = current_user.id
        profile_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Check if profile exists
        existing_profile = await db.business_profiles.find_one({"user_id": current_user.id})
        
        if existing_profile:
            # Update existing profile
            await db.business_profiles.update_one(
                {"user_id": current_user.id},
                {"$set": profile_data}
            )
        else:
            # Create new profile
            profile_data["created_at"] = datetime.utcnow().isoformat()
            await db.business_profiles.insert_one(profile_data)
        
        # Return a clean response without ObjectId
        response_data = profile_data.copy()
        if "_id" in response_data:
            del response_data["_id"]
        
        return {"message": "Business profile saved successfully", "data": response_data}
    except Exception as e:
        print(f"Error saving business profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving business profile: {str(e)}"
        )

@api_router.post("/business/generate-template")
async def generate_business_template(current_user: User = Depends(get_current_user)):
    """Generate a custom business template based on user's business profile"""
    # Get user's business profile
    profile = await db.business_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(
            status_code=404, 
            detail="Business profile not found. Please complete your business profile first."
        )
    
    # Generate template based on profile
    template_id = f"custom_{current_user.id}_{int(datetime.utcnow().timestamp())}"
    
    # Determine template style based on business data
    template_style = "professional"
    template_color = profile.get("brand_color", "#3B82F6")
    
    # Convert hex to color name for template system
    color_mapping = {
        "#3B82F6": "blue",
        "#8B5CF6": "purple", 
        "#10B981": "green",
        "#EF4444": "red",
        "#F59E0B": "orange",
        "#6366F1": "indigo",
        "#EC4899": "pink",
        "#14B8A6": "teal"
    }
    
    template_color_name = color_mapping.get(template_color, "blue")
    
    # Create custom template
    custom_template = {
        "id": template_id,
        "name": f"{profile.get('company_name', 'Custom')} Business Template",
        "category": "custom",
        "description": f"Custom template generated for {profile.get('company_name', 'your business')} with your branding",
        "color": template_color_name,
        "brand_color": template_color,
        "logo_url": profile.get("logo_url"),
        "signature_url": profile.get("signature_url"),
        "business_data": {
            "company_name": profile.get("company_name", ""),
            "email": profile.get("email", ""),
            "phone": profile.get("phone", ""),
            "address": profile.get("address", ""),
            "city": profile.get("city", ""),
            "state": profile.get("state", ""),
            "zip_code": profile.get("zip_code", ""),
            "country": profile.get("country", ""),
            "website": profile.get("website", ""),
            "tax_id": profile.get("tax_id", "")
        },
        "features": [
            "Custom Branding",
            "Your Logo Included",
            "Brand Colors",
            "Business Information"
        ],
        "premium": False,
        "corners": "minimal",
        "style": "business",
        "user_id": current_user.id,
        "created_at": datetime.utcnow().isoformat(),
        "is_generated": True
    }
    
    # Add signature if available
    if profile.get("signature_url"):
        custom_template["features"].append("Digital Signature")
    
    # Save the custom template (convert datetime for MongoDB)
    template_for_db = custom_template.copy()
    
    try:
        result = await db.custom_templates.insert_one(template_for_db)
        # Add the generated ObjectId to the response template as a string
        custom_template["_id"] = str(result.inserted_id)
        
        return {
            "message": "Business template generated successfully!",
            "template": custom_template,
            "success": True
        }
    except Exception as e:
        print(f"Error saving custom template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating template: {str(e)}"
        )

@api_router.get("/business/custom-templates")
async def get_custom_templates(current_user: User = Depends(get_current_user)):
    """Get user's custom generated templates"""
    templates = await db.custom_templates.find({"user_id": current_user.id}).to_list(100)
    # Convert ObjectId to string for each template
    for template in templates:
        if "_id" in template:
            template["_id"] = str(template["_id"])
    return {"templates": templates}

@api_router.get("/business/templates")
async def get_business_templates(current_user: User = Depends(get_current_user)):
    """Get all business templates including custom ones"""
    print(f"DEBUG: Getting templates for user {current_user.id}")
    
    # Get custom templates
    custom_templates = await db.custom_templates.find({"user_id": current_user.id}).to_list(100)
    print(f"DEBUG: Found {len(custom_templates)} custom templates")
    
    # Convert ObjectId to string for each custom template
    for template in custom_templates:
        if "_id" in template:
            template["_id"] = str(template["_id"])
        print(f"DEBUG: Template: {template.get('name', 'Unknown')}")
    
    # Default template options
    default_templates = [
        {
            "id": "modern-blue",
            "name": "Modern Blue",
            "category": "professional",
            "description": "Clean and modern design with blue accent colors",
            "color": "blue",
            "brand_color": "#3B82F6",
            "features": ["Modern Design", "Professional Layout", "Blue Theme"],
            "premium": False,
            "corners": "rounded",
            "style": "modern"
        },
        {
            "id": "creative-green",
            "name": "Creative Green",
            "category": "creative",
            "description": "Eye-catching design perfect for creative businesses",
            "color": "green",
            "brand_color": "#10B981",
            "features": ["Creative Design", "Green Theme", "Eye-catching Layout"],
            "premium": False,
            "corners": "rounded",
            "style": "creative"
        },
        {
            "id": "professional-blue",
            "name": "Professional Blue",
            "category": "business",
            "description": "Traditional professional template for business use",
            "color": "blue",
            "brand_color": "#1E40AF",
            "features": ["Professional", "Traditional Layout", "Business Focused"],
            "premium": False,
            "corners": "minimal",
            "style": "professional"
        },
        {
            "id": "elegant-purple",
            "name": "Elegant Purple",
            "category": "premium",
            "description": "Sophisticated design with purple accents",
            "color": "purple",
            "brand_color": "#8B5CF6",
            "features": ["Elegant Design", "Purple Theme", "Sophisticated"],
            "premium": True,
            "corners": "rounded",
            "style": "elegant"
        },
        {
            "id": "minimal-gray",
            "name": "Minimal Gray",
            "category": "minimal",
            "description": "Clean minimal design with gray tones",
            "color": "gray",
            "brand_color": "#6B7280",
            "features": ["Minimal Design", "Clean Layout", "Gray Theme"],
            "premium": False,
            "corners": "minimal",
            "style": "minimal"
        },
        {
            "id": "classic-black",
            "name": "Classic Black",
            "category": "classic",
            "description": "Timeless black and white professional design",
            "color": "black",
            "brand_color": "#111827",
            "features": ["Classic Design", "Black & White", "Timeless"],
            "premium": False,
            "corners": "minimal",
            "style": "classic"
        }
    ]
    
    return {
        "templates": {
            "custom": custom_templates,
            "default": default_templates
        },
        "total_custom": len(custom_templates),
        "total_default": len(default_templates)
    }

# Business Information Routes (Generic routes MUST come after specific ones)
@api_router.post("/business", response_model=BusinessInfo)
async def create_business(business: BusinessInfoCreate):
    business_dict = business.dict()
    business_obj = BusinessInfo(**business_dict)
    await db.businesses.insert_one(business_obj.dict())
    return business_obj

@api_router.get("/business", response_model=List[BusinessInfo])
async def get_businesses():
    businesses = await db.businesses.find().to_list(1000)
    return [BusinessInfo(**business) for business in businesses]

@api_router.get("/business/{business_id}", response_model=BusinessInfo)
async def get_business(business_id: str):
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return BusinessInfo(**business)


# Customer Routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    customer_dict = customer.dict()
    customer_obj = Customer(**customer_dict)
    await db.customers.insert_one(customer_obj.dict())
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find().to_list(1000)
    return [Customer(**customer) for customer in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

# Invoice Routes
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate):
    # Generate invoice number
    invoice_count = await db.invoices.count_documents({})
    invoice_number = f"INV-{str(invoice_count + 1).zfill(3)}"
    
    # Calculate totals
    subtotal = sum(item.total for item in invoice_data.items)
    tax_amount = subtotal * invoice_data.tax_rate
    total_amount = subtotal + tax_amount
    
    invoice_dict = invoice_data.dict()
    invoice_dict.update({
        "invoice_number": invoice_number,
        "issue_date": date.today(),
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total_amount": total_amount
    })
    
    invoice_obj = Invoice(**invoice_dict)
    
    # Convert invoice object to dict with proper serialization
    invoice_data = invoice_obj.model_dump()
    # Convert date objects to ISO format strings for MongoDB
    if 'issue_date' in invoice_data:
        invoice_data['issue_date'] = invoice_data['issue_date'].isoformat()
    if 'due_date' in invoice_data:
        invoice_data['due_date'] = invoice_data['due_date'].isoformat()
    
    await db.invoices.insert_one(invoice_data)
    return invoice_obj

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    invoices = await db.invoices.find().sort("created_at", -1).to_list(1000)
    return [Invoice(**invoice) for invoice in invoices]

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return Invoice(**invoice)

@api_router.put("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: str):
    result = await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice status updated successfully"}

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    """Delete a specific invoice"""
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted successfully"}

@api_router.delete("/invoices")
async def delete_all_invoices(current_user: User = Depends(get_current_user)):
    """Delete all invoices (bulk delete)"""
    result = await db.invoices.delete_many({})
    return {
        "message": f"All invoices deleted successfully",
        "deleted_count": result.deleted_count
    }

@api_router.put("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, invoice_data: InvoiceCreate, current_user: User = Depends(get_current_user)):
    """Update an existing invoice"""
    # Calculate totals
    subtotal = sum(item.total for item in invoice_data.items)
    tax_amount = subtotal * invoice_data.tax_rate
    total_amount = subtotal + tax_amount
    
    update_data = invoice_data.dict()
    update_data.update({
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "updated_at": datetime.utcnow()
    })
    
    # Convert date objects to ISO format strings for MongoDB
    if 'due_date' in update_data:
        update_data['due_date'] = update_data['due_date'].isoformat() if isinstance(update_data['due_date'], date) else update_data['due_date']
    
    result = await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Fetch and return updated invoice
    updated_invoice = await db.invoices.find_one({"id": invoice_id})
    return Invoice(**updated_invoice)

# AI Features Routes
@api_router.post("/ai/assist", response_model=AIResponse)
async def ai_assistant(request: AIInvoiceRequest):
    """AI-powered invoice creation assistant"""
    
    # Simulate AI processing (In real implementation, integrate with OpenAI/Claude)
    input_text = request.voice_input or request.text_input or ""
    
    # Basic AI simulation with Hindi support
    suggestions = []
    invoice_data = None
    
    # English keywords
    if any(keyword in input_text.lower() for keyword in ["web design", "website", "ui/ux"]):
        suggestions = [
            "Web Design Services - $500",
            "UI/UX Design - $750", 
            "Website Development - $1200"
        ]
        invoice_data = {
            "items": [
                {
                    "description": "Web Design Services",
                    "quantity": 1,
                    "unit_price": 500.0,
                    "total": 500.0
                }
            ]
        }
    elif any(keyword in input_text.lower() for keyword in ["consulting", "परामर्श", "सलाह"]):
        suggestions = [
            "Business Consulting - $150/hour",
            "Strategy Session - $200/hour",
            "Project Management - $100/hour"
        ]
    # Hindi keywords
    elif any(keyword in input_text for keyword in ["वेब डिज़ाइन", "वेबसाइट", "डिज़ाइन"]):
        suggestions = [
            "वेब डिज़ाइन सेवा - $500",
            "UI/UX डिज़ाइन - $750", 
            "वेबसाइट विकास - $1200"
        ]
        invoice_data = {
            "items": [
                {
                    "description": "Web Design Services / वेब डिज़ाइन सेवा",
                    "quantity": 1,
                    "unit_price": 500.0,
                    "total": 500.0
                }
            ]
        }
    elif any(keyword in input_text for keyword in ["सॉफ्टवेयर", "प्रोग्रामिंग", "एप्लिकेशन"]):
        suggestions = [
            "Software Development - $100/hour",
            "Mobile App Development - $150/hour",
            "Custom Application - $2000"
        ]
    else:
        suggestions = [
            "Professional Services - $100/hour",
            "Consultation - $150/hour",
            "Custom Service - TBD"
        ]
    
    # Detect language and provide appropriate response
    is_hindi = any(char in input_text for char in "अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ")
    
    if is_hindi:
        message = f"मैंने आपका अनुरोध का विश्लेषण किया है: '{input_text}'। यहाँ {request.customer_name} के लिए चालान के कुछ सुझाव हैं।"
    else:
        message = f"I've analyzed your request: '{input_text}'. Here are some suggestions for your invoice to {request.customer_name}."
    
    response = AIResponse(
        message=message,
        suggestions=suggestions,
        invoice_data=invoice_data
    )
    
    # Store AI interaction
    await db.ai_interactions.insert_one(response.dict())
    
    return response

@api_router.post("/ai/voice-to-invoice", response_model=AIResponse)
async def voice_to_invoice(request: AIInvoiceRequest):
    """Convert voice input to structured invoice data"""
    
    voice_text = request.voice_input or ""
    
    if not voice_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice input is required"
        )
    
    # Detect language
    detected_language = detect_language(voice_text)
    
    # Extract invoice information using AI-like processing
    extracted_info = extract_invoice_info_from_text(voice_text, detected_language)
    
    # Generate suggestions based on extracted info
    suggestions = []
    if extracted_info["services"]:
        suggestions.extend([f"Service: {service}" for service in extracted_info["services"]])
    if extracted_info["amounts"]:
        suggestions.extend([f"Amount: ${amount}" for amount in extracted_info["amounts"]])
    
    # Default suggestions if nothing extracted
    if not suggestions:
        if detected_language == "hi-IN":
            suggestions = [
                "आवाज़ से सेवा विवरण निकाला गया",
                "अनुमानित मूल्य: $500", 
                "ग्राहक: " + request.customer_name
            ]
        else:
            suggestions = [
                "Extracted service description from voice",
                "Estimated price: $500",
                "Customer: " + request.customer_name
            ]
    
    # Create invoice data
    invoice_data = {
        "customer_name": request.customer_name,
        "items": extracted_info["items"] if extracted_info["items"] else [
            {
                "description": "Service based on voice input",
                "quantity": 1,
                "unit_price": 500.0,
                "total": 500.0
            }
        ],
        "language_detected": detected_language,
        "original_text": voice_text
    }
    
    # Generate response message
    if detected_language == "hi-IN":
        message = f"आपका आवाज़ इनपुट प्रोसेस किया गया: '{voice_text[:50]}...'। चालान संरचना में बदला जा रहा है।"
    else:
        message = f"Voice input processed: '{voice_text[:50]}...'. Converting to invoice structure."
    
    ai_response = AIResponse(
        message=message,
        suggestions=suggestions,
        invoice_data=invoice_data
    )
    
    # Store AI interaction
    await db.ai_interactions.insert_one(ai_response.dict())
    return ai_response

@api_router.post("/ai/voice-file-to-text", response_model=AIVoiceResponse)
async def voice_file_to_text(audio_file: UploadFile = File(...), language: str = "en-US"):
    """Convert uploaded audio file to text and extract invoice data"""
    
    if not audio_file.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file"
        )
    
    try:
        # Read audio file
        audio_data = await audio_file.read()
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        # Initialize speech recognition
        recognizer = sr.Recognizer()
        
        try:
            with sr.AudioFile(temp_file_path) as source:
                audio = recognizer.record(source)
                
            # Perform speech recognition
            if language.startswith('hi'):
                transcript = recognizer.recognize_google(audio, language='hi-IN')
                language_detected = "hi-IN"
            else:
                transcript = recognizer.recognize_google(audio, language='en-US')
                language_detected = "en-US"
                
            confidence = 0.85  # Mock confidence score
            
        except sr.UnknownValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not understand audio"
            )
        except sr.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Speech recognition service error: {str(e)}"
            )
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
        
        # Extract invoice information
        extracted_info = extract_invoice_info_from_text(transcript, language_detected)
        
        # Generate suggestions
        suggestions = []
        if extracted_info["services"]:
            suggestions.extend([f"Detected service: {service}" for service in extracted_info["services"]])
        if extracted_info["amounts"]:
            suggestions.extend([f"Detected amount: ${amount}" for amount in extracted_info["amounts"]])
        
        if not suggestions:
            suggestions = ["Audio processed successfully", "Ready for manual review"]
        
        response = AIVoiceResponse(
            transcript=transcript,
            confidence=confidence,
            language_detected=language_detected,
            invoice_suggestions=suggestions,
            structured_data=extracted_info
        )
        
        # Store interaction
        await db.ai_interactions.insert_one({
            "id": str(uuid.uuid4()),
            "type": "voice_file_processing",
            "transcript": transcript,
            "language": language_detected,
            "confidence": confidence,
            "created_at": datetime.utcnow()
        })
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing audio file: {str(e)}"
        )

@api_router.post("/ai/enhanced-voice-processing")
async def enhanced_voice_processing(request: AIInvoiceRequest):
    """Enhanced voice processing with template selection and smart extraction"""
    
    voice_text = request.voice_input or ""
    if not voice_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice input is required"
        )
    
    # Detect language
    detected_language = detect_language(voice_text)
    
    # Extract comprehensive information
    extracted_info = extract_invoice_info_from_text(voice_text, detected_language)
    
    # Smart template suggestions based on content
    template_suggestions = []
    if any(service in voice_text.lower() for service in ["web", "design", "development"]):
        template_suggestions = ["modern-blue", "creative-green"]
    elif any(service in voice_text.lower() for service in ["consulting", "business", "strategy"]):
        template_suggestions = ["professional-blue", "elegant-purple"]
    else:
        template_suggestions = ["minimal-gray", "classic-black"]
    
    # Enhanced suggestions
    suggestions = []
    
    if detected_language == "hi-IN":
        suggestions = [
            "✅ भाषा पहचानी गई: हिंदी",
            f"📝 सेवाएं मिली: {len(extracted_info['services'])}",
            f"💰 मूल्य मिले: {len(extracted_info['amounts'])}",
            "🎨 टेम्प्लेट सुझाव तैयार"
        ]
    else:
        suggestions = [
            "✅ Language detected: English",
            f"📝 Services found: {len(extracted_info['services'])}",
            f"💰 Amounts found: {len(extracted_info['amounts'])}",
            "🎨 Template suggestions ready"
        ]
    
    # Enhanced invoice data with template suggestions
    # Use extracted customer name from voice input, fallback to request customer name
    extracted_customer_name = extracted_info.get("customer_name", "").strip()
    final_customer_name = extracted_customer_name if extracted_customer_name else request.customer_name
    
    enhanced_data = {
        "customer_name": final_customer_name,
        "customer_email": "",
        "customer_address": "",
        "customer_city": "",
        "customer_state": "",
        "items": extracted_info["items"],
        "language_detected": detected_language,
        "original_text": voice_text,
        "confidence_score": 0.87,
        "template_suggestions": template_suggestions,
        "extracted_services": extracted_info["services"],
        "extracted_amounts": extracted_info["amounts"]
    }
    
    # Generate contextual message
    if detected_language == "hi-IN":
        message = f"🤖 AI ने आपका अनुरोध समझा: {len(extracted_info['services'])} सेवाएं और {len(extracted_info['amounts'])} मूल्य मिले। चालान तैयार करने के लिए तैयार!"
    else:
        message = f"🤖 AI understood your request: Found {len(extracted_info['services'])} services and {len(extracted_info['amounts'])} amounts. Ready to create your invoice!"
    
    response = AIResponse(
        message=message,
        suggestions=suggestions,
        invoice_data=enhanced_data
    )
    
    await db.ai_interactions.insert_one(response.dict())
    return response

@api_router.get("/ai/suggestions/{customer_id}")
async def get_ai_suggestions(customer_id: str):
    """Get AI-powered suggestions based on customer history"""
    
    # Get customer's invoice history
    customer_invoices = await db.invoices.find({"customer_id": customer_id}).to_list(100)
    
    if not customer_invoices:
        suggestions = [
            "Professional Services - $100/hour",
            "Consultation - $150/hour",
            "Project Work - $500"
        ]
    else:
        # Analyze patterns (simplified)
        common_items = []
        for invoice in customer_invoices:
            for item in invoice.get("items", []):
                common_items.append(item["description"])
        
        suggestions = list(set(common_items))[:5] if common_items else [
            "Recurring Service",
            "Maintenance Fee",
            "Support Services"
        ]
    
    return {
        "customer_id": customer_id,
        "suggestions": suggestions,
        "message": "AI-generated suggestions based on customer history"
    }

# Dashboard and Analytics Routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    
    total_invoices = await db.invoices.count_documents({})
    total_customers = await db.customers.count_documents({})
    
    # Calculate total revenue
    all_invoices = await db.invoices.find({"status": "paid"}).to_list(1000)
    total_revenue = sum(invoice.get("total_amount", 0) for invoice in all_invoices)
    
    # Recent invoices
    recent_invoices = await db.invoices.find().sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_invoices": total_invoices,
        "total_customers": total_customers,
        "total_revenue": total_revenue,
        "recent_invoices": len(recent_invoices),
        "ai_interactions": await db.ai_interactions.count_documents({})
    }

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
