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
  address: string;
  openHours: string;
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
  },
];
