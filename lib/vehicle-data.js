// lib/vehicle-data.js

// Static vehicle data for development purposes
const vehicleData = {
    "status": "success",
    "data": {
      "models": [
        {
          "id": 1,
          "model_code": "B10",
          "name": "KM3000",
          "description": "Your favourite fully faired sports bike",
          "image_url": "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/KM3000_apj2tj.png",
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 2,
          "model_code": "B20",
          "name": "KM4000",
          "description": "Your favourite silent warrior",
          "image_url": "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/KM4000_fk2pkn.png",
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 3,
          "model_code": "B50",
          "name": "KM5000",
          "description": "Longest Range Cruiser Bike",
          "image_url": "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/KM5000_zvh35o.png",
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 4,
          "model_code": "H10",
          "name": "Hermes 75",
          "description": "Your favourite business companion",
          "image_url": "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812228/Booking%20Engine/HERMES_75_s59kcr.png",
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 5,
          "model_code": "N10",
          "name": "Intercity 350",
          "description": "Your only favourite scooter",
          "image_url": "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/INTERCITY_350_sgbybx.png",
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        }
      ],
      "variants": [
        {
          "id": 1,
          "model_id": 1,
          "model_name": "KM3000",
          "code": "B10-LONG-RANGE",
          "title": "Long Range",
          "subtitle": "5.14 kWh Battery Pack",
          "description": "202 kms Range (IDC)",
          "price_addition": 999,
          "battery_capacity": 5.14,
          "range_km": 202,
          "is_default": false,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 2,
          "model_id": 1,
          "model_name": "KM4000",
          "code": "B10-STANDARD-RANGE",
          "title": "Standard Range",
          "subtitle": "4.14 kWh Battery Pack",
          "description": "148 kms Range (IDC)",
          "price_addition": 0,
          "battery_capacity": 4.14,
          "range_km": 148,
          "is_default": true, // Make one default for testing
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        // ... (rest of variants data) ...
         {
          "id": 3,
          "model_id": 2,
          "model_name": "KM4000",
          "code": "B20-LONG-RANGE",
          "title": "Long Range",
          "subtitle": "5.14 kWh Battery Pack",
          "description": "202 kms Range (IDC)",
          "price_addition": 999,
          "battery_capacity": 5.14,
          "range_km": 202,
          "is_default": false,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 4,
          "model_id": 2,
          "model_name": "KM4000",
          "code": "B20-STANDARD-RANGE",
          "title": "Standard Range",
          "subtitle": "4.14 kWh Battery Pack",
          "description": "148 kms Range (IDC)",
          "price_addition": 0,
          "battery_capacity": 4.14,
          "range_km": 148,
          "is_default": true, // Make one default
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 5,
          "model_id": 3,
          "model_name": "KM5000",
          "code": "B50-LONG-RANGE",
          "title": "Long Range",
          "subtitle": "18.12 kWh Battery Pack",
          "description": "High endurance for long trips",
          "price_addition": 999,
          "battery_capacity": 18.12,
          "range_km": 350,
          "is_default": false,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 6,
          "model_id": 3,
          "model_name": "KM5000",
          "code": "B50-STANDARD-RANGE",
          "title": "Standard Range",
          "subtitle": "8.45 kWh Battery Pack",
          "description": "Optimal balance of range and weight",
          "price_addition": 0,
          "battery_capacity": 8.45,
          "range_km": 180,
          "is_default": true, // Make one default
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 7,
          "model_id": 4,
          "model_name": "HERMES 75 Mark 2",
          "code": "H10-LONG-RANGE",
          "title": "Long Range",
          "subtitle": "4.28 kWh Battery Pack",
          "description": "210 kms Range (IDC)",
          "price_addition": 999,
          "battery_capacity": 4.28,
          "range_km": 210,
          "is_default": false,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 8,
          "model_id": 4,
          "model_name": "HERMES 75 Mark 2",
          "code": "H10-STANDARD-RANGE",
          "title": "Standard Range",
          "subtitle": "3.35 kWh Battery Pack",
          "description": "151 kms Range (IDC)",
          "price_addition": 0,
          "battery_capacity": 3.35,
          "range_km": 151,
          "is_default": true, // Make one default
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 9,
          "model_id": 5,
          "model_name": "INTERCITY 350",
          "code": "N10-LONG-RANGE",
          "title": "Long Range",
          "subtitle": "4.28 kWh Battery Pack",
          "description": "210 kms Range (IDC)",
          "price_addition": 999,
          "battery_capacity": 4.28,
          "range_km": 210,
          "is_default": false,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 10,
          "model_id": 5,
          "model_name": "INTERCITY 350",
          "code": "N10-STANDARD-RANGE",
          "title": "Standard Range",
          "subtitle": "3.35 kWh Battery Pack",
          "description": "151 kms Range (IDC)",
          "price_addition": 0,
          "battery_capacity": 3.35,
          "range_km": 151,
          "is_default": true, // Make one default
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        }
      ],
      "colors": [
        {
          "id": 1,
          "model_id": 1,
          "model_name": "KM3000",
          "name": "Glossy Red",
          "color_value": "{\"colorStart\":\"#B91C1C\",\"colorEnd\":\"#450A0A\"}", // Example parsed values
          "is_default": true,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 2,
          "model_id": 1,
          "model_name": "KM3000",
          "name": "Matte Black",
           "color_value": "{\"colorStart\":\"#1F2937\",\"colorEnd\":\"#111827\"}", // Example parsed values
          "is_default": false,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        // ... (rest of colors data) ...
         {
          "id": 3,
          "model_id": 2,
          "model_name": "KM4000",
          "name": "Glossy Red",
          "color_value": "{\"colorStart\":\"#B91C1C\",\"colorEnd\":\"#450A0A\"}",
          "is_default": true,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 4,
          "model_id": 2,
          "model_name": "KM4000",
          "name": "Matte Black",
          "color_value": "{\"colorStart\":\"#1F2937\",\"colorEnd\":\"#111827\"}",
          "is_default": false,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 5,
          "model_id": 3,
          "model_name": "KM5000",
          "name": "Aluminium",
           "color_value": "{\"colorStart\":\"#D1D5DB\",\"colorEnd\":\"#9CA3AF\"}", // Example grey
          "is_default": true,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 6,
          "model_id": 4,
          "model_name": "HERMES 75 Mark 2",
          "name": "Just White",
          "color_value": "{\"colorStart\":\"#FFFFFF\",\"colorEnd\":\"#F3F4F6\"}", // Example white
          "is_default": true,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        },
        {
          "id": 7,
          "model_id": 5,
          "model_name": "INTERCITY 350",
          "name": "Just White",
           "color_value": "{\"colorStart\":\"#FFFFFF\",\"colorEnd\":\"#F3F4F6\"}", // Example white
          "is_default": true,
          "created_at": "16/04/2025 15:43:27",
          "updated_at": "16/04/2025 15:43:29"
        }
      ],
      "components": [
        {
          "id": 1,
          "model_id": 1,
          "model_name": "KM3000",
          "component_type": "ACCESSORY",
          "code": "B10-HELMET",
          "title": "Helmet",
          "subtitle": "Standard Safety Helmet",
          "description": "Protective headgear for rider safety.",
          "price": 999,
          "is_required": true, // Make helmet required for example
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
         {
          "id": 2,
          "model_id": 1,
          "model_name": "KM3000",
          "component_type": "ACCESSORY",
          "code": "B10-SAREE-GUARD",
          "title": "Saree Guard",
          "subtitle": "Optional Accessory",
          "description": "Safety attachment for traditional clothing.",
          "price": 499, // Example price
          "is_required": false,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
        // ... (rest of components data) ...
         {
          "id": 3,
          "model_id": 1,
          "model_name": "KM3000",
          "component_type": "PACKAGE",
          "code": "B10-SMART-CONNECTIVITY-PACKAGE",
          "title": "Smart Connectivity Package",
          "subtitle": "Smart AI Connectivity for 3 Yrs",
          "description": "Advanced connectivity features for smartphone integration.",
          "price": 2999,
          "is_required": false,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
        {
          "id": 5, // Example component for KM4000
          "model_id": 2,
          "model_name": "KM4000",
          "component_type": "ACCESSORY",
          "code": "B20-HELMET",
          "title": "Helmet",
          "subtitle": "Standard Safety Helmet",
          "description": "Protective headgear for rider safety.",
          "price": 999,
          "is_required": true,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
        {
          "id": 7, // Example component for KM4000
          "model_id": 2,
          "model_name": "KM4000",
          "component_type": "PACKAGE",
          "code": "B20-SMART-CONNECTIVITY-PACKAGE",
          "title": "Smart Connectivity Package",
          "subtitle": "Smart AI Connectivity for 3 Yrs",
          "description": "Advanced connectivity features for smartphone integration.",
          "price": 2999,
          "is_required": false,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
        {
          "id": 13, // Example Warranty (Common) - apply to multiple models if needed
          "model_id": 1, // Example: applies to KM3000
          "model_name": "KM3000",
          "component_type": "WARRANTY",
          "code": "COMMON-STANDARD",
          "title": "Standard Warranty",
          "subtitle": "Basic coverage included",
          "description": "Standard warranty coverage for your vehicle.",
          "price": 0,
          "is_required": true, // Standard warranty often is
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
         {
          "id": 130, // Example Warranty (Common) - apply to multiple models if needed
          "model_id": 2, // Example: also applies to KM4000
          "model_name": "KM4000",
          "component_type": "WARRANTY",
          "code": "COMMON-STANDARD", // Same code for common items
          "title": "Standard Warranty",
          "subtitle": "Basic coverage included",
          "description": "Standard warranty coverage for your vehicle.",
          "price": 0,
          "is_required": true,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
         {
          "id": 14,
          "model_id": 1, // Applies to KM3000
          "model_name": "KM3000",
          "component_type": "WARRANTY",
          "code": "COMMON-EXTENDED-2Y",
          "title": "Extended Warranty (2 Years)",
          "subtitle": "Total 5 Years / 60,000kms",
          "description": "Extended warranty for additional peace of mind.",
          "price": 15500,
          "is_required": false,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
         {
          "id": 140, // Example - apply to KM4000 too
          "model_id": 2,
          "model_name": "KM4000",
          "component_type": "WARRANTY",
          "code": "COMMON-EXTENDED-2Y",
          "title": "Extended Warranty (2 Years)",
          "subtitle": "Total 5 Years / 60,000kms",
          "description": "Extended warranty for additional peace of mind.",
          "price": 15500,
          "is_required": false,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        }
      ],
      "pricing": [
        {
          "id": 1,
          "model_id": 1,
          "model_name": "KM3000",
          "state": "Goa", // Example state
          "city": "Panaji", // Example specific city
          "pincode_start": 403001,
          "pincode_end": 403001, // Specific pincode
          "base_price": 174000, // Price specific to this location
          "fulfillment_fee": 1250,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
         {
          "id": 6, // Original ID 6 for Goa state range
          "model_id": 1,
          "model_name": "KM3000",
          "state": "Goa",
          "city": null, // Applies to whole state except specific cities/pincodes defined elsewhere
          "pincode_start": 403000, // State range
          "pincode_end": 403999,
          "base_price": 172500, // General state price
          "fulfillment_fee": 1250,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
         {
          "id": 8, // Delhi
          "model_id": 1,
          "model_name": "KM3000",
          "state": "Delhi",
          "city": "Delhi",
          "pincode_start": 110000,
          "pincode_end": 110099,
          "base_price": 170000, // Delhi specific price
          "fulfillment_fee": 1000,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
        // ... (add pricing for other models and locations as needed) ...
        {
          "id": 13, // Delhi KM4000
          "model_id": 2,
          "model_name": "KM4000",
          "state": "Delhi",
          "city": "Delhi",
          "pincode_start": 110000,
          "pincode_end": 110099,
          "base_price": 165000, // Delhi price
          "fulfillment_fee": 1000,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        },
          {
          "id": 130, // Goa KM4000
          "model_id": 2,
          "model_name": "KM4000",
          "state": "Goa",
          "city": null,
          "pincode_start": 403000,
          "pincode_end": 403999,
          "base_price": 166500, // Goa price
          "fulfillment_fee": 1250,
          "created_at": "16/04/2025 15:46:12",
          "updated_at": "16/04/2025 15:46:15"
        }
      ],
      // Insurance and Finance data removed as per simplification
      "insurance_providers": [],
      "insurance_plans": [],
      "finance_providers": [],
      "finance_options": []
    }
  };
  
  export default vehicleData;