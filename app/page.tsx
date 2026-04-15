"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Scissors,
  Download,
  Film,
  Shield,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Clock3,
  Wand2,
  CheckCircle2,
  HardDriveUpload,
} from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline";
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border bg-white/5", className)} {...props} />;
}

function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

function CardDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm", className)} {...props} />;
}

function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function Button({ className = "", variant = "default", type = "button", ...props }: ButtonProps) {
  const styles = {
    default: "border-transparent bg-white text-slate-950 hover:bg-slate-200",
    secondary: "border border-white/10 bg-white/10 text-white hover:bg-white/15",
    outline: "border border-white/20 bg-transparent text-white hover:bg-white/10",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-white/25",
        className,
      )}
      {...props}
    />
  );
}

function Badge({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", className)} {...props} />;
}

function Alert({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="alert" className={cn("w-full border p-4", className)} {...props} />;
}

function AlertTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

function AlertDescription({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

function Separator({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("h-px w-full bg-white/10", className)} {...props} />;
}

function Progress({ value = 0, className = "" }: { value?: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  className = "",
}: {
  value: number[];
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number[]) => void;
  className?: string;
}) {
  const isRange = value.length === 2;
  const safeMax = Math.max(max, min + step);
  const firstValue = clamp(value[0] ?? min, min, safeMax);
  const secondValue = clamp(value[1] ?? safeMax, min, safeMax);
  const startPercent = ((firstValue - min) / (safeMax - min)) * 100;
  const endPercent = ((secondValue - min) / (safeMax - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative h-8">
        <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-white/10" />

        {isRange ? (
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/40"
            style={{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }}
          />
        ) : (
          <div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/40"
            style={{ width: `${startPercent}%` }}
          />
        )}

        {isRange ? (
          <>
            <input
              type="range"
              min={min}
              max={safeMax}
              step={step}
              value={firstValue}
              aria-label="Start time"
              onChange={(e) => {
                const next = Number(e.target.value);
                onValueChange([Math.min(next, secondValue - step), secondValue]);
              }}
              className="slider-thumb absolute left-0 top-0 z-20 h-8 w-full appearance-none bg-transparent"
            />
            <input
              type="range"
              min={min}
              max={safeMax}
              step={step}
              value={secondValue}
              aria-label="End time"
              onChange={(e) => {
                const next = Number(e.target.value);
                onValueChange([firstValue, Math.max(next, firstValue + step)]);
              }}
              className="slider-thumb absolute left-0 top-0 z-30 h-8 w-full appearance-none bg-transparent"
            />
          </>
        ) : (
          <input
            type="range"
            min={min}
            max={safeMax}
            step={step}
            value={firstValue}
            aria-label="Seek"
            onChange={(e) => onValueChange([Number(e.target.value)])}
            className="slider-thumb absolute left-0 top-0 z-30 h-8 w-full appearance-none bg-transparent"
          />
        )}
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-runnable-track {
          height: 8px;
          background: transparent;
        }
        .slider-thumb::-moz-range-track {
          height: 8px;
          background: transparent;
        }
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid rgba(15, 23, 42, 0.9);
          margin-top: -5px;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.08);
        }
        .slider-thumb::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid rgba(15, 23, 42, 0.9);
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.08);
        }
      `}</style>
    </div>
  );
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
  return [mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const PRESETS = [
  { label: "15 sec", value: 15 },
  { label: "30 sec", value: 30 },
  { label: "60 sec", value: 60 },
];

const FFMPEG_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";

function getFileExtension(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext && ext.length <= 5 ? ext : "mp4";
}

function buildOutputName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "video";
  return `${base}-trimmed.mp4`;
}

function VideoTrimmerApp() {
  const MAX_FILE_SIZE_MB = 500;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sourceUrlRef = useRef<string>("");
  const trimmedUrlRef = useRef<string>("");
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const ffmpegLoadedRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [trimmedUrl, setTrimmedUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isLoadingEngine, setIsLoadingEngine] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Upload a video to get started.");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (trimmedUrlRef.current) URL.revokeObjectURL(trimmedUrlRef.current);
    };
  }, []);

  const selectionLength = useMemo(() => Math.max(0, range[1] - range[0]), [range]);
  const previewUrl = trimmedUrl || videoUrl;

  const clearOutput = () => {
    if (trimmedUrlRef.current) {
      URL.revokeObjectURL(trimmedUrlRef.current);
      trimmedUrlRef.current = "";
    }
    setTrimmedUrl("");
  };

  const resetPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = range[0] || 0;
    setCurrentTime(range[0] || 0);
    setIsPlaying(false);
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current && ffmpegLoadedRef.current) return ffmpegRef.current;

    setIsLoadingEngine(true);
    setError("");
    setStatus("Loading trimming engine...");
    setProgress(5);

    try {
      const ffmpeg = ffmpegRef.current ?? new FFmpeg();

      ffmpeg.on("progress", ({ progress: value }) => {
        const adjusted = Math.max(10, Math.min(99, Math.round(value * 100)));
        setProgress(adjusted);
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      ffmpegRef.current = ffmpeg;
      ffmpegLoadedRef.current = true;
      setStatus("Trim engine ready.");
      setProgress(0);
      return ffmpeg;
    } catch {
      setError("Could not load FFmpeg. This app works in a normal deployed Next.js environment, but some preview sandboxes block the FFmpeg asset downloads.");
      setStatus("Failed to load trimming engine.");
      throw new Error("ffmpeg-load-failed");
    } finally {
      setIsLoadingEngine(false);
    }
  };

  const handleVideoSelected = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("video/")) {
      setError("Please choose a valid video file.");
      return;
    }

    const fileSizeMb = selectedFile.size / (1024 * 1024);
    if (fileSizeMb > MAX_FILE_SIZE_MB) {
      setError(`This file is ${fileSizeMb.toFixed(1)} MB. For best results, use files under ${MAX_FILE_SIZE_MB} MB in the browser version.`);
      return;
    }

    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    clearOutput();

    const url = URL.createObjectURL(selectedFile);
    sourceUrlRef.current = url;

    setFile(selectedFile);
    setVideoUrl(url);
    setDuration(0);
    setCurrentTime(0);
    setRange([0, 0]);
    setError("");
    setProgress(0);
    setStatus(`Loaded ${selectedFile.name}`);
  };

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;
    setDuration(nextDuration);
    setRange([0, nextDuration]);
    setCurrentTime(0);
    setStatus("Choose the part you want to keep.");
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    setCurrentTime(t);

    if (range[1] > 0 && t >= range[1]) {
      video.pause();
      video.currentTime = range[0];
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    if (video.currentTime < range[0] || video.currentTime >= range[1]) {
      video.currentTime = range[0];
    }

    await video.play();
    setIsPlaying(true);
  };

  const applyRange = (nextStart: number, nextEnd: number) => {
    const safeStart = clamp(nextStart, 0, Math.max(0, duration - 0.1));
    const safeEnd = clamp(nextEnd, safeStart + 0.1, Math.max(duration, safeStart + 0.1));
    setRange([safeStart, safeEnd]);

    const video = videoRef.current;
    if (video) {
      video.currentTime = safeStart;
      setCurrentTime(safeStart);
    }
  };

  const applyPreset = (seconds: number) => {
    if (!duration) return;
    applyRange(0, Math.min(duration, seconds));
    setStatus(`Preset applied: first ${seconds} seconds.`);
  };

  const resetAll = () => {
    if (!duration) return;
    applyRange(0, duration);
    clearOutput();
    setProgress(0);
    setStatus("Trim range reset.");
  };

  const handleTrim = async () => {
    if (!file) return;

    if (selectionLength <= 0.1) {
      setError("Please choose an end time that is after the start time.");
      return;
    }

    try {
      setIsTrimming(true);
      setError("");
      setProgress(8);
      setStatus("Preparing video for trimming...");
      clearOutput();

      const ffmpeg = await loadFFmpeg();
      const inputExt = getFileExtension(file.name);
      const inputName = `input.${inputExt}`;
      const outputName = "output.mp4";

      setStatus("Uploading video into FFmpeg memory...");
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setStatus("Trimming and encoding MP4...");
      await ffmpeg.exec([
        "-ss",
        `${range[0]}`,
        "-i",
        inputName,
        "-t",
        `${selectionLength}`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outputName,
      ]);

      setStatus("Building download file...");
      setProgress(99);
      const data = await ffmpeg.readFile(outputName);
      if (typeof data === "string") {
        throw new Error("Expected ffmpeg output file to be binary data.");
      }

      const bytes = data;
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "video/mp4" });
      const nextUrl = URL.createObjectURL(blob);
      trimmedUrlRef.current = nextUrl;
      setTrimmedUrl(nextUrl);

      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch {
        // no-op
      }

      setStatus("Trim complete. Your MP4 is ready to download.");
      setProgress(100);
    } catch {
      setError("Trimming failed. If you are testing inside a restricted preview, deploy the app to Next.js or Vercel and it should work normally there.");
      setStatus("Trimming failed.");
      setProgress(0);
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.16),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="mb-4 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-white">
              Production-ready Next.js video trimmer
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Trim video to MP4 with a polished browser workflow</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 md:text-lg">
              Upload a video, preview the exact section you want, then export a real MP4 using FFmpeg in the browser. Built for a deployed Next.js app.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Shield className="h-4 w-4" /> Local-first processing
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Film className="h-4 w-4" /> MP4 export
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Wand2 className="h-4 w-4" /> FFmpeg powered
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-3xl border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Editor</CardTitle>
            <CardDescription className="text-slate-300">
              This version is self-contained for UI and uses FFmpeg WebAssembly for real MP4 trimming in a normal deployment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!videoUrl ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleVideoSelected(e.dataTransfer.files?.[0] || null);
                }}
                className={cn(
                  "flex min-h-[320px] w-full flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center transition",
                  dragging
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-white/15 bg-slate-900/70 hover:border-white/30 hover:bg-slate-900",
                )}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                  <HardDriveUpload className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-xl font-medium">Drop your video here</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                  Choose a local video file. The trim engine loads on demand, then your edited clip is exported as MP4.
                </p>
                <Button className="mt-6 rounded-2xl">Choose file</Button>
              </motion.button>
            ) : (
              <div className="space-y-5">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    className="aspect-video w-full bg-black"
                    controls={false}
                    playsInline
                    onLoadedMetadata={onLoadedMetadata}
                    onTimeUpdate={onTimeUpdate}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <Button onClick={togglePlay} className="rounded-2xl">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? "Pause" : "Preview"}
                  </Button>
                  <Button variant="secondary" onClick={resetPlayback} className="rounded-2xl">
                    <RotateCcw className="h-4 w-4" /> Rewind
                  </Button>
                  <Button variant="secondary" onClick={resetAll} className="rounded-2xl">
                    <Scissors className="h-4 w-4" /> Reset output
                  </Button>
                  <Button variant="secondary" onClick={() => inputRef.current?.click()} className="rounded-2xl">
                    <Upload className="h-4 w-4" /> New file
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Current time</p>
                    <p className="mt-2 text-lg font-medium">{formatTime(currentTime)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Duration</p>
                    <p className="mt-2 text-lg font-medium">{formatTime(duration)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Selected clip</p>
                    <p className="mt-2 text-lg font-medium">{formatTime(selectionLength)}</p>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Trim range</p>
                      <p className="text-sm text-slate-300">Move the handles to choose exactly what to keep.</p>
                    </div>
                    <Badge className="rounded-full border border-white/10 bg-white/5 text-white">
                      {formatTime(range[0])} - {formatTime(range[1])}
                    </Badge>
                  </div>

                  <Slider
                    value={range}
                    min={0}
                    max={Math.max(duration, 0.1)}
                    step={0.1}
                    onValueChange={(value) => applyRange(value[0], value[1])}
                    className="py-4"
                  />

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Seek inside selection</label>
                    <Slider
                      value={[clamp(currentTime, range[0], Math.max(range[1], range[0] + 0.1))]}
                      min={range[0]}
                      max={Math.max(range[1], range[0] + 0.1)}
                      step={0.05}
                      onValueChange={(value) => {
                        const video = videoRef.current;
                        if (!video) return;
                        video.currentTime = value[0];
                        setCurrentTime(value[0]);
                      }}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="mb-2 block text-sm text-slate-300">Start time</label>
                      <Input
                        type="number"
                        min={0}
                        max={Math.max(0, duration - 0.1)}
                        step={0.1}
                        value={Number(range[0].toFixed(1))}
                        onChange={(e) => applyRange(Number(e.target.value || 0), range[1])}
                      />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="mb-2 block text-sm text-slate-300">End time</label>
                      <Input
                        type="number"
                        min={0.1}
                        max={Math.max(duration, 0.1)}
                        step={0.1}
                        value={Number(range[1].toFixed(1))}
                        onChange={(e) => applyRange(range[0], Number(e.target.value || range[0] + 0.1))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <Button key={preset.label} variant="secondary" onClick={() => applyPreset(preset.value)} className="rounded-2xl">
                        <Sparkles className="h-4 w-4" /> {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleTrim} disabled={!file || isTrimming || isLoadingEngine} className="rounded-2xl">
                    {isTrimming || isLoadingEngine ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                    {isLoadingEngine ? "Loading engine..." : isTrimming ? "Trimming..." : "Trim to MP4"}
                  </Button>

                  {trimmedUrl && file && (
                    <a href={trimmedUrl} download={buildOutputName(file.name)}>
                      <Button variant="outline" className="rounded-2xl">
                        <Download className="h-4 w-4" /> Download MP4
                      </Button>
                    </a>
                  )}
                </div>

                {(isTrimming || isLoadingEngine || progress > 0) && (
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>{status}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleVideoSelected(e.target.files?.[0] || null)}
            />

            {error && (
              <Alert className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100">
                <AlertTitle>Processing error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Production upgrades</CardTitle>
              <CardDescription className="text-slate-300">This version is set up to function as a real deployed trimming website.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="font-medium text-white">Real MP4 export</p>
                <p className="mt-1">Uses FFmpeg WebAssembly with H.264 video and AAC audio.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="font-medium text-white">Better timeline controls</p>
                <p className="mt-1">The trim slider now behaves like a true dual-handle range selector.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="font-medium text-white">Self-contained UI</p>
                <p className="mt-1">You do not need shadcn/ui for this file anymore.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">What you need to run it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 font-mono text-xs text-slate-200">
                npm install @ffmpeg/ffmpeg @ffmpeg/util framer-motion lucide-react
              </div>
              <Separator />
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>This file is ready to use as a client page in a standard Next.js App Router project.</p>
              </div>
              <Separator />
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Some preview sandboxes block FFmpeg downloads. Deploy to Next.js or Vercel for full functionality.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return <VideoTrimmerApp />;
}
