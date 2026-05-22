<div align="center">

# RealtyPro — Real Estate Mobile App

**A modern, open-source real estate platform built with React Native and Expo.**

React Native · TypeScript · Expo · Non-Commercial

[![React Native](https://img.shields.io/badge/React_Native-0.81-61dafb?style=flat-square&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-EF9421?style=flat-square&logo=creativecommons&logoColor=white)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

</div>

---

## Overview

**RealtyPro** is a production-ready, open-source real estate mobile application built with React Native and Expo. It provides a complete user interface for browsing properties, managing favorites, calculating mortgages, and contacting agents.

The app is fully TypeScript, mobile-first, and deployable to both iOS and Android via Expo.

### ⚠️ Backend Status

**The backend for this application is not currently active.** To use RealtyPro, you must create and deploy your own backend API. See [Creating Your Backend](#creating-your-backend) below.

## Features

- **Property Search** — Browse and filter properties by location, price, type, and characteristics
- **Favorites Management** — Save properties for later comparison and review
- **Mortgage Calculator** — Calculate monthly payments for mortgages and personal loans
- **Blog** — Read articles and news about real estate
- **Contact Forms** — Submit inquiries and contact the support team
- **User Authentication** — Register, login, and manage user accounts
- **Property Assistant** — Chat interface for property inquiries
- **Responsive Design** — Works on phones and tablets

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 (strict mode) |
| Styling | NativeWind 4.1 (Tailwind CSS) |
| Navigation | React Navigation 7 |
| State | React Context + AsyncStorage |
| Icons | Ionicons |
| HTTP | Fetch API |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Xcode) or Android Emulator (Android Studio) OR physical device with Expo Go app

### Installation

```bash
git clone https://github.com/stefanutz02/realty-pro.git
cd realty-pro
npm install
```

### Running Locally

**With Expo Go (Easiest):**
```bash
npm start
# Scan QR code with Expo Go app on your device
```

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Web:**
```bash
npm run web
```

## Creating Your Backend

RealtyPro communicates with a REST API. Follow these steps to create a backend:

### Backend Architecture

Your backend should implement the following endpoints:

**Authentication:**
- `POST /api/v1/auth/login` — User login
- `POST /api/v1/auth/register` — User registration
- `POST /api/v1/auth/forgot-password` — Password reset

**Properties:**
- `GET /api/v1/properties` — List properties (with filters)
- `GET /api/v1/properties/:id` — Property details

**Favorites:**
- `GET /api/v1/favorites` — Get user's favorites
- `POST /api/v1/favorites/add` — Add favorite
- `POST /api/v1/favorites/remove` — Remove favorite

**Blog:**
- `GET /api/v1/blog` — List blog articles
- `GET /api/v1/blog/:id` — Article details

**Contact:**
- `POST /api/v1/contact` — Submit contact form
- `POST /api/v1/send-email` — Send email

**Chat:**
- `POST /api/v1/chat` — Send chat message

### Technology Recommendations

**Stack:**
- Runtime: Node.js 18+
- Framework: Express.js, Fastify, or similar
- Database: PostgreSQL, MongoDB, or MySQL
- Authentication: JWT (JSON Web Tokens)

### Example Backend (Node.js + Express)

```bash
# Create backend project
mkdir realty-pro-backend
cd realty-pro-backend
npm init -y

# Install dependencies
npm install express cors dotenv jsonwebtoken bcryptjs
npm install --save-dev typescript ts-node @types/node @types/express
```

**Create `src/app.ts`:**

```typescript
import express, { Express } from 'express';
import cors from 'cors';

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  // Implement login logic
  res.json({ token: 'jwt_token_here', user: {} });
});

app.post('/api/v1/auth/register', (req, res) => {
  // Implement registration logic
  res.json({ token: 'jwt_token_here', user: {} });
});

// Properties endpoints
app.get('/api/v1/properties', (req, res) => {
  // Return properties from database
  res.json({ properties: [] });
});

app.get('/api/v1/properties/:id', (req, res) => {
  // Return property details
  res.json({ property: {} });
});

// Favorites endpoints
app.get('/api/v1/favorites', (req, res) => {
  res.json({ favorites: [] });
});

app.post('/api/v1/favorites/add', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/v1/favorites/remove', (req, res) => {
  res.json({ ok: true });
});

// Blog endpoints
app.get('/api/v1/blog', (req, res) => {
  res.json({ articles: [] });
});

app.get('/api/v1/blog/:id', (req, res) => {
  res.json({ article: {} });
});

// Contact endpoints
app.post('/api/v1/contact', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/v1/send-email', (req, res) => {
  res.json({ status: 'success' });
});

// Chat endpoint
app.post('/api/v1/chat', (req, res) => {
  res.json({ message: 'AI response here' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Create `package.json` scripts:**

```json
{
  "scripts": {
    "dev": "ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  }
}
```

**Run the backend:**

```bash
npm run dev
```

### Connecting the App to Your Backend

Edit `src/config/api.ts` in the app:

```typescript
export const API_BASE_URL = 'https://your-backend-url.com';
```

Or set an environment variable:

```bash
export REALTY_API_BASE_URL=https://your-backend-url.com
```

## Configuration

### API Endpoints

All API endpoints are configured in `src/config/api.ts`. Update `API_BASE_URL` to point to your backend.

### Default Location

The app defaults to showing properties from a specific location. Change the default in `src/screens/Search.tsx`:

```typescript
const DEFAULT_COUNTY_ID = 'your-location-id';
```

### Customization

**Colors:**
- Primary blue: `#0A84FF`
- Secondary: `#0066CC`
- Accent: `#87CEEB`

Update colors in component files or create a theme configuration.

**App Name & Version:**
- Edit `app.json` for app name, version, and bundle IDs

**Social Links & Contact:**
- Edit `src/components/AppFooter.tsx` for contact information

## Building for Production

### Android

```bash
eas build --platform android
```

### iOS

```bash
eas build --platform ios
```

Requires an [Expo Application Services](https://expo.dev) account.

## Project Structure

```
src/
├── config/
│   └── api.ts                 # API configuration
├── context/
│   ├── AuthContext.tsx        # Authentication state
│   └── AuthModal.tsx          # Login/register UI
├── navigation/
│   ├── RootNavigator.tsx      # Root stack navigator
│   ├── TabsNavigator.tsx      # Tab-based navigation
│   ├── FloatingTabBar.tsx     # Custom tab bar
│   └── navigationRef.tsx      # Deep linking
├── screens/
│   ├── Search.tsx             # Property search
│   ├── PropertyDetailScreen.tsx
│   ├── AddProperty.tsx        # Submit property
│   ├── Blog.tsx               # Articles
│   ├── BlogDetailScreen.tsx   # Article reader
│   ├── Contact.tsx            # Contact form
│   ├── Credite.tsx            # Mortgage calculator
│   ├── FavoritesScreen.tsx    # Saved properties
│   └── PropertyAssistant.tsx  # Chat interface
├── components/
│   ├── AppLoader.tsx          # Splash screen
│   ├── AppFooter.tsx          # Footer
│   ├── AuthModal.tsx
│   ├── BottomSheetSelector.tsx
│   ├── CreditCalculatorModal.tsx
│   └── ... other components
└── assets/
    ├── logo.svg
    ├── favicon.svg
    └── ... other assets
```

## Troubleshooting

**Cannot connect to API:**
- Verify `API_BASE_URL` in `src/config/api.ts`
- Ensure your backend is running and accessible
- Check network connectivity

**Build errors:**
```bash
npm run type-check
```

**Port 8081 in use:**
```bash
npx expo start --clear
```

**Missing modules:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## License

Licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0).

**You can:**
- ✅ Use for personal, educational, and non-profit projects
- ✅ Copy, modify, and distribute with attribution
- ✅ Share improvements under the same license

**You cannot:**
- ❌ Use for commercial purposes
- ❌ Sell or monetize this software
- ❌ Use in commercial products or services

See [LICENSE](./LICENSE) for details.

---

**Built by Stefan Vasilescu · 2026**

For commercial licensing, contact: contact@stefanvasilescu.com
