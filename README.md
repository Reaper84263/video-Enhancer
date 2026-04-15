# Video Trimmer Project

A Next.js video trimmer that uses FFmpeg WebAssembly in the browser to export trimmed MP4 files.

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Deploy

Deploy to Vercel or another Next.js host.

## Notes

- The app loads FFmpeg assets at runtime from a CDN.
- Restricted preview sandboxes may block those downloads.
- In a normal deployment, the app should load and trim videos normally.
- Large files can be heavy in-browser, so a server-side fallback is a good future upgrade.
