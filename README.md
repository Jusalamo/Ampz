# Ampz Web App

This is a modern web application built with React, TypeScript, Tailwind CSS, and Node.js.

## Prerequisites

- Node.js (v18 or higher)
- npm (Node Package Manager)

## Project Structure

- `client/`: Frontend application (Vite + React)
- `server/`: Backend API (Express + Prisma)

## Getting Started

### 1. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 2. Database Setup

Initialize the SQLite database:
```bash
cd server
npx prisma generate
npx prisma db push
```

### 3. Running the App

**Start Backend:**
```bash
cd server
npm run dev
```

**Start Frontend:**
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

## Features

- **Events**: Explore and search for events.
- **Connect**: Swipe interface to match with other attendees.
- **Chat**: Real-time messaging (UI implemented).
- **Profile**: Manage your user profile.
