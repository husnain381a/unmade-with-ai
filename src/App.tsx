import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ShieldOff,
  Upload,
  ImageOff,
  CheckCircle2,
  Download,
  AlertCircle,
  XCircle,
  Trash2,
  Lock,
  ChevronRight,
  FileImage,
  
} from 'lucide-react';
import { removeC2PA, formatBytes, type RemovalResult } from './utils/c2pa-remover';

type FileStatus = 'idle' | 'processing' | 'done' | 'error' | 'clean';

interface ProcessedFile {
  name: string;
  status: FileStatus;
  result?: RemovalResult;
  error?: string;
  previewUrl?: string;
  downloadUrl?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function App() {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFiles(prev => [...prev, {
        name: file.name,
        status: 'error',
        error: 'Unsupported format. Use JPEG, PNG, or WebP.',
      }]);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFiles(prev => [...prev, { name: file.name, status: 'processing', previewUrl }]);

    try {
      const result = await removeC2PA(file);
      const downloadUrl = URL.createObjectURL(result.blob);

      const status: FileStatus = result.removedItems.length > 0 ? 'done' : 'clean';

      setFiles(prev => prev.map(f =>
        f.name === file.name && f.status === 'processing'
          ? { ...f, status, result, downloadUrl }
          : f
      ));
    } catch (err) {
      setFiles(prev => prev.map(f =>
        f.name === file.name && f.status === 'processing'
          ? { ...f, status: 'error', error: (err as Error).message }
          : f
      ));
    }
  }, []);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    Array.from(incoming).forEach(processFile);
  }, [processFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e: React.DragEvent) => {
    if (!dropRef.current?.contains(e.relatedTarget as Node)) setDragging(false);
  };

  const removeFile = (name: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.name === name);
      if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f?.downloadUrl) URL.revokeObjectURL(f.downloadUrl);
      return prev.filter(x => x.name !== name);
    });
  };

  const downloadFile = (f: ProcessedFile) => {
    if (!f.downloadUrl) return;
    const a = document.createElement('a');
    a.href = f.downloadUrl;
    const ext = f.name.split('.').pop() || 'jpg';
    a.download = `unmade-${f.name.replace(/\.[^.]+$/, '')}.${ext}`;
    a.click();
  };

  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl);
      });
    };
  }, []);

  const hasFiles = files.length > 0;

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white font-sans overflow-x-hidden">
      {/* Background texture */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_60%)] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/[0.06] bg-[#0c0c0e]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400/30 via-cyan-300/20 to-rose-400/20 flex items-center justify-center backdrop-blur-sm">
              <div className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center">
                <ShieldOff className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="font-semibold tracking-tight text-white leading-tight">Unmade with AI</div>
              <div className="text-[11px] text-white/40 -mt-0.5">Strip C2PA provenance locally</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
              <Lock className="w-3.5 h-3.5" />
              <span>100% local — nothing leaves your browser</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14 relative">
          <div className="pointer-events-none absolute -right-24 -top-10 w-[260px] h-[260px] rounded-full bg-gradient-to-tr from-emerald-500/10 to-cyan-400/8 blur-3xl transform rotate-12" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs text-white/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Supports JPEG · PNG · WebP
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            Unmake AI provenance
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-rose-400 bg-clip-text text-transparent">from your images</span>
          </h1>
          <p className="text-base text-white/50 max-w-xl mx-auto leading-relaxed">
            Strips C2PA metadata embedded by Gemini, GPT and other AI tools — the metadata
            platforms like Instagram, X use to label images as "Made with AI."
          </p>
        </div>

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !hasFiles && inputRef.current?.click()}
          className={[
            'relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden',
            dragging
              ? 'border-white/40 bg-white/[0.05] scale-[1.005]'
              : hasFiles
              ? 'border-white/10 bg-white/[0.02]'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03] cursor-pointer',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />

          {!hasFiles ? (
            <div className="py-16 flex flex-col items-center gap-4">
              <div className={[
                'w-20 h-20 rounded-3xl border border-white/8 flex items-center justify-center shadow-lg transition-all duration-200',
                dragging ? 'bg-white/10 scale-105' : 'bg-white/[0.03]',
              ].join(' ')}>
                <Upload className={`w-8 h-8 transition-colors ${dragging ? 'text-white' : 'text-white/30'}`} />
              </div>
              <div className="text-center">
                <p className="text-white/70 font-semibold mb-1">
                  {dragging ? 'Drop to process' : 'Drag & drop images'}
                </p>
                <p className="text-sm text-white/30">or click to browse files</p>
              </div>
              <div className="text-xs text-white/25 mt-3">Processed locally · No uploads · Preserves pixels</div>
            </div>
          ) : (
            <div className="p-4">
              <FileList files={files} onRemove={removeFile} onDownload={downloadFile} />
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add more images
                </button>
                {files.filter(f => f.status === 'done').length > 1 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      files.filter(f => f.status === 'done').forEach(downloadFile);
                    }}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-20 grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: FileImage,
              title: 'Select your image',
              desc: 'Drop a JPEG, PNG, or WebP file. Multiple files supported.',
            },
            {
              icon: ShieldOff,
              title: 'C2PA is stripped',
              desc: 'APP11 JUMBF manifests, XMP provenance, and C2PA chunks are removed.',
            },
            {
              icon: Download,
              title: 'Download clean file',
              desc: 'Get a pixel-identical copy with no AI-origin metadata attached.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
              <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-white/60 w-[18px] h-[18px]" />
              </div>
              <h3 className="text-sm font-semibold text-white/80 mb-1.5">{title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div className="mt-10 rounded-xl bg-white/[0.02] border border-white/[0.05] p-5 flex gap-4 items-start">
          <Lock className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
          <p className="text-xs text-white/35 leading-relaxed">
            All processing happens entirely in your browser using the Web File API. No image data is
            uploaded to any server. Your files never leave your device.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] mt-12">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 text-xs text-white/25">
          <div className="text-center sm:text-left">
            <div className="text-white/70">Unmade with AI</div>
            <div className="text-white/50 text-[11px]">Removes C2PA · Local only · Open image standards</div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-white/30">
              <a
                href="https://husnainmazhar.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:underline"
              >
                Developed by Husnain Mazhar
              </a>
            </div>
            <div className="text-white/50 text-[11px]">Built with care · © {new Date().getFullYear()}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── File list ────────────────────────────────────────────────────────────────

function FileList({
  files,
  onRemove,
  onDownload,
}: {
  files: ProcessedFile[];
  onRemove: (name: string) => void;
  onDownload: (f: ProcessedFile) => void;
}) {
  return (
    <div className="space-y-2">
      {files.map(f => (
        <FileRow key={f.name + f.status} file={f} onRemove={onRemove} onDownload={onDownload} />
      ))}
    </div>
  );
}

function FileRow({
  file,
  onRemove,
  onDownload,
}: {
  file: ProcessedFile;
  onRemove: (name: string) => void;
  onDownload: (f: ProcessedFile) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = () => {
    switch (file.status) {
      case 'processing':
        return <Spinner />;
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'clean':
        return <CheckCircle2 className="w-4 h-4 text-white/30" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <ImageOff className="w-4 h-4 text-white/30" />;
    }
  };

  const statusLabel = () => {
    switch (file.status) {
      case 'processing': return <span className="text-white/40">Processing…</span>;
      case 'done': return <span className="text-emerald-400">{file.result!.removedItems.length} item{file.result!.removedItems.length !== 1 ? 's' : ''} removed</span>;
      case 'clean': return <span className="text-white/35">No C2PA metadata found</span>;
      case 'error': return <span className="text-red-400">{file.error}</span>;
      default: return null;
    }
  };

  const saved = file.result
    ? file.result.originalSize - file.result.newSize
    : 0;

  return (
    <div className="rounded-xl bg-black/30 border border-white/[0.07] overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/[0.05] shrink-0 flex items-center justify-center">
          {file.previewUrl ? (
            <img src={file.previewUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <FileImage className="w-5 h-5 text-white/20" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/80 truncate font-medium">{file.name}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs">
            {statusLabel()}
            {file.result && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-white/25">
                  {formatBytes(file.result.originalSize)} → {formatBytes(file.result.newSize)}
                  {saved > 0 && ` (−${formatBytes(saved)})`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {statusIcon()}

          {(file.status === 'done' || file.status === 'clean') && file.result && file.result.removedItems.length > 0 && (
            <button
              onClick={() => setExpanded(x => !x)}
              className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          )}

          {file.status === 'done' && (
            <button
              onClick={() => onDownload(file)}
              className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
              title="Download cleaned image"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onRemove(file.name)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400/70 hover:bg-red-500/10 transition-all"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded removed items */}
      {expanded && file.result && file.result.removedItems.length > 0 && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <p className="text-xs text-white/30 mb-2 font-medium uppercase tracking-wider">Removed</p>
          <ul className="space-y-1.5">
            {file.result.removedItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-white/50">
                <AlertCircle className="w-3 h-3 text-amber-400/60 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
