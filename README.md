# video-Enhancer

## Run with server-side FFmpeg (recommended)

1. Install dependencies:
   ```bash
   npm install
   ```
   Ensure ffmpeg CLI is installed and available on your PATH.

2. Start the app:
   ```bash
   npm start
   ```
   Open http://localhost:3000.

The app now tries server-side processing first (POST /api/enhance) to avoid browser WebAssembly memory limits.
If server-side processing fails, it falls back to browser FFmpeg.