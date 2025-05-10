// lib/navigation-data.js

// --- Desktop Menu ---
export const desktopMenuItems = [
  { id: "nav-motorbikes", label: "Motorbikes", hasDropdown: true, url: "#" },
  { id: "nav-scooter", label: "Scooter", hasDropdown: true, url: "#" },
  {
    id: "nav-micromobility",
    label: "Micromobility",
    hasDropdown: false,
    url: "/micromobility",
  },
  { id: "nav-fleet", label: "Fleet", hasDropdown: false, url: "/fleet" },
  { id: "nav-dealers", label: "Dealers", hasDropdown: false, url: "/dealers" },
  { id: "nav-contact", label: "Contact", hasDropdown: false, url: "/contact" },
  { id: "nav-more", label: "More", hasDropdown: true, url: "#" },
];

// --- Mobile Menu (Root Level) ---
export const mobileMenuItems = [
  {
    label: "Motorbikes",
    hasChildren: true,
    icon: "right",
    variant: "mobile",
    url: "#",
  },
  {
    label: "Scooters",
    hasChildren: true,
    icon: "right",
    variant: "mobile",
    url: "#",
  },
  {
    label: "Micromobility",
    hasChildren: false,
    icon: "right",
    variant: "mobile",
    url: "/micromobility",
  },
  {
    label: "Fleet",
    hasChildren: false,
    icon: "right",
    variant: "mobile",
    url: "/fleet",
  },
  {
    label: "Find a Dealer",
    hasChildren: false,
    icon: "right",
    variant: "mobile",
    url: "/dealers",
  },
  {
    label: "Contact Us",
    hasChildren: false,
    icon: "right",
    variant: "mobile",
    url: "/contact",
  },
  {
    label: "More",
    hasChildren: true,
    icon: "more",
    variant: "mobile",
    url: "#",
  },
];

// --- Dropdown Content ---

// Motorbikes
export const motorbikesDropdownItems = [
  {
    label: "KM5000",
    type: "model",
    image:
      "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/KM5000_zvh35o.png",
    url: "/products/km5000",
  },
  {
    label: "KM4000",
    type: "model",
    image:
      "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/KM4000_fk2pkn.png",
    url: "/products/km4000",
  },
  {
    label: "KM3000",
    type: "model",
    image:
      "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/KM3000_apj2tj.png",
    url: "/products/km3000",
  },
  { label: "Test Rides", type: "link", url: "/test-rides" },
  { label: "Book Now", type: "link", url: "/book" },
  { label: "Locate a Store", type: "link", url: "/dealers" },
  { label: "Compare Models", type: "link", url: "/compare?type=motorbike" },
];

// Scooters
export const scootersDropdownItems = [
  {
    label: "Intercity 350",
    type: "model",
    image:
      "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/INTERCITY_350_sgbybx.png",
    url: "/products/intercity-350",
  },
  {
    label: "Hermes 75",
    type: "model",
    image:
      "https://res.cloudinary.com/kabira-mobility/image/upload/v1744812228/Booking%20Engine/HERMES_75_s59kcr.png",
    url: "/products/hermes-75",
  },
  { label: "Explore Features", type: "link", url: "/scooters/features" },
  { label: "Test Rides", type: "link", url: "/test-rides?type=scooter" },
  { label: "Book Now", type: "link", url: "/book?type=scooter" },
  { label: "Locate a Store", type: "link", url: "/dealers" },
  { label: "Compare Models", type: "link", url: "/compare?type=scooter" },
];

// More (Split into 2 groups)
export const moreDropdownItems = [
  // Group 0
  { label: "About Us", type: "link", group: 0, url: "/about" },
  { label: "Press", type: "link", group: 0, url: "/press" },
  { label: "Blog", type: "link", group: 0, url: "/blog" },
  { label: "Become a Dealer", type: "link", group: 0, url: "/become-dealer" },
  // Group 1
  { label: "Support", type: "link", group: 1, url: "/support" },
  { label: "Contact Us", type: "link", group: 1, url: "/contact" },
  { label: "FAQ", type: "link", group: 1, url: "/faq" },
  { label: "Careers", type: "link", group: 1, url: "/careers" },
];
