import restaurant1 from "@/assets/restaurant-1.jpg";
import restaurant2 from "@/assets/restaurant-2.jpg";
import restaurant3 from "@/assets/restaurant-3.jpg";
import restaurant4 from "@/assets/restaurant-4.jpg";
import restaurant5 from "@/assets/restaurant-5.jpg";

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  rating: number;
  discount: number;
  maxDiscount: number;
  imageUrl: string;
  isPopular?: boolean;
  description: string;
  offers: Offer[];
  address: string;
  openHours: string;
}

export interface Offer {
  id: string;
  title: string;
  discount: number;
  maxDiscount: number;
  validUntil: string;
  terms: string;
}

export interface Transaction {
  id: string;
  restaurantName: string;
  amount: number;
  discount: number;
  saved: number;
  rewardsEarned: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "The Brick House",
    cuisine: "Continental • Fine Dining",
    distance: "0.8 km",
    rating: 4.8,
    discount: 20,
    maxDiscount: 500,
    imageUrl: restaurant1,
    isPopular: true,
    description: "Experience exquisite continental cuisine in a warm, brick-lined ambiance with craft cocktails and premium wines.",
    address: "123 Civil Lines, Jhansi",
    openHours: "12:00 PM - 11:30 PM",
    offers: [
      {
        id: "o1",
        title: "Flat 20% Off",
        discount: 20,
        maxDiscount: 500,
        validUntil: "Dec 31, 2024",
        terms: "Valid on orders above ₹500. Not applicable with other offers.",
      },
      {
        id: "o2",
        title: "Happy Hours",
        discount: 30,
        maxDiscount: 300,
        validUntil: "Dec 31, 2024",
        terms: "Valid 4PM-7PM only on beverages.",
      },
    ],
  },
  {
    id: "2",
    name: "Sakura Sushi",
    cuisine: "Japanese • Sushi Bar",
    distance: "1.2 km",
    rating: 4.6,
    discount: 15,
    maxDiscount: 400,
    imageUrl: restaurant2,
    isPopular: false,
    description: "Authentic Japanese sushi and ramen in a vibrant neon-lit atmosphere. Fresh fish flown in weekly.",
    address: "456 Sadar Bazaar, Jhansi",
    openHours: "11:30 AM - 10:30 PM",
    offers: [
      {
        id: "o3",
        title: "15% Off All Sushi",
        discount: 15,
        maxDiscount: 400,
        validUntil: "Dec 31, 2024",
        terms: "Valid on dine-in orders only.",
      },
    ],
  },
  {
    id: "3",
    name: "La Trattoria",
    cuisine: "Italian • Family Style",
    distance: "2.1 km",
    rating: 4.7,
    discount: 25,
    maxDiscount: 600,
    imageUrl: restaurant3,
    isPopular: true,
    description: "Rustic Italian trattoria with wood-fired pizzas, fresh pasta, and an extensive wine selection.",
    address: "789 Sipri Bazaar, Jhansi",
    openHours: "12:00 PM - 11:00 PM",
    offers: [
      {
        id: "o4",
        title: "Family Feast 25% Off",
        discount: 25,
        maxDiscount: 600,
        validUntil: "Dec 31, 2024",
        terms: "Valid for groups of 4 or more.",
      },
    ],
  },
  {
    id: "4",
    name: "Skyline Terrace",
    cuisine: "Multi-Cuisine • Rooftop",
    distance: "3.5 km",
    rating: 4.5,
    discount: 18,
    maxDiscount: 450,
    imageUrl: restaurant4,
    isPopular: false,
    description: "Stunning rooftop dining with panoramic city views. Perfect for sunset dinners and celebrations.",
    address: "101 Elite Chowk, Jhansi",
    openHours: "5:00 PM - 12:00 AM",
    offers: [
      {
        id: "o5",
        title: "Sunset Special",
        discount: 18,
        maxDiscount: 450,
        validUntil: "Dec 31, 2024",
        terms: "Valid 5PM-7PM on weekdays.",
      },
    ],
  },
  {
    id: "5",
    name: "The Brew Barn",
    cuisine: "Cafe • Specialty Coffee",
    distance: "0.5 km",
    rating: 4.9,
    discount: 10,
    maxDiscount: 200,
    imageUrl: restaurant5,
    isPopular: true,
    description: "Industrial-chic cafe serving artisanal coffee, fresh pastries, and all-day brunch favorites.",
    address: "222 Manik Chowk, Jhansi",
    openHours: "8:00 AM - 9:00 PM",
    offers: [
      {
        id: "o6",
        title: "Coffee Lover's Deal",
        discount: 10,
        maxDiscount: 200,
        validUntil: "Dec 31, 2024",
        terms: "Valid on all beverages.",
      },
    ],
  },
];

export const transactions: Transaction[] = [
  {
    id: "t1",
    restaurantName: "The Brick House",
    amount: 2500,
    discount: 20,
    saved: 500,
    rewardsEarned: 50,
    date: "Dec 28, 2024",
    status: "completed",
  },
  {
    id: "t2",
    restaurantName: "La Trattoria",
    amount: 1800,
    discount: 25,
    saved: 450,
    rewardsEarned: 36,
    date: "Dec 25, 2024",
    status: "completed",
  },
  {
    id: "t3",
    restaurantName: "The Brew Barn",
    amount: 650,
    discount: 10,
    saved: 65,
    rewardsEarned: 13,
    date: "Dec 22, 2024",
    status: "completed",
  },
  {
    id: "t4",
    restaurantName: "Sakura Sushi",
    amount: 3200,
    discount: 15,
    saved: 400,
    rewardsEarned: 64,
    date: "Dec 18, 2024",
    status: "completed",
  },
  {
    id: "t5",
    restaurantName: "Skyline Terrace",
    amount: 4500,
    discount: 18,
    saved: 450,
    rewardsEarned: 90,
    date: "Dec 15, 2024",
    status: "completed",
  },
];

export const userStats = {
  totalSaved: 2450,
  rewardPoints: 320,
  totalTransactions: 12,
  redeemableAmount: 150,
  lifetimeSavings: 8750,
  favoriteRestaurants: 5,
};
