import { IconType } from 'react-icons';

// Font Awesome Icons
import {
  FaShoppingCart,
  FaShoppingBag,
  FaStore,
  FaCreditCard,
  FaMoneyBillWave,
  FaLaptop,
  FaMobile,
  FaCamera,
  FaGamepad,
  FaHeadphones,
  FaTshirt,
  FaShoePrints,
  FaGem,
  FaClock,
  FaGlasses,
  FaHome,
  FaCouch,
  FaBed,
  FaUtensils,
  FaBlender,
  FaPizzaSlice,
  FaCoffee,
  FaWineGlass,
  FaAppleAlt,
  FaCarrot,
  FaBreadSlice,
  FaCar,
  FaBicycle,
  FaMotorcycle,
  FaPlane,
  FaUmbrellaBeach,
  FaCampground,
  FaDumbbell,
  FaFootballBall,
  FaBasketballBall,
  FaTableTennis,
  FaRunning,
  FaSwimmer,
  FaBook,
  FaGraduationCap,
  FaPen,
  FaPalette,
  FaMusic,
  FaGuitar,
  FaMicrophone,
  FaHeart,
  FaStar,
  FaGift,
  FaBaby,
  FaPaw,
  FaSeedling,
  FaLeaf,
  FaTools,
  FaHammer,
  FaScrewdriver,
  FaWrench,
  FaMedkit,
  FaPills,
  FaStethoscope,
  FaEye,
  FaSprayCan,
  FaCut,
} from 'react-icons/fa';

// Material Design Icons
import {
  MdDevices,
  MdPhoneAndroid,
  MdLaptopMac,
  MdWatch,
  MdHeadset,
  MdSportsSoccer,
  MdSportsBasketball,
  MdSportsTennis,
  MdDirectionsCar,
  MdDirectionsBike,
  MdFlight,
  MdRestaurant,
  MdLocalCafe,
  MdLocalBar,
  MdLocalGroceryStore,
  MdShoppingBasket,
  MdStorefront,
  MdHomeWork,
  MdKitchen,
  MdBed,
  MdChair,
  MdYard,
  MdPets,
  MdBabyChangingStation,
  MdHealthAndSafety,
  MdFitnessCenter,
  MdMusicNote,
  MdLibraryBooks,
  MdSchool,
  MdBrush,
  MdColorLens,
  MdConstruction,
  MdBuild,
  MdAutoAwesome,
  MdSpa,
  MdFace,
  MdLocalFlorist,
} from 'react-icons/md';

// Heroicons
import {
  HiShoppingCart,
  HiHome,
  HiGift,
  HiStar,
  HiHeart,
  HiDevicePhoneMobile,
  HiComputerDesktop,
  HiMusicalNote,
  HiBookOpen,
  HiAcademicCap,
  HiPaintBrush,
  HiWrenchScrewdriver,
  HiBeaker,
  HiCake,
  HiCpuChip,
  HiCube,
  HiFire,
  HiSparkles,
  HiSun,
  HiMoon,
} from 'react-icons/hi2';

// Lucide Icons (existing in project)
import {
  ShoppingCart,
  Store,
  Gift,
  Heart,
  Star,
  Home,
  Smartphone,
  Laptop,
  Camera,
  Gamepad2,
  Headphones,
  Car,
  Bike,
  Plane,
  Book,
  Music,
  Palette,
  Hammer,
  Wrench,
  Stethoscope,
  Shirt,
  Coffee,
  Pizza,
  Flower,
  Dumbbell,
  PawPrint,
  Baby,
  Eye,
  Scissors,
  Brush,
} from 'lucide-react';

export interface IconData {
  name: string;
  component: IconType;
  library: string;
  keywords: string[];
  category: string;
  description: string;
}

export const ICON_CATEGORIES = [
  'all',
  'ecommerce',
  'electronics',
  'fashion',
  'food',
  'home',
  'sports',
  'automotive',
  'books',
  'music',
  'health',
  'tools',
  'beauty',
  'baby',
  'pets',
  'garden',
] as const;

export type IconCategory = typeof ICON_CATEGORIES[number];

export const ICON_REGISTRY: IconData[] = [
  // E-commerce & Shopping
  {
    name: 'Shopping Cart',
    component: FaShoppingCart,
    library: 'react-icons/fa',
    keywords: ['shopping', 'cart', 'buy', 'purchase', 'ecommerce', 'store'],
    category: 'ecommerce',
    description: 'Shopping cart for purchases'
  },
  {
    name: 'Shopping Bag',
    component: FaShoppingBag,
    library: 'react-icons/fa',
    keywords: ['shopping', 'bag', 'buy', 'purchase', 'retail'],
    category: 'ecommerce',
    description: 'Shopping bag icon'
  },
  {
    name: 'Store',
    component: FaStore,
    library: 'react-icons/fa',
    keywords: ['store', 'shop', 'retail', 'business', 'commerce'],
    category: 'ecommerce',
    description: 'Physical store or shop'
  },
  {
    name: 'Credit Card',
    component: FaCreditCard,
    library: 'react-icons/fa',
    keywords: ['payment', 'credit', 'card', 'finance', 'money', 'pay'],
    category: 'ecommerce',
    description: 'Payment and credit cards'
  },
  {
    name: 'Money',
    component: FaMoneyBillWave,
    library: 'react-icons/fa',
    keywords: ['money', 'cash', 'payment', 'finance', 'currency'],
    category: 'ecommerce',
    description: 'Money and cash payments'
  },
  {
    name: 'Gift',
    component: FaGift,
    library: 'react-icons/fa',
    keywords: ['gift', 'present', 'surprise', 'celebration', 'birthday'],
    category: 'ecommerce',
    description: 'Gifts and presents'
  },

  // Electronics & Technology
  {
    name: 'Laptop',
    component: FaLaptop,
    library: 'react-icons/fa',
    keywords: ['laptop', 'computer', 'tech', 'electronics', 'pc'],
    category: 'electronics',
    description: 'Laptops and computers'
  },
  {
    name: 'Mobile Phone',
    component: FaMobile,
    library: 'react-icons/fa',
    keywords: ['mobile', 'phone', 'smartphone', 'cell', 'electronics'],
    category: 'electronics',
    description: 'Mobile phones and smartphones'
  },
  {
    name: 'Camera',
    component: FaCamera,
    library: 'react-icons/fa',
    keywords: ['camera', 'photo', 'photography', 'electronics', 'picture'],
    category: 'electronics',
    description: 'Cameras and photography equipment'
  },
  {
    name: 'Gaming',
    component: FaGamepad,
    library: 'react-icons/fa',
    keywords: ['gaming', 'games', 'gamepad', 'controller', 'entertainment'],
    category: 'electronics',
    description: 'Gaming and entertainment'
  },
  {
    name: 'Headphones',
    component: FaHeadphones,
    library: 'react-icons/fa',
    keywords: ['headphones', 'audio', 'music', 'sound', 'electronics'],
    category: 'electronics',
    description: 'Audio equipment and headphones'
  },
  {
    name: 'Watch',
    component: FaClock,
    library: 'react-icons/fa',
    keywords: ['watch', 'time', 'smartwatch', 'wearable', 'electronics'],
    category: 'electronics',
    description: 'Watches and wearable tech'
  },

  // Fashion & Clothing
  {
    name: 'T-Shirt',
    component: FaTshirt,
    library: 'react-icons/fa',
    keywords: ['clothing', 'shirt', 'fashion', 'apparel', 'wear'],
    category: 'fashion',
    description: 'Clothing and apparel'
  },
  {
    name: 'Shoes',
    component: FaShoePrints,
    library: 'react-icons/fa',
    keywords: ['shoes', 'footwear', 'fashion', 'sneakers', 'boots'],
    category: 'fashion',
    description: 'Footwear and shoes'
  },
  {
    name: 'Jewelry',
    component: FaGem,
    library: 'react-icons/fa',
    keywords: ['jewelry', 'gem', 'diamond', 'accessories', 'luxury'],
    category: 'fashion',
    description: 'Jewelry and accessories'
  },
  {
    name: 'Sunglasses',
    component: FaGlasses,
    library: 'react-icons/fa',
    keywords: ['glasses', 'sunglasses', 'eyewear', 'fashion', 'accessories'],
    category: 'fashion',
    description: 'Eyewear and accessories'
  },

  // Food & Beverages
  {
    name: 'Pizza',
    component: FaPizzaSlice,
    library: 'react-icons/fa',
    keywords: ['pizza', 'food', 'restaurant', 'meal', 'fast food'],
    category: 'food',
    description: 'Pizza and fast food'
  },
  {
    name: 'Coffee',
    component: FaCoffee,
    library: 'react-icons/fa',
    keywords: ['coffee', 'cafe', 'drink', 'beverage', 'caffeine'],
    category: 'food',
    description: 'Coffee and beverages'
  },
  {
    name: 'Wine',
    component: FaWineGlass,
    library: 'react-icons/fa',
    keywords: ['wine', 'alcohol', 'drink', 'beverage', 'restaurant'],
    category: 'food',
    description: 'Wine and alcoholic beverages'
  },
  {
    name: 'Restaurant',
    component: FaUtensils,
    library: 'react-icons/fa',
    keywords: ['restaurant', 'dining', 'food', 'utensils', 'meal'],
    category: 'food',
    description: 'Restaurants and dining'
  },
  {
    name: 'Apple',
    component: FaAppleAlt,
    library: 'react-icons/fa',
    keywords: ['apple', 'fruit', 'healthy', 'organic', 'fresh'],
    category: 'food',
    description: 'Fresh fruits and healthy food'
  },
  {
    name: 'Vegetables',
    component: FaCarrot,
    library: 'react-icons/fa',
    keywords: ['vegetables', 'carrot', 'healthy', 'organic', 'fresh'],
    category: 'food',
    description: 'Fresh vegetables and produce'
  },
  {
    name: 'Bread',
    component: FaBreadSlice,
    library: 'react-icons/fa',
    keywords: ['bread', 'bakery', 'food', 'carbs', 'grain'],
    category: 'food',
    description: 'Bakery and bread products'
  },
  {
    name: 'Kitchen',
    component: FaBlender,
    library: 'react-icons/fa',
    keywords: ['kitchen', 'cooking', 'appliances', 'home', 'culinary'],
    category: 'home',
    description: 'Kitchen appliances and cookware'
  },

  // Home & Garden
  {
    name: 'Home',
    component: FaHome,
    library: 'react-icons/fa',
    keywords: ['home', 'house', 'property', 'real estate', 'building'],
    category: 'home',
    description: 'Home and real estate'
  },
  {
    name: 'Sofa',
    component: FaCouch,
    library: 'react-icons/fa',
    keywords: ['furniture', 'sofa', 'couch', 'living room', 'home'],
    category: 'home',
    description: 'Furniture and home decor'
  },
  {
    name: 'Bed',
    component: FaBed,
    library: 'react-icons/fa',
    keywords: ['bed', 'bedroom', 'sleep', 'furniture', 'home'],
    category: 'home',
    description: 'Bedroom furniture'
  },
  {
    name: 'Garden',
    component: FaSeedling,
    library: 'react-icons/fa',
    keywords: ['garden', 'plant', 'growing', 'nature', 'green'],
    category: 'garden',
    description: 'Gardening and plants'
  },
  {
    name: 'Flower',
    component: FaLeaf,
    library: 'react-icons/fa',
    keywords: ['flower', 'garden', 'nature', 'decoration', 'plant'],
    category: 'garden',
    description: 'Flowers and decorative plants'
  },
  {
    name: 'Leaf',
    component: FaLeaf,
    library: 'react-icons/fa',
    keywords: ['leaf', 'nature', 'organic', 'eco', 'environment'],
    category: 'garden',
    description: 'Nature and eco-friendly products'
  },

  // Automotive
  {
    name: 'Car',
    component: FaCar,
    library: 'react-icons/fa',
    keywords: ['car', 'auto', 'vehicle', 'transportation', 'automotive'],
    category: 'automotive',
    description: 'Cars and automotive'
  },
  {
    name: 'Bicycle',
    component: FaBicycle,
    library: 'react-icons/fa',
    keywords: ['bicycle', 'bike', 'cycling', 'sport', 'transportation'],
    category: 'automotive',
    description: 'Bicycles and cycling'
  },
  {
    name: 'Motorcycle',
    component: FaMotorcycle,
    library: 'react-icons/fa',
    keywords: ['motorcycle', 'bike', 'motor', 'vehicle', 'transportation'],
    category: 'automotive',
    description: 'Motorcycles and motor vehicles'
  },
  {
    name: 'Plane',
    component: FaPlane,
    library: 'react-icons/fa',
    keywords: ['plane', 'flight', 'travel', 'airline', 'transportation'],
    category: 'automotive',
    description: 'Air travel and airlines'
  },

  // Sports & Fitness
  {
    name: 'Dumbbell',
    component: FaDumbbell,
    library: 'react-icons/fa',
    keywords: ['fitness', 'gym', 'exercise', 'workout', 'health'],
    category: 'sports',
    description: 'Fitness and gym equipment'
  },
  {
    name: 'Football',
    component: FaFootballBall,
    library: 'react-icons/fa',
    keywords: ['football', 'sport', 'ball', 'game', 'athletics'],
    category: 'sports',
    description: 'Football and team sports'
  },
  {
    name: 'Basketball',
    component: FaBasketballBall,
    library: 'react-icons/fa',
    keywords: ['basketball', 'sport', 'ball', 'game', 'athletics'],
    category: 'sports',
    description: 'Basketball and court sports'
  },
  {
    name: 'Tennis',
    component: FaTableTennis,
    library: 'react-icons/fa',
    keywords: ['tennis', 'sport', 'racket', 'game', 'athletics'],
    category: 'sports',
    description: 'Tennis and racket sports'
  },
  {
    name: 'Running',
    component: FaRunning,
    library: 'react-icons/fa',
    keywords: ['running', 'sport', 'fitness', 'exercise', 'athletics'],
    category: 'sports',
    description: 'Running and cardio fitness'
  },
  {
    name: 'Swimming',
    component: FaSwimmer,
    library: 'react-icons/fa',
    keywords: ['swimming', 'sport', 'water', 'pool', 'athletics'],
    category: 'sports',
    description: 'Swimming and water sports'
  },
  {
    name: 'Beach',
    component: FaUmbrellaBeach,
    library: 'react-icons/fa',
    keywords: ['beach', 'vacation', 'travel', 'summer', 'leisure'],
    category: 'sports',
    description: 'Beach and vacation activities'
  },
  {
    name: 'Camping',
    component: FaCampground,
    library: 'react-icons/fa',
    keywords: ['camping', 'outdoor', 'nature', 'adventure', 'travel'],
    category: 'sports',
    description: 'Camping and outdoor activities'
  },

  // Books & Education
  {
    name: 'Book',
    component: FaBook,
    library: 'react-icons/fa',
    keywords: ['book', 'reading', 'education', 'literature', 'knowledge'],
    category: 'books',
    description: 'Books and literature'
  },
  {
    name: 'Education',
    component: FaGraduationCap,
    library: 'react-icons/fa',
    keywords: ['education', 'graduation', 'school', 'university', 'learning'],
    category: 'books',
    description: 'Education and learning'
  },
  {
    name: 'Pen',
    component: FaPen,
    library: 'react-icons/fa',
    keywords: ['pen', 'writing', 'office', 'stationery', 'supplies'],
    category: 'books',
    description: 'Writing and office supplies'
  },
  {
    name: 'Art',
    component: FaPalette,
    library: 'react-icons/fa',
    keywords: ['art', 'painting', 'creative', 'design', 'color'],
    category: 'books',
    description: 'Art and creative supplies'
  },

  // Music & Entertainment
  {
    name: 'Music',
    component: FaMusic,
    library: 'react-icons/fa',
    keywords: ['music', 'sound', 'audio', 'entertainment', 'melody'],
    category: 'music',
    description: 'Music and audio'
  },
  {
    name: 'Guitar',
    component: FaGuitar,
    library: 'react-icons/fa',
    keywords: ['guitar', 'music', 'instrument', 'band', 'entertainment'],
    category: 'music',
    description: 'Musical instruments'
  },
  {
    name: 'Microphone',
    component: FaMicrophone,
    library: 'react-icons/fa',
    keywords: ['microphone', 'audio', 'recording', 'music', 'sound'],
    category: 'music',
    description: 'Audio recording equipment'
  },

  // Tools & Hardware
  {
    name: 'Tools',
    component: FaTools,
    library: 'react-icons/fa',
    keywords: ['tools', 'hardware', 'repair', 'construction', 'diy'],
    category: 'tools',
    description: 'Tools and hardware'
  },
  {
    name: 'Hammer',
    component: FaHammer,
    library: 'react-icons/fa',
    keywords: ['hammer', 'tool', 'construction', 'repair', 'building'],
    category: 'tools',
    description: 'Construction tools'
  },
  {
    name: 'Screwdriver',
    component: FaScrewdriver,
    library: 'react-icons/fa',
    keywords: ['screwdriver', 'tool', 'repair', 'maintenance', 'fix'],
    category: 'tools',
    description: 'Repair and maintenance tools'
  },
  {
    name: 'Wrench',
    component: FaWrench,
    library: 'react-icons/fa',
    keywords: ['wrench', 'tool', 'mechanical', 'repair', 'fix'],
    category: 'tools',
    description: 'Mechanical tools'
  },

  // Health & Beauty
  {
    name: 'Medical',
    component: FaMedkit,
    library: 'react-icons/fa',
    keywords: ['medical', 'health', 'medicine', 'healthcare', 'first aid'],
    category: 'health',
    description: 'Medical and healthcare'
  },
  {
    name: 'Pills',
    component: FaPills,
    library: 'react-icons/fa',
    keywords: ['pills', 'medicine', 'pharmacy', 'health', 'medication'],
    category: 'health',
    description: 'Pharmacy and medications'
  },
  {
    name: 'Stethoscope',
    component: FaStethoscope,
    library: 'react-icons/fa',
    keywords: ['stethoscope', 'doctor', 'medical', 'health', 'checkup'],
    category: 'health',
    description: 'Medical equipment'
  },
  {
    name: 'Eye Care',
    component: FaEye,
    library: 'react-icons/fa',
    keywords: ['eye', 'vision', 'care', 'health', 'optical'],
    category: 'health',
    description: 'Eye care and vision'
  },
  {
    name: 'Beauty',
    component: FaSprayCan,
    library: 'react-icons/fa',
    keywords: ['beauty', 'cosmetics', 'makeup', 'personal care', 'skincare'],
    category: 'beauty',
    description: 'Beauty and cosmetics'
  },
  {
    name: 'Hair',
    component: FaCut,
    library: 'react-icons/fa',
    keywords: ['hair', 'salon', 'beauty', 'cut', 'styling'],
    category: 'beauty',
    description: 'Hair care and styling'
  },

  // Baby & Kids
  {
    name: 'Baby',
    component: FaBaby,
    library: 'react-icons/fa',
    keywords: ['baby', 'kids', 'children', 'infant', 'parenting'],
    category: 'baby',
    description: 'Baby and children products'
  },

  // Pets
  {
    name: 'Pet',
    component: FaPaw,
    library: 'react-icons/fa',
    keywords: ['pet', 'animal', 'dog', 'cat', 'care'],
    category: 'pets',
    description: 'Pet care and supplies'
  },

  // Favorites & Ratings
  {
    name: 'Heart',
    component: FaHeart,
    library: 'react-icons/fa',
    keywords: ['heart', 'love', 'favorite', 'like', 'wishlist'],
    category: 'ecommerce',
    description: 'Favorites and wishlist'
  },
  {
    name: 'Star',
    component: FaStar,
    library: 'react-icons/fa',
    keywords: ['star', 'rating', 'review', 'favorite', 'quality'],
    category: 'ecommerce',
    description: 'Ratings and reviews'
  },

  // Lucide Icons (for compatibility with existing UI)
  {
    name: 'Shopping Cart (Lucide)',
    component: ShoppingCart,
    library: 'lucide-react',
    keywords: ['shopping', 'cart', 'buy', 'purchase', 'ecommerce'],
    category: 'ecommerce',
    description: 'Shopping cart (Lucide style)'
  },
  {
    name: 'Store (Lucide)',
    component: Store,
    library: 'lucide-react',
    keywords: ['store', 'shop', 'retail', 'business'],
    category: 'ecommerce',
    description: 'Store (Lucide style)'
  },
  {
    name: 'Gift (Lucide)',
    component: Gift,
    library: 'lucide-react',
    keywords: ['gift', 'present', 'surprise'],
    category: 'ecommerce',
    description: 'Gift (Lucide style)'
  },
];

export const getCategoryIcons = (category: IconCategory): IconData[] => {
  if (category === 'all') {
    return ICON_REGISTRY;
  }
  return ICON_REGISTRY.filter(icon => icon.category === category);
};

export const searchIcons = (query: string, category: IconCategory = 'all'): IconData[] => {
  const icons = getCategoryIcons(category);

  if (!query.trim()) {
    return icons;
  }

  const lowercaseQuery = query.toLowerCase().trim();

  return icons.filter(icon => {
    const searchableText = [
      icon.name,
      icon.description,
      ...icon.keywords
    ].join(' ').toLowerCase();

    return searchableText.includes(lowercaseQuery);
  });
};

export const getIconByName = (name: string): IconData | undefined => {
  return ICON_REGISTRY.find(icon => icon.name === name);
};

export const getRecentIcons = (recentIconNames: string[]): IconData[] => {
  return recentIconNames
    .map(name => getIconByName(name))
    .filter((icon): icon is IconData => icon !== undefined);
};