"""
Seed script for Harsh Srivastava's Grocery Shop demo account.
Run from backend-fastapi directory: python seed_demo_data.py
"""
import asyncio
import uuid
import random
from datetime import date, datetime, timedelta

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.database import Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.business_profile import BusinessProfile
from app.models.customer import Customer
from app.models.product import Product
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.expense import Expense
from app.models.payment import Payment


BYPASS_EMAIL = "harshsrivastava0315@gmail.com"
BYPASS_PASSWORD = "harsh123456789H"

PRODUCTS = [
    {"name": "Aashirvaad Atta (10kg)", "description": "Whole wheat flour", "category": "Atta & Flour", "unit": "bag", "price": 420, "cost_price": 380, "gst_rate": 0, "hsn_code": "1101", "stock_quantity": 150, "reorder_level": 30},
    {"name": "Aashirvaad Atta (5kg)", "description": "Whole wheat flour", "category": "Atta & Flour", "unit": "bag", "price": 225, "cost_price": 195, "gst_rate": 0, "hsn_code": "1101", "stock_quantity": 200, "reorder_level": 40},
    {"name": "Pillsbury Maida (1kg)", "description": "Refined wheat flour", "category": "Atta & Flour", "unit": "kg", "price": 48, "cost_price": 38, "gst_rate": 0, "hsn_code": "1101", "stock_quantity": 120, "reorder_level": 25},
    {"name": "Besan (1kg)", "description": "Gram flour", "category": "Atta & Flour", "unit": "kg", "price": 110, "cost_price": 90, "gst_rate": 0, "hsn_code": "1106", "stock_quantity": 80, "reorder_level": 20},
    {"name": "Sooji / Rava (1kg)", "description": "Semolina", "category": "Atta & Flour", "unit": "kg", "price": 55, "cost_price": 42, "gst_rate": 0, "hsn_code": "1103", "stock_quantity": 100, "reorder_level": 20},
    {"name": "Basmati Rice (5kg) - India Gate", "description": "Premium basmati rice", "category": "Rice & Dal", "unit": "bag", "price": 475, "cost_price": 410, "gst_rate": 5, "hsn_code": "1006", "stock_quantity": 120, "reorder_level": 25},
    {"name": "Basmati Rice (1kg) - Daawat", "description": "Everyday basmati", "category": "Rice & Dal", "unit": "kg", "price": 105, "cost_price": 85, "gst_rate": 5, "hsn_code": "1006", "stock_quantity": 180, "reorder_level": 30},
    {"name": "Toor Dal (1kg)", "description": "Arhar dal", "category": "Rice & Dal", "unit": "kg", "price": 155, "cost_price": 130, "gst_rate": 0, "hsn_code": "0713", "stock_quantity": 100, "reorder_level": 20},
    {"name": "Moong Dal (1kg)", "description": "Split green gram", "category": "Rice & Dal", "unit": "kg", "price": 140, "cost_price": 115, "gst_rate": 0, "hsn_code": "0713", "stock_quantity": 90, "reorder_level": 20},
    {"name": "Chana Dal (1kg)", "description": "Bengal gram split", "category": "Rice & Dal", "unit": "kg", "price": 105, "cost_price": 85, "gst_rate": 0, "hsn_code": "0713", "stock_quantity": 100, "reorder_level": 20},
    {"name": "Masoor Dal (1kg)", "description": "Red lentils", "category": "Rice & Dal", "unit": "kg", "price": 115, "cost_price": 95, "gst_rate": 0, "hsn_code": "0713", "stock_quantity": 85, "reorder_level": 20},
    {"name": "Urad Dal (1kg)", "description": "Black gram split", "category": "Rice & Dal", "unit": "kg", "price": 140, "cost_price": 115, "gst_rate": 0, "hsn_code": "0713", "stock_quantity": 75, "reorder_level": 15},
    {"name": "Rajma (1kg)", "description": "Kidney beans", "category": "Rice & Dal", "unit": "kg", "price": 165, "cost_price": 140, "gst_rate": 0, "hsn_code": "0713", "stock_quantity": 60, "reorder_level": 15},
    {"name": "Chole / Kabuli Chana (1kg)", "description": "Chickpeas", "category": "Rice & Dal", "unit": "kg", "price": 130, "cost_price": 105, "gst_rate": 0, "hsn_code": "0713", "stock_quantity": 70, "reorder_level": 15},
    {"name": "Fortune Sunflower Oil (1L)", "description": "Refined sunflower oil", "category": "Oil & Ghee", "unit": "litre", "price": 145, "cost_price": 125, "gst_rate": 5, "hsn_code": "1512", "stock_quantity": 100, "reorder_level": 20},
    {"name": "Fortune Sunflower Oil (5L)", "description": "Refined sunflower oil - family pack", "category": "Oil & Ghee", "unit": "can", "price": 680, "cost_price": 610, "gst_rate": 5, "hsn_code": "1512", "stock_quantity": 50, "reorder_level": 10},
    {"name": "Saffola Gold Oil (1L)", "description": "Blended edible oil", "category": "Oil & Ghee", "unit": "litre", "price": 195, "cost_price": 170, "gst_rate": 5, "hsn_code": "1517", "stock_quantity": 60, "reorder_level": 15},
    {"name": "Fortune Mustard Oil (1L)", "description": "Kachi ghani mustard oil", "category": "Oil & Ghee", "unit": "litre", "price": 175, "cost_price": 150, "gst_rate": 5, "hsn_code": "1514", "stock_quantity": 80, "reorder_level": 15},
    {"name": "Amul Ghee (1L)", "description": "Pure cow ghee", "category": "Oil & Ghee", "unit": "litre", "price": 580, "cost_price": 520, "gst_rate": 12, "hsn_code": "0405", "stock_quantity": 40, "reorder_level": 10},
    {"name": "Amul Ghee (500ml)", "description": "Pure cow ghee", "category": "Oil & Ghee", "unit": "pack", "price": 300, "cost_price": 265, "gst_rate": 12, "hsn_code": "0405", "stock_quantity": 60, "reorder_level": 15},
    {"name": "MDH Garam Masala (100g)", "description": "Blended spice mix", "category": "Masala & Spices", "unit": "pack", "price": 72, "cost_price": 58, "gst_rate": 5, "hsn_code": "0910", "stock_quantity": 200, "reorder_level": 40},
    {"name": "MDH Chana Masala (100g)", "description": "Chickpea curry powder", "category": "Masala & Spices", "unit": "pack", "price": 60, "cost_price": 48, "gst_rate": 5, "hsn_code": "0910", "stock_quantity": 150, "reorder_level": 30},
    {"name": "MDH Deggi Mirch (100g)", "description": "Red chilli powder (mild)", "category": "Masala & Spices", "unit": "pack", "price": 55, "cost_price": 42, "gst_rate": 5, "hsn_code": "0904", "stock_quantity": 180, "reorder_level": 35},
    {"name": "Everest Turmeric Powder (200g)", "description": "Haldi powder", "category": "Masala & Spices", "unit": "pack", "price": 60, "cost_price": 46, "gst_rate": 5, "hsn_code": "0910", "stock_quantity": 160, "reorder_level": 30},
    {"name": "Catch Jeera Powder (100g)", "description": "Cumin powder", "category": "Masala & Spices", "unit": "pack", "price": 58, "cost_price": 44, "gst_rate": 5, "hsn_code": "0910", "stock_quantity": 140, "reorder_level": 25},
    {"name": "Whole Jeera (250g)", "description": "Cumin seeds", "category": "Masala & Spices", "unit": "pack", "price": 95, "cost_price": 78, "gst_rate": 5, "hsn_code": "0910", "stock_quantity": 100, "reorder_level": 20},
    {"name": "Rai / Mustard Seeds (200g)", "description": "Mustard seeds for tadka", "category": "Masala & Spices", "unit": "pack", "price": 35, "cost_price": 25, "gst_rate": 5, "hsn_code": "1207", "stock_quantity": 130, "reorder_level": 25},
    {"name": "Lal Mirch Powder (200g)", "description": "Hot red chilli powder", "category": "Masala & Spices", "unit": "pack", "price": 70, "cost_price": 55, "gst_rate": 5, "hsn_code": "0904", "stock_quantity": 120, "reorder_level": 25},
    {"name": "Dhaniya Powder (200g)", "description": "Coriander powder", "category": "Masala & Spices", "unit": "pack", "price": 45, "cost_price": 34, "gst_rate": 5, "hsn_code": "0909", "stock_quantity": 150, "reorder_level": 30},
    {"name": "Sugar (5kg)", "description": "White crystal sugar", "category": "Sugar & Tea", "unit": "bag", "price": 225, "cost_price": 200, "gst_rate": 5, "hsn_code": "1701", "stock_quantity": 100, "reorder_level": 20},
    {"name": "Sugar (1kg)", "description": "White crystal sugar", "category": "Sugar & Tea", "unit": "kg", "price": 48, "cost_price": 42, "gst_rate": 5, "hsn_code": "1701", "stock_quantity": 200, "reorder_level": 40},
    {"name": "Tata Tea Gold (500g)", "description": "Premium leaf tea", "category": "Sugar & Tea", "unit": "pack", "price": 265, "cost_price": 230, "gst_rate": 5, "hsn_code": "0902", "stock_quantity": 80, "reorder_level": 15},
    {"name": "Tata Tea Gold (250g)", "description": "Premium leaf tea", "category": "Sugar & Tea", "unit": "pack", "price": 140, "cost_price": 120, "gst_rate": 5, "hsn_code": "0902", "stock_quantity": 100, "reorder_level": 20},
    {"name": "Bru Instant Coffee (200g)", "description": "Instant coffee powder", "category": "Sugar & Tea", "unit": "jar", "price": 375, "cost_price": 330, "gst_rate": 5, "hsn_code": "2101", "stock_quantity": 40, "reorder_level": 10},
    {"name": "Jaggery / Gur (1kg)", "description": "Organic jaggery", "category": "Sugar & Tea", "unit": "kg", "price": 80, "cost_price": 60, "gst_rate": 0, "hsn_code": "1701", "stock_quantity": 50, "reorder_level": 10},
    {"name": "Amul Butter (500g)", "description": "Pasteurized butter", "category": "Dairy", "unit": "pack", "price": 270, "cost_price": 245, "gst_rate": 12, "hsn_code": "0405", "stock_quantity": 30, "reorder_level": 8},
    {"name": "Amul Cheese (200g)", "description": "Processed cheese slices", "category": "Dairy", "unit": "pack", "price": 115, "cost_price": 98, "gst_rate": 12, "hsn_code": "0406", "stock_quantity": 40, "reorder_level": 10},
    {"name": "Amul Paneer (200g)", "description": "Fresh cottage cheese", "category": "Dairy", "unit": "pack", "price": 90, "cost_price": 78, "gst_rate": 0, "hsn_code": "0406", "stock_quantity": 25, "reorder_level": 5},
    {"name": "Haldiram's Aloo Bhujia (400g)", "description": "Classic namkeen snack", "category": "Snacks", "unit": "pack", "price": 115, "cost_price": 95, "gst_rate": 12, "hsn_code": "2106", "stock_quantity": 80, "reorder_level": 15},
    {"name": "Haldiram's Moong Dal (400g)", "description": "Crispy moong dal snack", "category": "Snacks", "unit": "pack", "price": 110, "cost_price": 92, "gst_rate": 12, "hsn_code": "2106", "stock_quantity": 70, "reorder_level": 15},
    {"name": "Parle-G Biscuit (800g)", "description": "Family pack glucose biscuit", "category": "Snacks", "unit": "pack", "price": 80, "cost_price": 68, "gst_rate": 18, "hsn_code": "1905", "stock_quantity": 100, "reorder_level": 20},
    {"name": "Britannia Marie Gold (600g)", "description": "Digestive biscuit", "category": "Snacks", "unit": "pack", "price": 95, "cost_price": 82, "gst_rate": 18, "hsn_code": "1905", "stock_quantity": 90, "reorder_level": 15},
    {"name": "Maggi Noodles (Family Pack - 8)", "description": "2-minute noodles", "category": "Snacks", "unit": "pack", "price": 104, "cost_price": 88, "gst_rate": 18, "hsn_code": "1902", "stock_quantity": 120, "reorder_level": 25},
    {"name": "Lays Classic Salted (52g x 10)", "description": "Potato chips", "category": "Snacks", "unit": "box", "price": 200, "cost_price": 170, "gst_rate": 12, "hsn_code": "2005", "stock_quantity": 50, "reorder_level": 10},
    {"name": "Frooti Mango (1L) - Pack of 6", "description": "Mango drink", "category": "Beverages", "unit": "pack", "price": 210, "cost_price": 180, "gst_rate": 12, "hsn_code": "2009", "stock_quantity": 40, "reorder_level": 10},
    {"name": "Coca-Cola (2L)", "description": "Soft drink", "category": "Beverages", "unit": "bottle", "price": 95, "cost_price": 82, "gst_rate": 28, "hsn_code": "2202", "stock_quantity": 60, "reorder_level": 15},
    {"name": "Bisleri Water (1L) - Pack of 12", "description": "Packaged drinking water", "category": "Beverages", "unit": "carton", "price": 180, "cost_price": 144, "gst_rate": 18, "hsn_code": "2201", "stock_quantity": 30, "reorder_level": 8},
    {"name": "Surf Excel (1kg)", "description": "Detergent powder", "category": "Household", "unit": "pack", "price": 165, "cost_price": 140, "gst_rate": 18, "hsn_code": "3402", "stock_quantity": 60, "reorder_level": 12},
    {"name": "Vim Dishwash Bar (300g x 3)", "description": "Dishwashing bar", "category": "Household", "unit": "pack", "price": 59, "cost_price": 48, "gst_rate": 18, "hsn_code": "3402", "stock_quantity": 80, "reorder_level": 15},
    {"name": "Dettol Soap (75g x 4)", "description": "Antiseptic bath soap", "category": "Household", "unit": "pack", "price": 210, "cost_price": 178, "gst_rate": 18, "hsn_code": "3401", "stock_quantity": 50, "reorder_level": 10},
    {"name": "Harpic Power Plus (500ml)", "description": "Toilet cleaner", "category": "Household", "unit": "bottle", "price": 105, "cost_price": 88, "gst_rate": 18, "hsn_code": "3402", "stock_quantity": 40, "reorder_level": 8},
    {"name": "Lizol Floor Cleaner (500ml)", "description": "Disinfectant floor cleaner", "category": "Household", "unit": "bottle", "price": 115, "cost_price": 96, "gst_rate": 18, "hsn_code": "3402", "stock_quantity": 35, "reorder_level": 8},
    {"name": "Colgate MaxFresh (150g)", "description": "Toothpaste", "category": "Personal Care", "unit": "tube", "price": 110, "cost_price": 90, "gst_rate": 18, "hsn_code": "3306", "stock_quantity": 70, "reorder_level": 15},
    {"name": "Head & Shoulders Shampoo (340ml)", "description": "Anti-dandruff shampoo", "category": "Personal Care", "unit": "bottle", "price": 345, "cost_price": 295, "gst_rate": 18, "hsn_code": "3305", "stock_quantity": 30, "reorder_level": 8},
    {"name": "Parachute Coconut Oil (200ml)", "description": "Pure coconut oil", "category": "Personal Care", "unit": "bottle", "price": 100, "cost_price": 82, "gst_rate": 5, "hsn_code": "1513", "stock_quantity": 50, "reorder_level": 10},
    {"name": "Kissan Tomato Ketchup (500g)", "description": "Tomato sauce", "category": "Sauces", "unit": "bottle", "price": 115, "cost_price": 95, "gst_rate": 12, "hsn_code": "2103", "stock_quantity": 50, "reorder_level": 10},
    {"name": "Smith & Jones Pasta Masala (100g)", "description": "Pasta seasoning", "category": "Sauces", "unit": "pack", "price": 40, "cost_price": 30, "gst_rate": 12, "hsn_code": "2103", "stock_quantity": 60, "reorder_level": 10},
    {"name": "Pickle - Mixed (500g)", "description": "Mother's recipe mixed pickle", "category": "Sauces", "unit": "jar", "price": 130, "cost_price": 105, "gst_rate": 12, "hsn_code": "2001", "stock_quantity": 40, "reorder_level": 8},
    {"name": "Papad - Lijjat (200g)", "description": "Urad dal papad", "category": "Sauces", "unit": "pack", "price": 55, "cost_price": 42, "gst_rate": 0, "hsn_code": "1905", "stock_quantity": 90, "reorder_level": 15},
    {"name": "Badam / Almonds (250g)", "description": "Premium California almonds", "category": "Dry Fruits", "unit": "pack", "price": 280, "cost_price": 240, "gst_rate": 5, "hsn_code": "0802", "stock_quantity": 30, "reorder_level": 8},
    {"name": "Kaju / Cashew (250g)", "description": "Whole cashew nuts", "category": "Dry Fruits", "unit": "pack", "price": 320, "cost_price": 275, "gst_rate": 5, "hsn_code": "0801", "stock_quantity": 25, "reorder_level": 5},
    {"name": "Kishmish / Raisins (250g)", "description": "Green raisins", "category": "Dry Fruits", "unit": "pack", "price": 150, "cost_price": 120, "gst_rate": 5, "hsn_code": "0806", "stock_quantity": 35, "reorder_level": 8},
]

RETAIL_CUSTOMERS = [
    {"name": "Sunita Sharma", "phone": "9876543210", "email": "sunita.sharma@gmail.com", "address": "B-12, Sector 22, Noida, UP 201301", "notes": "Regular monthly customer"},
    {"name": "Rajesh Kumar", "phone": "9876543211", "email": "rajesh.kumar@yahoo.com", "address": "45, MG Road, Ghaziabad, UP 201001", "notes": "Prefers home delivery"},
    {"name": "Priya Singh", "phone": "9876543212", "email": "priya.singh@gmail.com", "address": "H.No 78, Lajpat Nagar, New Delhi 110024", "notes": "Loyal customer since 2022"},
    {"name": "Amit Verma", "phone": "9876543213", "email": "amit.verma@gmail.com", "address": "Flat 301, Shanti Apt, Vaishali, Ghaziabad 201010", "notes": "Bulk buyer for family"},
    {"name": "Neha Agarwal", "phone": "9876543214", "email": "neha.agarwal@outlook.com", "address": "C-45, Aliganj, Lucknow, UP 226024", "notes": "Pays via UPI always"},
    {"name": "Vikram Tiwari", "phone": "9876543215", "email": None, "address": "Near Hanuman Mandir, Kanpur, UP 208001", "notes": "Walk-in customer"},
    {"name": "Anjali Mishra", "phone": "9876543216", "email": "anjali.m@gmail.com", "address": "12/A, Civil Lines, Allahabad, UP 211001", "notes": "Monthly khata customer"},
    {"name": "Deepak Pandey", "phone": "9876543217", "email": None, "address": "Gali No 4, Sahibabad, Ghaziabad 201005", "notes": "Cash payment preferred"},
    {"name": "Meena Devi", "phone": "9876543218", "email": None, "address": "Village Bisrakh, Greater Noida, UP 201306", "notes": "Weekly regular"},
    {"name": "Rohit Saxena", "phone": "9876543219", "email": "rohit.sax@gmail.com", "address": "Sector 62, Noida, UP 201309", "notes": None},
    {"name": "Kavita Jain", "phone": "9876543220", "email": "kavita.jain@gmail.com", "address": "D-Block, Karol Bagh, New Delhi 110005", "notes": "Dry fruits lover"},
    {"name": "Sanjay Gupta", "phone": "9876543221", "email": None, "address": "Kamla Nagar, Delhi 110007", "notes": "Occasional customer"},
    {"name": "Pooja Yadav", "phone": "9876543222", "email": "pooja.y@gmail.com", "address": "Indirapuram, Ghaziabad 201014", "notes": "Orders via phone call"},
    {"name": "Manoj Srivastava", "phone": "9876543223", "email": "manoj.sri@gmail.com", "address": "Gomti Nagar, Lucknow, UP 226010", "notes": "Family friend"},
    {"name": "Rekha Bhatia", "phone": "9876543224", "email": None, "address": "Rajouri Garden, New Delhi 110027", "notes": "Festival orders - sweets & dry fruits"},
    {"name": "Arun Dubey", "phone": "9876543225", "email": None, "address": "Crossing Republik, Ghaziabad 201016", "notes": "New customer"},
    {"name": "Shweta Kapoor", "phone": "9876543226", "email": "shweta.k@hotmail.com", "address": "Sector 50, Noida, UP 201301", "notes": "Health-conscious - organic products"},
    {"name": "Ramesh Chandra", "phone": "9876543227", "email": None, "address": "Old City, Agra, UP 282001", "notes": "Quarterly bulk order"},
    {"name": "Nandini Rao", "phone": "9876543228", "email": "nandini.rao@gmail.com", "address": "Vasundhara, Ghaziabad, UP 201012", "notes": "Prefers evening delivery"},
    {"name": "Suresh Patel", "phone": "9876543229", "email": None, "address": "Nehru Nagar, Kanpur, UP 208012", "notes": "Cash customer"},
    {"name": "Geeta Sharma", "phone": "9876543230", "email": "geeta.sh@gmail.com", "address": "Sector 137, Noida Expressway, UP 201305", "notes": "Monthly groceries order"},
    {"name": "Vivek Rastogi", "phone": "9876543231", "email": "vivek.r@gmail.com", "address": "Saket, New Delhi 110017", "notes": "Premium products buyer"},
]

B2B_CUSTOMERS = [
    {"name": "Krishna General Store", "phone": "9812345001", "email": "krishna.store@gmail.com", "address": "Shop No 12, Main Market, Sector 18, Noida, UP 201301", "gst": "09AABCK1234M1ZP", "pan": "AABCK1234M", "notes": "Weekly wholesale orders - Atta, Oil, Dal"},
    {"name": "Sai Provision Store", "phone": "9812345002", "email": "saiprovision@yahoo.com", "address": "15, Gandhi Road, Ghaziabad, UP 201001", "gst": "09BCDPS5678N2ZQ", "pan": "BCDPS5678N", "notes": "Bi-weekly orders - Full grocery range"},
    {"name": "Maa Bhagwati Traders", "phone": "9812345003", "email": "maabhagwati.traders@gmail.com", "address": "Wholesale Market, Aminabad, Lucknow, UP 226018", "gst": "09CEFMT9012O3ZR", "pan": "CEFMT9012O", "notes": "Masala & Spices wholesale"},
    {"name": "Sharma Ji ki Dukaan", "phone": "9812345004", "email": None, "address": "Near Bus Stand, Meerut, UP 250001", "gst": "09DGHSD3456P4ZS", "pan": "DGHSD3456P", "notes": "Monthly orders - Snacks & Beverages"},
    {"name": "Metro Fresh Mart", "phone": "9812345005", "email": "metro.freshmart@gmail.com", "address": "Plot 45, Industrial Area, Phase 2, Noida, UP 201305", "gst": "09EIJMF7890Q5ZT", "pan": "EIJMF7890Q", "notes": "Daily fresh items + monthly grocery"},
    {"name": "Gupta Brothers Wholesale", "phone": "9812345006", "email": "gupta.bros@gmail.com", "address": "Khari Baoli, Old Delhi, Delhi 110006", "gst": "07FKLGB2345R6ZU", "pan": "FKLGB2345R", "notes": "Bulk buyer - Rice, Dal, Sugar"},
    {"name": "Bharat Kirana Center", "phone": "9812345007", "email": "bharat.kirana@gmail.com", "address": "Station Road, Agra, UP 282001", "gst": "09GMNBK6789S7ZV", "pan": "GMNBK6789S", "notes": "Weekly restocking orders"},
    {"name": "New India Provision Co.", "phone": "9812345008", "email": "newindiaprov@gmail.com", "address": "Civil Lines, Kanpur, UP 208001", "gst": "09HOPNI1234T8ZW", "pan": "HOPNI1234T", "notes": "Oil, Ghee specialist orders"},
    {"name": "Patel Supermarket", "phone": "9812345009", "email": "patel.super@gmail.com", "address": "DLF Mall of India, Sector 18, Noida, UP 201301", "gst": "09IQRPS5678U9ZX", "pan": "IQRPS5678U", "notes": "Premium products - Dry Fruits, Dairy"},
    {"name": "Annapurna Food Supply", "phone": "9812345010", "email": "annapurna.food@gmail.com", "address": "Hazratganj, Lucknow, UP 226001", "gst": "09JSTAF9012V0ZY", "pan": "JSTAF9012V", "notes": "Catering supply - bulk orders"},
    {"name": "Laxmi Narayan Traders", "phone": "9812345011", "email": "lntraders@gmail.com", "address": "Sadar Bazaar, Delhi 110006", "gst": "07KTULM3456W1ZZ", "pan": "KTULM3456W", "notes": "Wholesale - household products"},
    {"name": "Om Shanti Enterprises", "phone": "9812345012", "email": "omshanti.ent@gmail.com", "address": "Transport Nagar, Varanasi, UP 221002", "gst": "09LUVOS7890X2ZA", "pan": "LUVOS7890X", "notes": "Regional distribution partner"},
]

EXPENSES = [
    {"category": "Rent", "amount": 35000, "description": "Shop rent - September 2026"},
    {"category": "Electricity", "amount": 8500, "description": "Electricity bill - August 2026"},
    {"category": "Salary", "amount": 18000, "description": "Helper salary - Raju (September)"},
    {"category": "Salary", "amount": 15000, "description": "Helper salary - Pappu (September)"},
    {"category": "Transportation", "amount": 4500, "description": "Goods transport from Mandi"},
    {"category": "Maintenance", "amount": 2500, "description": "Shop AC repair"},
    {"category": "Packaging", "amount": 1800, "description": "Carry bags & packaging material"},
    {"category": "Telephone", "amount": 999, "description": "Jio recharge - shop phone"},
    {"category": "Transportation", "amount": 3200, "description": "Delivery auto charges - weekly"},
    {"category": "Maintenance", "amount": 1500, "description": "Weighing machine servicing"},
    {"category": "Miscellaneous", "amount": 800, "description": "Printing - price tags & labels"},
    {"category": "Rent", "amount": 35000, "description": "Shop rent - August 2026"},
    {"category": "Electricity", "amount": 9200, "description": "Electricity bill - July 2026"},
    {"category": "Transportation", "amount": 5000, "description": "Goods pickup from wholesale market"},
    {"category": "Miscellaneous", "amount": 2000, "description": "CCTV camera maintenance"},
]


async def seed():
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created/verified")

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == BYPASS_EMAIL))
        user = result.scalars().first()
        if not user:
            user = User(full_name="Harsh Srivastava", email=BYPASS_EMAIL, hashed_password=get_password_hash(BYPASS_PASSWORD), phone="9999999999")
            db.add(user)
            await db.flush()
            print(f"User created: {user.id}")
        else:
            print(f"User exists: {user.id}")

        result = await db.execute(select(BusinessProfile).where(BusinessProfile.user_id == user.id))
        profile = result.scalars().first()
        if not profile:
            profile = BusinessProfile(user_id=user.id, business_name="Harsh Grocery Store", business_type="Grocery / Kirana", address="Shop No. 7, Atta Market, Sector 27, Noida, UP 201301", phone="9999999999", gst_number="09ABCHS1234K1ZP", upi_id="harshgrocery@paytm")
            db.add(profile)
            await db.flush()
            print(f"Business profile created: {profile.id}")
        else:
            profile.business_name = "Harsh Grocery Store"
            profile.business_type = "Grocery / Kirana"
            profile.address = "Shop No. 7, Atta Market, Sector 27, Noida, UP 201301"
            profile.phone = "9999999999"
            profile.gst_number = "09ABCHS1234K1ZP"
            profile.upi_id = "harshgrocery@paytm"
            await db.flush()
            print(f"Business profile updated: {profile.id}")

        bp_id = profile.id
        existing = await db.execute(select(Customer).where(Customer.business_profile_id == bp_id).limit(1))
        if existing.scalars().first():
            print("Data already seeded! Skipping.")
            await db.commit()
            await engine.dispose()
            return

        product_objects = []
        for p in PRODUCTS:
            prod = Product(business_profile_id=bp_id, **p)
            db.add(prod)
            product_objects.append(prod)
        await db.flush()
        print(f"{len(product_objects)} products added")

        customer_objects = []
        for c in RETAIL_CUSTOMERS:
            cust = Customer(business_profile_id=bp_id, **c)
            db.add(cust)
            customer_objects.append(cust)
        await db.flush()
        print(f"{len(RETAIL_CUSTOMERS)} retail customers added")

        for c in B2B_CUSTOMERS:
            cust = Customer(business_profile_id=bp_id, **c)
            db.add(cust)
            customer_objects.append(cust)
        await db.flush()
        print(f"{len(B2B_CUSTOMERS)} B2B customers added")

        today = date.today()
        invoice_count = 0
        payment_count = 0
        invoice_configs = [
            (0, 1, "paid", (3, 5), "UPI"), (1, 2, "paid", (2, 4), "Cash"),
            (2, 3, "unpaid", (4, 6), None), (3, 4, "paid", (2, 3), "UPI"),
            (22, 5, "paid", (8, 12), "Bank Transfer"), (4, 5, "paid", (3, 5), "Cash"),
            (5, 6, "unpaid", (2, 4), None), (23, 7, "paid", (6, 10), "Bank Transfer"),
            (6, 7, "overdue", (3, 5), None), (7, 8, "paid", (2, 3), "Cash"),
            (24, 9, "paid", (5, 8), "Bank Transfer"), (8, 10, "paid", (4, 6), "UPI"),
            (9, 11, "paid", (2, 4), "Cash"), (25, 12, "paid", (10, 15), "Bank Transfer"),
            (10, 13, "unpaid", (3, 5), None), (11, 14, "paid", (2, 3), "Cash"),
            (26, 15, "paid", (7, 11), "UPI"), (12, 16, "paid", (3, 5), "UPI"),
            (27, 18, "paid", (6, 9), "Bank Transfer"), (13, 20, "paid", (2, 4), "Cash"),
            (28, 22, "overdue", (8, 12), None), (14, 23, "paid", (5, 7), "UPI"),
            (29, 25, "paid", (6, 10), "Bank Transfer"), (15, 27, "paid", (2, 3), "Cash"),
            (30, 29, "paid", (10, 14), "Bank Transfer"),
        ]

        for cust_idx, days_ago, status, items_range, pay_method in invoice_configs:
            inv_date = today - timedelta(days=days_ago)
            due_date = inv_date + timedelta(days=15)
            num_items = random.randint(*items_range)
            selected_products = random.sample(product_objects, min(num_items, len(product_objects)))
            subtotal = 0.0
            gst_total_val = 0.0
            items_data = []
            for prod in selected_products:
                is_b2b = cust_idx >= len(RETAIL_CUSTOMERS)
                qty = random.randint(5, 25) if is_b2b else random.randint(1, 5)
                line_total = qty * prod.price
                line_gst = line_total * (prod.gst_rate / 100)
                subtotal += line_total
                gst_total_val += line_gst
                items_data.append({"product": prod, "qty": qty})
            grand_total = subtotal + gst_total_val
            invoice_count += 1
            inv_number = f"INV-{inv_date.strftime('%Y%m')}-{invoice_count:04d}"
            invoice = Invoice(business_profile_id=bp_id, customer_id=customer_objects[cust_idx].id, invoice_number=inv_number, date=inv_date, due_date=due_date, subtotal=round(subtotal, 2), gst_total=round(gst_total_val, 2), grand_total=round(grand_total, 2), status=status, payment_method=pay_method, notes="Thank you for shopping at Harsh Grocery Store!", terms="Payment due within 15 days. GST as applicable.", created_at=datetime.combine(inv_date, datetime.min.time().replace(hour=random.randint(9, 19), minute=random.randint(0, 59))))
            db.add(invoice)
            await db.flush()
            for item_data in items_data:
                prod = item_data["product"]
                inv_item = InvoiceItem(invoice_id=invoice.id, product_id=prod.id, description=prod.name, quantity=item_data["qty"], unit_price=prod.price, gst_rate=prod.gst_rate)
                db.add(inv_item)
            if status == "paid":
                payment = Payment(business_profile_id=bp_id, invoice_id=invoice.id, amount=round(grand_total, 2), status="captured", created_at=datetime.combine(inv_date, datetime.min.time().replace(hour=random.randint(9, 19), minute=random.randint(0, 59))))
                db.add(payment)
                payment_count += 1

        await db.flush()
        print(f"{invoice_count} invoices created")
        print(f"{payment_count} payments recorded")

        for i, exp in enumerate(EXPENSES):
            expense = Expense(business_profile_id=bp_id, category=exp["category"], amount=exp["amount"], date=today - timedelta(days=i * 2), description=exp["description"])
            db.add(expense)
        await db.flush()
        print(f"{len(EXPENSES)} expenses added")

        await db.commit()
        print("")
        print("ALL DEMO DATA SEEDED SUCCESSFULLY!")
        print(f"   Products: {len(PRODUCTS)}")
        print(f"   Retail Customers: {len(RETAIL_CUSTOMERS)}")
        print(f"   B2B Customers (GST): {len(B2B_CUSTOMERS)}")
        print(f"   Invoices: {invoice_count}")
        print(f"   Payments: {payment_count}")
        print(f"   Expenses: {len(EXPENSES)}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
