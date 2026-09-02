/* ============================================================
   NESTORA — Immersive Experience Data Layer
   All copy, imagery references and structured content live here,
   separated from rendering and interaction logic.
   ============================================================ */

const IMG = (id, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/* The single hero residence this entire cinematic experience is built around. */
const RESIDENCE = {
  name: "NESTORA RESIDENCE 01",
  title: "The Glass House",
  location: "Jaipur, Rajasthan",
  bedrooms: 4,
  bathrooms: 5,
  area: "4,850 SQ FT",
  price: "₹4.85 CR",
  coordinates: { lat: 26.9855, lng: 75.8513 },
  description:
    "Set on a raised podium above Amber Hills, The Glass House was conceived as a single gesture — a low concrete plinth carrying a floating volume of glass. Every room was placed to catch a specific hour of light.",
};

/* ---------- Camera journey: five scripted scenes ---------- */
const JOURNEY_SCENES = [
  {
    id: "arrival",
    index: "01",
    label: "THE ARRIVAL",
    quote: "Architecture that announces itself without saying a word.",
    camera: { pos: [0, 5.2, 24], target: [0, 2.4, 0] },
    fallbackImage: IMG("photo-1600585154340-be6161a56a0c", 2000),
  },
  {
    id: "living",
    index: "02",
    label: "THE LIVING SPACE",
    quote: "Designed around light, proportion and the art of slowing down.",
    camera: { pos: [0.5, 3.2, 9.5], target: [0, 2.6, 0] },
    fallbackImage: IMG("photo-1600607687939-ce8a6c25118c", 2000),
  },
  {
    id: "suite",
    index: "03",
    label: "THE MASTER SUITE",
    quote: "A quieter kind of luxury.",
    camera: { pos: [7.5, 6.6, 6.5], target: [5, 5.6, 1] },
    fallbackImage: IMG("photo-1560185127-6ed189bf02f4", 2000),
  },
  {
    id: "courtyard",
    index: "04",
    label: "OPEN AIR",
    quote: "Where architecture meets the horizon.",
    camera: { pos: [-9.5, 2.4, 10.5], target: [-2, 1, 3] },
    fallbackImage: IMG("photo-1600566753086-00f18fb6b3ea", 2000),
  },
  {
    id: "rooftop",
    index: "05",
    label: "ABOVE IT ALL",
    quote: "A private perspective on the city.",
    camera: { pos: [2, 12.5, 8.5], target: [0, 9, 0] },
    fallbackImage: IMG("photo-1600210492486-724fe5c67fb0", 2000),
  },
];

/* ---------- Interactive hotspots inside the 3D environment ---------- */
const HOTSPOTS = [
  {
    id: "living-room",
    label: "LIVING ROOM",
    camera: { pos: [0.5, 3.2, 9.5], target: [0, 2.6, 0] },
    description: "A single 11-metre span of glass keeps the living room in constant conversation with the garden.",
    features: ["DOUBLE-HEIGHT CEILING", "FLOOR-TO-CEILING GLASS", "OPEN HEARTH"],
  },
  {
    id: "master-suite",
    label: "MASTER SUITE",
    camera: { pos: [7.5, 6.6, 6.5], target: [5, 5.6, 1] },
    description: "Floor-to-ceiling windows frame the morning light across a private, elevated volume.",
    features: ["WALK-IN CLOSET", "PRIVATE TERRACE", "ENSUITE BATH"],
  },
  {
    id: "kitchen",
    label: "KITCHEN",
    camera: { pos: [-3.5, 3.4, 6.5], target: [-2, 2.2, 1] },
    description: "Honed stone counters and a butler's pantry, positioned to catch the last hour of afternoon light.",
    features: ["HONED STONE ISLAND", "BUTLER'S PANTRY", "INDUCTION SUITE"],
  },
  {
    id: "pool",
    label: "POOL",
    camera: { pos: [-9.5, 2.4, 10.5], target: [-2, 1, 3] },
    description: "An 18-metre reflecting pool runs the full length of the courtyard, mirroring the structure above it.",
    features: ["18M LAP POOL", "SUBMERGED LEDGE SEATING", "NIGHT ILLUMINATION"],
  },
  {
    id: "rooftop",
    label: "ROOFTOP",
    camera: { pos: [2, 12.5, 8.5], target: [0, 9, 0] },
    description: "A private terrace above the city, built for evenings that start with a sunset and end with the skyline.",
    features: ["OUTDOOR LOUNGE", "FIRE PIT", "180° CITY VIEW"],
  },
];

/* ---------- Materials palette ---------- */
const MATERIALS = [
  { name: "NATURAL STONE", image: IMG("photo-1697497710118-0d5cb5a7094a"), note: "Local sandstone, hand-honed for the podium and courtyard walls." },
  { name: "OAK", image: IMG("photo-1600566753190-17f0baa2a6c3"), note: "Rift-sawn white oak, used across flooring and cabinetry." },
  { name: "GLASS", image: IMG("photo-1609363909807-c15eea7fb7b7"), note: "Low-iron glazing, floor-to-ceiling, framed in dark bronze." },
  { name: "BRASS", image: IMG("photo-1559058922-5d29e1f00075"), note: "Aged brass hardware throughout, chosen to patina over time." },
  { name: "CONCRETE", image: IMG("photo-1512917774080-9991f1c4c750"), note: "Board-formed concrete, left exposed on the primary structural walls." },
];

/* ---------- Interior gallery (horizontal cinematic scroll) ---------- */
const GALLERY_IMAGES = [
  { label: "LIVING ROOM", image: IMG("photo-1600607687939-ce8a6c25118c", 2000) },
  { label: "DINING ROOM", image: IMG("photo-1600566752355-35792bedcfea", 2000) },
  { label: "KITCHEN", image: IMG("photo-1600585154526-990dced4db0d", 2000) },
  { label: "BEDROOM", image: IMG("photo-1560185127-6ed189bf02f4", 2000) },
  { label: "BATHROOM", image: IMG("photo-1560448204-e02f11c3d0e2", 2000) },
  { label: "POOL", image: IMG("photo-1616486338812-3dadae4b4ace", 2000) },
  { label: "ROOFTOP", image: IMG("photo-1600210492486-724fe5c67fb0", 2000) },
];

/* ---------- Floor plans ---------- */
const FLOOR_PLANS = {
  "GROUND FLOOR": {
    rooms: [
      { id: "living", name: "LIVING", x: 30, y: 55, w: 26, h: 30, area: "620 SQ FT", purpose: "Living & entertaining", features: ["Double-height glazing", "Open hearth"] },
      { id: "dining", name: "DINING", x: 58, y: 55, w: 18, h: 30, area: "310 SQ FT", purpose: "Formal dining", features: ["Courtyard view", "Built-in bar"] },
      { id: "kitchen", name: "KITCHEN", x: 30, y: 20, w: 22, h: 28, area: "340 SQ FT", purpose: "Culinary preparation", features: ["Stone island", "Butler's pantry"] },
      { id: "study", name: "STUDY", x: 58, y: 20, w: 18, h: 28, area: "220 SQ FT", purpose: "Home office", features: ["Garden-facing desk nook"] },
    ],
  },
  "FIRST FLOOR": {
    rooms: [
      { id: "master", name: "BEDROOM", x: 55, y: 30, w: 28, h: 34, area: "480 SQ FT", purpose: "Master suite", features: ["Walk-in closet", "Private terrace"] },
      { id: "bed2", name: "BEDROOM", x: 20, y: 30, w: 22, h: 30, area: "300 SQ FT", purpose: "Guest bedroom", features: ["Ensuite bath"] },
      { id: "terrace", name: "TERRACE", x: 55, y: 68, w: 28, h: 16, area: "180 SQ FT", purpose: "Private outdoor space", features: ["Morning light"] },
    ],
  },
  "ROOFTOP": {
    rooms: [
      { id: "lounge", name: "TERRACE", x: 28, y: 35, w: 46, h: 34, area: "760 SQ FT", purpose: "Rooftop lounge", features: ["Fire pit", "180° city view", "Outdoor kitchen"] },
    ],
  },
};

/* ---------- Location travel times ---------- */
const LOCATION_STATS = [
  { label: "AIRPORT", time: "18 MIN" },
  { label: "CITY CENTER", time: "12 MIN" },
  { label: "INTERNATIONAL SCHOOL", time: "8 MIN" },
  { label: "RESTAURANTS", time: "5 MIN" },
  { label: "SHOPPING", time: "9 MIN" },
  { label: "HOSPITAL", time: "11 MIN" },
];

/* ---------- Neighborhood story ---------- */
const NEIGHBORHOOD_STORY = [
  { word: "CITY.", image: IMG("photo-1477587458883-47145ed94245"), text: "Amber Hills sits fifteen minutes from Jaipur's centre, close enough for a Tuesday dinner reservation, far enough to hear very little of the city at night." },
  { word: "CULTURE.", image: IMG("photo-1524492412937-b28074a5d7da"), text: "Four centuries of Rajput architecture surround the neighbourhood — a constant, quiet reference point for anything built here new." },
  { word: "CALM.", image: IMG("photo-1600585154526-990dced4db0d"), text: "The street was designed around a single rule: no house may be taller than the trees planted the year it was built." },
];

/* ---------- Lifestyle imagery ---------- */
const LIFESTYLE_IMAGES = [
  { caption: "Morning, before the city wakes.", image: IMG("photo-1495474472287-4d71bcdd2085") },
  { caption: "A pool that catches the entire afternoon.", image: IMG("photo-1571896349842-33c89424de2d") },
  { caption: "Dinner, table set for six.", image: IMG("photo-1600891964092-4316c288032e") },
  { caption: "The terrace, after sunset.", image: IMG("photo-1731789247154-f0461bfaf269") },
  { caption: "A garden that requires very little.", image: IMG("photo-1600607687920-4e2a09cf159d") },
  { caption: "The house, lit from within.", image: IMG("photo-1600566753086-00f18fb6b3ea") },
];

/* ---------- Property collection (secondary residences) ---------- */
const COLLECTION = [
  {
    id: "glass-house",
    index: "RESIDENCE 01",
    name: "The Glass House",
    location: "Jaipur",
    price: "₹4.85 Cr",
    area: "4,850 SQ FT",
    bedrooms: 4,
    image: IMG("photo-1600585154340-be6161a56a0c", 1800),
    gallery: [
      IMG("photo-1600585154340-be6161a56a0c", 1800),
      IMG("photo-1600607687939-ce8a6c25118c", 1800),
      IMG("photo-1600566753086-00f18fb6b3ea", 1800),
      IMG("photo-1600210492486-724fe5c67fb0", 1800),
    ],
    bathrooms: 5,
    parking: 2,
    year: 2024,
    amenities: ["Private Pool", "Rooftop Terrace", "Smart Home", "24/7 Security", "Home Office", "Covered Parking"],
  },
  {
    id: "palm-estate",
    index: "RESIDENCE 02",
    name: "The Palm Estate",
    location: "Goa",
    price: "₹6.40 Cr",
    area: "5,400 SQ FT",
    bedrooms: 5,
    image: IMG("photo-1613490493576-7fde63acd811", 1800),
    gallery: [
      IMG("photo-1613490493576-7fde63acd811", 1800),
      IMG("photo-1616486338812-3dadae4b4ace", 1800),
      IMG("photo-1521782462922-e78d0a35b8de", 1800),
      IMG("photo-1560185127-6ed189bf02f4", 1800),
    ],
    bathrooms: 6,
    parking: 3,
    year: 2023,
    amenities: ["Private Pool", "Garden", "Gym", "Covered Parking", "Smart Home", "Outdoor Kitchen"],
  },
  {
    id: "skyline-residence",
    index: "RESIDENCE 03",
    name: "The Skyline Residence",
    location: "Gurugram",
    price: "₹3.90 Cr",
    area: "2,680 SQ FT",
    bedrooms: 3,
    image: IMG("photo-1600596542815-ffad4c1539a9", 1800),
    gallery: [
      IMG("photo-1600596542815-ffad4c1539a9", 1800),
      IMG("photo-1493809842364-78817add7ffb", 1800),
      IMG("photo-1600210491892-03d54c0aaf87", 1800),
      IMG("photo-1600121848594-d8644e57abab", 1800),
    ],
    bathrooms: 3,
    parking: 2,
    year: 2025,
    amenities: ["Gym", "Security", "Covered Parking", "Smart Home", "Modular Kitchen"],
  },
];

/* ---------- Advisor ---------- */
const ADVISOR = {
  name: "Aarav Mehta",
  role: "Luxury Property Advisor",
  years: 12,
  portrait: "https://randomuser.me/api/portraits/men/32.jpg",
  bio: "Aarav has spent twelve years placing families into architecturally significant homes across Rajasthan, and led the original sale of The Glass House in 2024.",
};

/* ---------- Specifications ---------- */
const SPECIFICATIONS = [
  { value: 4850, suffix: "", label: "SQ FT" },
  { value: 4, suffix: "", label: "BEDROOMS" },
  { value: 5, suffix: "", label: "BATHROOMS" },
  { value: 2, suffix: "", label: "PARKING" },
];
const SPEC_BADGES = ["PRIVATE POOL", "ROOFTOP TERRACE", "SMART HOME", "24/7 SECURITY"];
