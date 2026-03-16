<div align="center">
  <img src="public/favicon.ico" alt="DineDeal Logo" width="120" />
</div>

<h1 align="center">DineDeal</h1>

<p align="center">
  <strong>A Local Dining Deals and Reservation Platform</strong>
</p>

<p align="center">
  <a href="https://github.com/yadavkanishk007-crypto/dinedeal">
    <img src="https://img.shields.io/badge/Repository-GitHub-181717.svg?style=flat&logo=github" alt="Repository" />
  </a>
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase" />
</p>

<p align="center">
  <em>Empowering local dining ecosystems in India, with a focused emphasis on Tier-2 and Tier-3 cities.</em>
</p>

---

## 📖 Introduction

**DineDeal** is a technology-driven platform designed to modernize and empower local dining ecosystems. It enables customers to discover nearby restaurants, access exclusive dine-in deals, book reservations, and earn rewards for local dining. Simultaneously, it provides restaurants with a fair, transparent, and growth-oriented digital presence without imposing excessive commissions.

This repository contains the core frontend codebase of the DineDeal platform, built with modern web technologies, scalable architecture, and a strong emphasis on user experience, performance, and maintainability.

> *DineDeal is conceptualized and engineered with the belief that local businesses deserve the same quality of technology and reach as large metropolitan brands, without being burdened by unsustainable business models.*

---

## 🎯 Problem Statement

The Indian dining market is heavily skewed towards food delivery platforms that prioritize logistics over local dining experiences. While such platforms dominate urban centers, they fail to address the unique challenges faced by smaller cities.

**Key problems in the current ecosystem:**
- 💸 **High commission fees** imposed on restaurants
- 📉 **Limited visibility** for dine-in focused establishments
- 📅 **Lack of structured** reservation systems
- 🎁 **Absence of localized** reward-based customer retention
- 🛠️ **Poor digital tools** for small and medium restaurant owners

Additionally, customers in non-metro regions often lack a reliable way to discover quality local restaurants, access transparent deals, or earn loyalty benefits for offline dining experiences. DineDeal directly solves these inefficiencies by focusing on **dine-in discovery, reservations, and rewards**.

---

## 💡 Solution Overview

DineDeal acts as a digital marketplace and engagement layer between customers and restaurants. Unlike delivery-first platforms, we prioritize physical dining experiences and long-term customer relationships.

**Core Principles:**
1. 📍 **Local-first** restaurant discovery (powered by open-source maps & precise coordinate tracking).
2. 🤝 **Fair and sustainable** economics for restaurants.
3. 🏆 **Reward-driven** customer engagement.
4. 📱 **Lightweight and fast** mobile-first user experience.
5. 🚀 **Scalable architecture** for rapid city-wise expansion.

---

## ✨ Key Features

### 👤 Customer-Facing Features
- **Proximity Discovery:** Discover nearby restaurants using precise location-based routing (Haversine formula).
- **Exclusive Deals:** Access exclusive dine-in deals, coupons, and restaurant offers.
- **Table Booking:** Book table reservations directly from the platform.
- **Loyalty Program:** Earn cashback and loyalty rewards points for offline dining.
- **Map Integration:** Quick "Get Directions" buttons linking directly to Google Maps navigation.
- **Offline Reliability:** Humorous network banners and offline-first capabilities.

### 🏪 Restaurant-Facing Features
- **Profile Management:** Seamless onboarding and restaurant profile verification.
- **Automated Geocoding:** Address updates automatically fetch precise latitude/longitude via OpenStreetMap.
- **Deal Management:** Deal and offer creation and management.
- **Reservation Tracking:** Monitor and capacity manage upcoming bookings.
- **Zero Commission Model:** Access fair analytics and tools without massive overheads.

---

## 🛠️ Technology Stack

**Frontend Framework & Tooling**
- **React** for component-based UI architecture
- **Vite** for high-performance bundling and development
- **TypeScript** for type safety and maintainable code

**Styling & UI**
- **Tailwind CSS** for utility-first, responsive styling
- **Framer Motion** for butter-smooth micro-animations
- **Radix UI** for accessible, composable UI primitives

**State & Form Management**
- **React Hooks** for local and shared state
- **React Hook Form** for performant form handling
- **Zod** for schema-based validation and data integrity

**Database & APIs**
- **Supabase** (PostgreSQL) for auth, database, real-time subscriptions, and edge functions.
- **Razorpay** for secure payments and checkouts.
- **Photon (OpenStreetMap)** for free, lightweight, privacy-focused geolocation and city searches.

---

## 📂 Project Structure

```text
dinedeal/
│
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page-level components
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # Global State (Auth, LocationContext, etc.)
│   ├── utils/             # Helper utilities
│   ├── styles/            # Global styling
│   ├── assets/            # Images and static assets
│   └── main.tsx           # Application entry point
│
├── public/                # Public assets
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
└── README.md              # Project documentation
```

---

## 🏗️ Architecture Philosophy

The architecture follows a modular, component-driven approach where each feature is broken down into reusable UI primitives and composable logic units.

- **High reusability** of components
- **Minimal coupling** between features
- **Clear separation** of UI and business logic
- **Offline-first resilience** integrated natively

The frontend is intentionally decoupled from backend logic, allowing flexibility in choosing or evolving backend technologies without requiring major frontend refactors.

---

## 🚀 Deployment Strategy

The project is designed for deployment on modern serverless platforms, specifically configured for **Vercel**.

- **Automatic builds** triggered from GitHub CI/CD.
- **Optimized static asset serving**.
- **Edge-ready performance** out of the box.

### Build Command
```bash
npm run build
```
_Output Directory: `dist`_

---

## 📈 Scalability and Future Roadmap

Planned and upcoming enhancements include:
- Backend APIs for enhanced business analytics.
- Admin moderation and approval workflows.
- Progressive Web App (PWA) and mobile wrappers (React Native / Flutter consideration).
- Advanced Edge AI recommendation and personalization engines.

The system is intentionally built as a foundation that can evolve into a full-stack, production-grade platform supporting multiple cities and high traffic volumes.

---

## 🔒 Security and Best Practices

Security is treated as a core requirement:
- **Environment-based** configuration management.
- **Strict input validation** and schema enforcement (via Zod).
- **Secure payment gateways** with Node.js webhook verification (Razorpay).
- **Row-Level Security (RLS)** implemented deeply in the Supabase layers.

---

## 🤝 Contribution Guidelines

Contributions are welcome under structured review. All contributions must follow these guidelines:
1. Clean, readable, and maintainable code.
2. Consistent formatting and naming conventions.
3. Descriptive and meaningful commit messages.
4. Feature-focused pull requests with clear intent.

---

## 👨‍💻 Founding and Ownership

This project is co-founded and technically led by **Kanishk Yadav**. The system architecture, frontend engineering decisions, and long-term technology roadmap are authored and maintained under the role of Co-Founder and Chief Technology Officer.

> **Disclaimer:** This repository represents an actively evolving startup project. Features, designs, and architectural decisions may change as the product matures, user feedback is incorporated, and business requirements evolve.

---

<div align="center">
  <p>Made with ❤️ to redefine local dining.</p>
</div>
