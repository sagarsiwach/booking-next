// lib/static-product-data.js

export const staticProductData = {
  _id: "static-km3000-id", // More specific static ID
  title: "KM3000 Mark II",
  slug: "km3000",
  heroImage: {
    url: "https://framerusercontent.com/images/tyrMQVunICo3CYC82gFVAzJ42k8.png", // Replace with actual KM3000 Hero
    alt: "Kabira Mobility KM3000 electric sports bike",
  },
  heroSubtitle: "Experience the pinnacle of electric sports performance.",
  priceInfo: "Starting from ₹1,74,000 (Ex-Showroom)", // Updated example price
  keySpecs: [
    { label: "0-40 km/h", value: "2.9", unit: "s" },
    { label: "Top Speed", value: "120", unit: "km/h" },
    { label: "IDC Range", value: "201", unit: "km" },
  ],
  bookingUrl: "/book?model=km3000",
  testRideUrl: "/test-ride?model=km3000",

  vehicleOverviewTitle: "Vehicle Overview",
  vehicleOverviewSubtitle: "Drag to Explore the KM3000",
  // Turntable JSON removed - component generates URLs now

  // Feature Carousels - Structure assumes FeatureCarousel fetches slides
  featureCarousels: [
    {
      _key: "design_carousel",
      title: "Design",
      subtitle: "Aerodynamic and Aggressive Styling",
    },
    {
      _key: "tech_carousel",
      title: "Technology",
      subtitle: "Smart Features for a Connected Ride",
    },
    {
      _key: "perf_carousel",
      title: "Performance",
      subtitle: "Uncompromising Speed and Agility",
    },
  ],

  productVideo: {
    title: "KM3000 In Action",
    subtitle: "See the Thrill",
    videoUrl: "https://www.youtube.com/watch?v=YOUR_KM3000_VIDEO_ID", // Replace with actual YT ID
    // posterUrl: "https://your-cdn/km3000_video_poster.jpg" // Optional poster
  },

  // Technical Specs - More realistic example data
  technicalSpecifications: [
    {
      id: "colors",
      title: "Colors Available",
      type: "colorSwatch",
      items: [
        { value: "#B91C1C", alt: "Glossy Red" },
        { value: "#1F2937", alt: "Matte Black" },
      ],
    },
    {
      id: "range_battery",
      title: "Range & Battery",
      type: "keyValueGrid",
      items: [
        { label: "IDC Range", value: "Up to 201 km" },
        { label: "Battery Capacity", value: "5.15 kWh" },
        { label: "Battery Type", value: "LFP with BMS" },
        { label: "Warranty", value: "3 Years / 30k km" },
      ],
    },
    {
      id: "performance",
      title: "Performance",
      type: "keyValueGrid",
      items: [
        { label: "0-40 km/h", value: "2.9 s" },
        { label: "Top Speed", value: "120 km/h" },
        { label: "Peak Power", value: "12 kW" },
        { label: "Rated Power", value: "6 kW" },
      ],
    },
    {
      id: "charging",
      title: "Charging",
      type: "keyValueGrid",
      items: [
        { label: "Standard Charge", value: "Approx. 5h (0-80%)" },
        { label: "Fast Charge", value: "0-80% in 50m (Optional)" },
        { label: "Charger Type", value: "1.5 kW Onboard" },
      ],
    },
    {
      id: "brakes_susp",
      title: "Brakes & Suspension",
      type: "keyValueGrid",
      items: [
        { label: "Front Brake", value: "Disc (CBS)" },
        { label: "Rear Brake", value: "Disc (CBS)" },
        { label: "Front Suspension", value: "USD Forks" },
        { label: "Rear Suspension", value: "Monoshock" },
      ],
    },
    {
      id: "dimensions",
      title: "Dimensions",
      type: "keyValueGrid",
      items: [
        { label: "Wheelbase", value: "1430 mm" },
        { label: "Seat Height", value: "810 mm" },
        { label: "Ground Clearance", value: "170 mm" },
        { label: "Kerb Weight", value: "152 kg" },
      ],
    },
    {
      id: "features_misc",
      title: "Features",
      type: "simpleList",
      items: [
        { value: "Full LED Lighting" },
        { value: "Digital Instrument Cluster" },
        { value: "Bluetooth Connectivity" },
        { label: "Ride Modes", value: "Eco, City, Sports" },
      ],
    }, // Can mix simple and keyValue if needed in TechSpecList component
  ],

  galleryTitle: "KM3000 Gallery",
  gallerySubtitle: "Explore Every Angle",
  galleryImages: [
    {
      id: "g1",
      image:
        "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/KM3000_apj2tj.png",
      alt: "KM3000 Red Side View",
      title: "Side Profile",
    },
    {
      id: "g2",
      image:
        "https://via.placeholder.com/1080x607/cccccc/888888?text=KM3000+Front+3Q",
      alt: "KM3000 Front Quarter",
      title: "Front 3/4 View",
    },
    {
      id: "g3",
      image:
        "https://via.placeholder.com/1080x607/dddddd/888888?text=KM3000+Rear+3Q",
      alt: "KM3000 Rear Quarter",
      title: "Rear 3/4 View",
    },
    {
      id: "g4",
      image:
        "https://via.placeholder.com/1080x607/eeeeee/888888?text=KM3000+Cockpit",
      alt: "KM3000 Cockpit View",
      title: "Cockpit",
    },
    {
      id: "g5",
      image:
        "https://via.placeholder.com/1080x607/f0f0f0/888888?text=KM3000+Detail",
      alt: "KM3000 Headlight Detail",
      title: "Headlight Detail",
    },
  ],

  testimonialTitle: "Rider Experiences",
  testimonialSubtitle: "Hear from the KM3000 community.",
  testimonials: [
    {
      id: "t1",
      quote:
        "The acceleration is mind-blowing! It handles like a dream on twisty roads.",
      authorName: "Aarav Patel",
      authorImage: "https://via.placeholder.com/50/A0A0A0/FFFFFF?text=AP",
      backgroundImage:
        "https://framerusercontent.com/images/vZBqF2GeyHaWGFmRlxqIwGwnA.webp",
    },
    {
      id: "t2",
      quote:
        "Looks fantastic, gets attention everywhere. The range is perfect for my city rides plus weekend trips.",
      authorName: "Sneha Reddy",
      authorImage: "https://via.placeholder.com/50/C0C0C0/FFFFFF?text=SR",
      backgroundImage:
        "https://framerusercontent.com/images/o0fRKVqFFKbW2hmoFScIxFKFY.webp",
    },
    {
      id: "t3",
      quote:
        "Smooth power delivery and the riding modes actually make a difference. Very impressed.",
      authorName: "Vikram Singh",
      authorImage: "https://via.placeholder.com/50/B0B0B0/FFFFFF?text=VS",
      backgroundImage:
        "https://framerusercontent.com/images/3NanaeTZPzy8wyaYyMlx6XcZfLs.webp",
    },
  ],

  faqTitle: "FAQ",
  faqSubtitle: "Common questions about the KM3000.",
  // FAQs are fetched by the AccordionFAQ component using product _id
};
