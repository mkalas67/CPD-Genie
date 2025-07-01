# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

## Setup API Key

This project uses the Google AI Gemini model. To use it, you need to provide an API key.

1.  Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Open the `.env` file in the root of the project.
3.  Add your API key, replacing `"YOUR_API_KEY_HERE"` with your actual key:

    ```
    GOOGLE_API_KEY="YOUR_API_KEY_HERE"
    ```

The application is configured to automatically load this key.

## Setup Firebase for Data Persistence

This project uses Firestore to store the history of generated ASOs.

### 1. Create a Firebase Project

If you don't have one already, create a new project in the [Firebase Console](https://console.firebase.google.com/).

### 2. Create a Firestore Database

- In your Firebase project, go to the **Firestore Database** section.
- Click **Create database**.
- Start in **test mode** for easy setup (you can secure it later with security rules).
- Choose a location for your database.

### 3. Get Your Firebase Config

- In your Firebase project, go to **Project settings** (click the gear icon).
- Under the **General** tab, scroll down to "Your apps".
- Click the web icon (`</>`) to create a new web app or view the config of an existing one.
- Copy the `firebaseConfig` object.

### 4. Add Config to `.env`

- Open the `.env` file in your project.
- Add the values from your `firebaseConfig` object, replacing the placeholders:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```
