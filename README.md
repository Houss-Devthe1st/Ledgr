# 📒 Ledgr

A clean, offline-first subscription tracker for iOS and Android. Keep tabs on every recurring charge, monitor your monthly spend, and set a budget — all stored locally on your device.

## ✨ Features

- 📋 **Subscription management** — Add, edit, and delete subscriptions with name, price, billing cycle, category, payment method, and renewal date
- 🔖 **Status tracking** — Mark subscriptions as active, paused, or cancelled; filter the list by status
- 💰 **Budget cap** — Set a monthly spending limit and see a live progress bar across the app
- 📊 **Insights dashboard** — Monthly spend summary, yearly projection, status breakdown donut chart, spend by category, top spenders, billing cycle breakdown, and upcoming 30-day renewals
- 📴 **Offline-first** — All data is stored locally in SQLite; no internet connection required after sign-in
- 🔐 **Authentication** — Secure sign-in via Clerk (email, Google, etc.)

## 🛠 Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Routing | Expo Router 6 (file-based) |
| Styling | NativeWind 5 (Tailwind CSS) |
| Auth | Clerk (`@clerk/expo`) |
| Database | expo-sqlite 16 |
| Charts | react-native-svg |
| Date handling | dayjs |
| Language | TypeScript |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- A [Clerk](https://clerk.com) account — free tier is sufficient

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-username/ledgr.git
   cd ledgr
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Clerk**

   Create a `.env` file in the project root:

   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

   You can find your publishable key in the [Clerk dashboard](https://dashboard.clerk.com) under **API Keys**.

4. **Start the development server**

   ```bash
   npx expo start
   ```

   Then press `a` for Android emulator, `i` for iOS simulator, or scan the QR code with [Expo Go](https://expo.dev/go).

## 📁 Project Structure

```
app/
├── (auth)/          # Sign-in / sign-up screens
├── (tabs)/          # Main tab screens (Home, Subscriptions, Insights, Settings)
│   ├── index.tsx    # Home — balance card, overdue & upcoming renewals
│   ├── Subscriptions.tsx
│   ├── insights.tsx
│   └── settings.tsx
└── subscriptions/   # Create / edit subscription form

lib/
├── db/              # SQLite client, migrations, repositories
├── subscriptions.tsx # Subscriptions context + hook
├── budget.tsx       # Budget context + hook
└── utils.ts         # Currency formatting, billing cycle helpers

constants/           # Theme, icons, static data
components/          # Reusable UI components (SubscriptionCard, etc.)
```

## 📄 License

MIT
