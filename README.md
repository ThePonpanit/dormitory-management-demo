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

1. **Clone the repository and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file and replace the placeholder values with your actual Firebase project configuration:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key_here
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
     ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Build for production:**

   ```bash
   npm run build
   ```

5. **Deploy to Firebase:**
   ```bash
   npm run deploy
   ```

## Environment Variables

This project uses environment variables to store sensitive Firebase configuration. The following variables are required:

- `VITE_FIREBASE_API_KEY`: Your Firebase project API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase authentication domain
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID (optional)

**Note:** All environment variables for Vite must be prefixed with `VITE_` to be accessible in the frontend code.
