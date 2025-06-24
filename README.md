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
