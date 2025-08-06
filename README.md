# Dorm App

This is a dorm management application built with Vue.js and Firebase.

## Features

- User authentication (login, registration)
- Role-based access control (admin, staff, tenant, guest)
- Room management (add, edit, delete rooms)
- Tenant management (add, remove tenants from rooms)
- Monthly billing generation
- PDF and image export of billing statements
- PromptPay QR code generation for payments

## Tech Stack

- **Frontend:**
  - Vue.js (with Vue Router and Pinia)
  - Tailwind CSS
- **Backend:**
  - Firebase Authentication
  - Firebase Firestore
  - Firebase Functions
- **Deployment:**
  - Firebase Hosting

## Project Structure

The project is organized into the following main directories:

- `functions/`: Contains the Firebase Functions for backend logic (e.g., user management).
- `public/`: Public assets and the main `index.html` file.
- `src/`: The main source code for the Vue.js application.
  - `assets/`: CSS, images, and other static assets.
  - `components/`: Reusable Vue components.
  - `router/`: Vue Router configuration.
  - `stores/`: Pinia stores for state management.
  - `utils/`: Utility functions (e.g., PDF generation, PromptPay QR code).
  - `views/`: Vue components that represent the different pages of the application.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Deploy to Firebase:**
   ```bash
   npm run deploy
   ```