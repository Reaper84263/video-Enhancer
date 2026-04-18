
# video-Enhancer

## Run with server-side FFmpeg (recommended)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure `ffmpeg` CLI is installed and available on your PATH.
3. Start the app:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000`.

The app now tries server-side processing first (`POST /api/enhance`) to avoid browser WebAssembly memory limits.
If server-side processing fails, it falls back to browser FFmpeg.


### Notes
- Server uploads now use disk-based temporary files (instead of in-memory buffers) for better reliability with larger videos (e.g. 200MB+)
