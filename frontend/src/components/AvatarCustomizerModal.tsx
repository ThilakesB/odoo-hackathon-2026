import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  Image as ImageIcon,
  Link as LinkIcon,
  RotateCcw,
  Check,
  RefreshCw,
  Trash2,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from './GlassCard';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  userName: string;
  onSelectAvatar: (avatarUrl: string) => void;
}

type TabType = 'upload' | 'camera' | 'generator' | 'presets' | 'url';

// Curated high quality presets
const PRESET_CATEGORIES = [
  {
    name: 'Professional Portraits',
    items: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80',
    ]
  },
  {
    name: '3D & Modern Avatars',
    items: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=300&auto=format&fit=crop&q=80',
    ]
  }
];

const DICEBEAR_STYLES = [
  { id: 'avataaars', name: 'Avataaars (Cartoon)', desc: 'Fun expressive characters' },
  { id: 'lorelei', name: 'Lorelei (Modern Art)', desc: 'Sleek editorial portraits' },
  { id: 'bottts', name: 'Bottts (Robots)', desc: 'Futuristic droid avatars' },
  { id: 'micah', name: 'Micah (Minimalist)', desc: 'Clean vector illustration' },
  { id: 'personas', name: 'Personas (Geometric)', desc: 'Bold stylized portraits' },
  { id: 'fun-emoji', name: 'Fun Emoji (Playful)', desc: 'Vibrant expressive emojis' },
  { id: 'pixel-art', name: 'Pixel Art (Retro 8-bit)', desc: 'Nostalgic arcade vibe' },
  { id: 'thumbs', name: 'Thumbs (Minimal)', desc: 'Simple friendly heads' }
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  userName,
  onSelectAvatar,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar);
  
  // Custom URL Tab state
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [urlError, setUrlError] = useState(false);

  // AI Generator Tab state
  const [selectedStyle, setSelectedStyle] = useState('avataaars');
  const [seedText, setSeedText] = useState(userName || 'Dayflow');
  const [generatedSeeds, setGeneratedSeeds] = useState<string[]>([]);

  // Camera Tab state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // File Upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'User'}`);
      setSeedText(userName || 'User');
      generateSeedGrid(userName || 'User');
    } else {
      stopCamera();
    }
  }, [isOpen, currentAvatar, userName]);

  // Clean up camera on unmount or tab change
  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCamera();
    } else if (isOpen && activeTab === 'camera') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, isOpen]);

  const generateSeedGrid = (baseSeed: string) => {
    const seeds = [
      baseSeed,
      `${baseSeed}-spark`,
      `${baseSeed}-pro`,
      `${baseSeed}-tech`,
      `${baseSeed}-wave`,
      `${baseSeed}-zen`,
      `${baseSeed}-cyber`,
      `${baseSeed}-aura`,
    ];
    setGeneratedSeeds(seeds);
  };

  const handleRandomizeSeed = () => {
    const randomSeed = Math.random().toString(36).substring(2, 8);
    setSeedText(randomSeed);
    generateSeedGrid(randomSeed);
    const newAvatar = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${randomSeed}`;
    setPreviewUrl(newAvatar);
  };

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    setPreviewUrl(`https://api.dicebear.com/7.x/${styleId}/svg?seed=${seedText}`);
  };

  // Image File Compression & Upload Handler
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 400x400 for optimal storage & high crispness
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setPreviewUrl(compressedDataUrl);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Webcam Camera Handlers
  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or device not found. Please grant permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Crop square center & mirror
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
        const startX = ((video.videoWidth || 480) - size) / 2;
        const startY = ((video.videoHeight || 480) - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        setPreviewUrl(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (!cameraActive) {
      startCamera();
    }
  };

  const handleApply = () => {
    onSelectAvatar(previewUrl);
    stopCamera();
    onClose();
  };

  const handleResetToDefault = () => {
    const defaultDicebear = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'User'}`;
    setPreviewUrl(defaultDicebear);
    onSelectAvatar(defaultDicebear);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Customize Profile Picture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a photo, snap live webcam, choose AI avatars or curated styles.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Active Preview Ribbon */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-500/5 via-indigo-500/5 to-purple-500/5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={previewUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'User'}`}
                alt="Live Preview"
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-brand-500/30 shadow-md bg-slate-100 dark:bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'User'}`;
                }}
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-[9px] font-bold text-white shadow-sm flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> Active
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Selected Avatar Preview
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">
                {previewUrl.startsWith('data:') ? 'Custom Uploaded / Snapped Image' : previewUrl}
              </p>
            </div>
          </div>

          <button
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition flex items-center gap-1.5"
            title="Reset to default initials/dicebear avatar"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'upload'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'camera'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Camera
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'generator'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI & Vector Avatars
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'presets'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Curated Presets
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'url'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Image URL
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* 1. UPLOAD FILE TAB */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-brand-500 bg-brand-500/10 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-brand-500/60 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center ring-4 ring-brand-500/10 shadow-sm">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Click to browse or drag & drop photo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports JPG, PNG, WebP or GIF (Max 5MB). Auto-centered and optimized.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:border-brand-500 transition"
                >
                  Choose File from Device
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-900/40 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong className="font-semibold text-slate-900 dark:text-white">Smart Client-side Optimizer:</strong> Your photo is automatically resized and framed into a crisp, high-resolution portrait ready for your team dashboard and navbar.
                </p>
              </div>
            </div>
          )}

          {/* 2. CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                  <p className="text-xs font-medium text-rose-700 dark:text-rose-300">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition"
                  >
                    Retry Camera Access
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-black border-2 border-slate-800 shadow-inner flex items-center justify-center">
                    {!capturedImage ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover -scale-x-100"
                        />
                        {/* Circular Framing Guide */}
                        <div className="absolute inset-0 border-4 border-white/20 rounded-full pointer-events-none m-6" />
                      </>
                    ) : (
                      <img
                        src={capturedImage}
                        alt="Captured Shot"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    {!capturedImage ? (
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={!cameraActive}
                        className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                        Snap Photo Now
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleRetake}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Retake Shot
                        </button>
                        <button
                          type="button"
                          onClick={handleApply}
                          className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Use This Photo
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. AI & VECTOR AVATAR GENERATOR TAB */}
          {activeTab === 'generator' && (
            <div className="space-y-5">
              {/* Style Selector Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  1. Choose Vector Art Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DICEBEAR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => handleStyleChange(style.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                        selectedStyle === style.id
                          ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20 text-brand-600 dark:text-brand-400'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight block">{style.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seed Customizer Bar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Customize Seed & Randomize Variations
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={seedText}
                    onChange={(e) => {
                      setSeedText(e.target.value);
                      generateSeedGrid(e.target.value || 'User');
                      setPreviewUrl(`https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${e.target.value || 'User'}`);
                    }}
                    placeholder="Type a nickname, word or seed..."
                    className="flex-1 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeSeed}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 text-white hover:bg-brand-600 transition flex items-center gap-1.5 shadow-md shadow-brand-500/20 shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Roll Dice 🎲
                  </button>
                </div>
              </div>

              {/* Grid of Generated Options */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Generated Variations (Click to Select)
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {generatedSeeds.map((seed, idx) => {
                    const avatarSrc = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}`;
                    const isSelected = previewUrl === avatarSrc;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewUrl(avatarSrc)}
                        className={`relative aspect-square rounded-2xl p-1 bg-slate-100 dark:bg-slate-800 border transition overflow-hidden group ${
                          isSelected
                            ? 'border-brand-500 ring-2 ring-brand-500 scale-105 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-brand-400'
                        }`}
                      >
                        <img
                          src={avatarSrc}
                          alt="Option"
                          className="w-full h-full object-contain transition group-hover:scale-110"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. CURATED PRESETS TAB */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              {PRESET_CATEGORIES.map((cat, cIdx) => (
                <div key={cIdx} className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {cat.name}
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                    {cat.items.map((preset, pIdx) => {
                      const isSelected = previewUrl === preset;
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setPreviewUrl(preset)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition group ${
                            isSelected
                              ? 'border-brand-500 ring-2 ring-brand-500 scale-105 shadow-lg'
                              : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset}
                            alt="Preset"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                              <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center shadow">
                                <Check className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. IMAGE URL TAB */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paste Direct Image Link (HTTPS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      setUrlError(false);
                    }}
                    placeholder="https://example.com/my-photo.jpg"
                    className="flex-1 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customUrlInput.startsWith('http')) {
                        setUrlError(true);
                        return;
                      }
                      setPreviewUrl(customUrlInput);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 text-white hover:bg-brand-600 transition"
                  >
                    Preview URL
                  </button>
                </div>
                {urlError && (
                  <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Please enter a valid URL starting with http:// or https://
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tip: You can use direct image links from GitHub, LinkedIn, Google Drive (public direct link), Gravatar, or Cloudinary.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20"
          >
            <Check className="w-4 h-4" />
            Apply Profile Picture
          </button>
        </div>
      </div>
    </div>
  );
};
