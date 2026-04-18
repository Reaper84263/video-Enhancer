const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 1024 } });
const PORT = process.env.PORT || 3000;

const resolutionMap = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '2K': { width: 2048, height: 1080 },
  '4K': { width: 3840, height: 2160 },
  '8K': { width: 7680, height: 4320 }
};

function parseResolution(value) {
  if (!value) return resolutionMap['1080p'];
  if (value.includes('x') || value.includes('×')) {
    const [w, h] = value.replace('×', 'x').split('x').map((v) => Number(v));
    return { width: Math.max(320, w || 1920), height: Math.max(240, h || 1080) };
  }
  return resolutionMap[value] || resolutionMap['1080p'];
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

app.use(express.static(__dirname));

app.post('/api/enhance', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing video file upload.' });
  }

  const selectedResolution = String(req.body.resolution || '1080p');
  const selectedFps = Math.max(1, Number(req.body.fps || 30));
  const denoise = String(req.body.denoise || 'medium');

  const { width, height } = parseResolution(selectedResolution);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-enhancer-'));
  const inputPath = path.join(tempDir, `input-${Date.now()}.mp4`);
  const outputPath = path.join(tempDir, `output-${Date.now()}.mp4`);

  try {
    fs.writeFileSync(inputPath, req.file.buffer);

    let vf = `scale=${width}:${height}`;
    if (denoise === 'high') vf += ',hqdn3d';

    await runFfmpeg([
      '-y',
      '-i', inputPath,
      '-vf', vf,
      '-r', String(selectedFps),
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputPath
    ]);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="enhanced-${width}x${height}-${selectedFps}fps.mp4"`);
    fs.createReadStream(outputPath).pipe(res).on('close', () => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    res.status(500).json({ error: `Server enhancement failed: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Video Enhancer server listening on http://localhost:${PORT}`);
});
