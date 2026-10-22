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
  HelpCircle,
} from 'lucide-react';
import { removeC2PA, formatBytes, type RemovalResult } from './utils/c2pa-remover';
import { SITE, FAQS, HOWTO_STEPS, FORMATS, TOOLS, WHAT_IS_C2PA, H1, H1_ACCENT } from './content/site';

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

  // Keep the latest files in a ref so the unmount cleanup can revoke every
  // object URL without re-running on every state change.
  const filesRef = useRef<ProcessedFile[]>([]);
  filesRef.current = files;

  useEffect(() => {
    return () => {
      filesRef.current.forEach(f => {
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
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
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
          <div className="pointer-events-none absolute -right-24 -top-10 w-[260px] h-[260px] rounded-full bg-gradient-to-tr from-emerald-500/10 to-cyan-400/10 blur-3xl transform rotate-12" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs text-white/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Supports JPEG · PNG · WebP
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            {H1}
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-rose-400 bg-clip-text text-transparent">{H1_ACCENT}</span>
          </h1>
          <p className="text-base text-white/50 max-w-xl mx-auto leading-relaxed">
            Strips C2PA metadata embedded by Gemini, GPT and other AI tools — the metadata
            platforms like Instagram, X use to label images as "Made with AI."
          </p>
        </div>

        {/* Answer block — the direct answer search engines and answer engines quote */}
        <div className="max-w-3xl mx-auto mb-12 rounded-xl border-l-2 border-emerald-400/40 bg-white/[0.03] px-5 py-4">
          <p className="text-sm text-white/70 leading-relaxed">
            <strong className="text-white font-semibold">In short:</strong> {SITE.answer}
          </p>
        </div>

        {/* ── Tool ──────────────────────────────────────────────────────── */}
        <section id="tool" aria-labelledby="tool-heading" className="scroll-mt-24">
          <h2 id="tool-heading" className="sr-only">C2PA metadata remover tool</h2>
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
                  'w-20 h-20 rounded-3xl border border-white/10 flex items-center justify-center shadow-lg transition-all duration-200',
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
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section aria-labelledby="how-it-works" className="mt-20 scroll-mt-24">
          <h2 id="how-it-works" className="text-2xl font-bold tracking-tight text-white mb-2">
            How to remove C2PA metadata
          </h2>
          <p className="text-sm text-white/40 mb-6 max-w-2xl leading-relaxed">
            Three steps. The whole job runs inside your browser tab, so the image is never
            transferred to a server.
          </p>
          <ol className="grid sm:grid-cols-3 gap-4 list-none">
            {HOWTO_STEPS.map((step, i) => (
              <li
                key={step.name}
                id={`step-${i + 1}`}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 scroll-mt-24"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400/25 to-cyan-300/15 border border-white/10 flex items-center justify-center text-xs font-semibold text-white/80">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-white/80">{step.name}</h3>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── What is C2PA ───────────────────────────────────────────────── */}
        <section aria-labelledby="what-is-c2pa" className="mt-20 scroll-mt-24">
          <h2 id="what-is-c2pa" className="text-2xl font-bold tracking-tight text-white mb-3">
            What is C2PA metadata?
          </h2>
          <div className="space-y-3 text-sm text-white/45 leading-relaxed max-w-3xl">
            {WHAT_IS_C2PA.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* ── Supported formats ─────────────────────────────────────────── */}
        <section aria-labelledby="formats" className="mt-20 scroll-mt-24">
          <h2 id="formats" className="text-2xl font-bold tracking-tight text-white mb-3">
            Supported formats
          </h2>
          <p className="text-sm text-white/40 mb-6 max-w-2xl leading-relaxed">
            JPEG, PNG and WebP are fully supported. Each container stores C2PA data
            differently, so the remover targets the right segments for every format.
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/[0.03] text-white/50">
                  <th scope="col" className="px-4 py-3 font-semibold">Format</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Container</th>
                  <th scope="col" className="px-4 py-3 font-semibold">What is removed</th>
                </tr>
              </thead>
              <tbody>
                {FORMATS.map((f, i) => (
                  <tr key={f.format} className={i % 2 ? 'bg-white/[0.01]' : ''}>
                    <th scope="row" className="px-4 py-3 font-semibold text-white/80 align-top whitespace-nowrap">
                      {f.format}
                    </th>
                    <td className="px-4 py-3 text-white/40 align-top font-mono text-[11px]">
                      {f.container}
                    </td>
                    <td className="px-4 py-3 text-white/40 align-top leading-relaxed">
                      {f.removed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Which tools add it ────────────────────────────────────────── */}
        <section aria-labelledby="which-tools" className="mt-20 scroll-mt-24">
          <h2 id="which-tools" className="text-2xl font-bold tracking-tight text-white mb-3">
            Which AI tools add C2PA metadata?
          </h2>
          <p className="text-sm text-white/40 mb-6 max-w-2xl leading-relaxed">
            Any generator that supports the C2PA standard can embed provenance into its
            exports. These are the most common sources.
          </p>
          <ul className="grid sm:grid-cols-2 gap-3">
            {TOOLS.map(tool => (
              <li
                key={tool.name}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex flex-col gap-1"
              >
                <h3 className="text-sm font-semibold text-white/80">{tool.name}</h3>
                <p className="text-xs text-white/40 leading-relaxed m-0">{tool.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section aria-labelledby="faq" className="mt-20 scroll-mt-24">
          <h2 id="faq" className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-white/30" />
            Frequently asked questions
          </h2>
          <p className="text-sm text-white/40 mb-8 max-w-2xl leading-relaxed">
            Everything about C2PA removal, privacy and file handling.
          </p>
          <dl className="space-y-6 max-w-3xl">
            {FAQS.map(faq => (
              <div key={faq.q} className="border-b border-white/[0.06] pb-6 last:border-0 last:pb-0">
                <dt className="mb-2">
                  <h3 className="text-sm font-semibold text-white/80">{faq.q}</h3>
                </dt>
                <dd className="text-sm text-white/40 leading-relaxed m-0">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Privacy note */}
        <div className="mt-14 rounded-xl bg-white/[0.02] border border-white/[0.05] p-5 flex gap-4 items-start">
          <Lock className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
          <p className="text-xs text-white/35 leading-relaxed">
            All processing happens entirely in your browser using the Web File API. No image data is
            uploaded to any server. Your files never leave your device.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 text-xs text-white/25">
          <div className="text-center sm:text-left">
            <div className="text-white/70">Unmade with AI</div>
            <div className="text-white/50 text-[11px]">Removes C2PA · Local only · Open image standards</div>
            <nav aria-label="Footer" className="mt-3 flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-[11px]">
              <a href="#tool" className="text-white/40 hover:text-white/70 transition-colors">Remove metadata</a>
              <a href="#what-is-c2pa" className="text-white/40 hover:text-white/70 transition-colors">What is C2PA</a>
              <a href="#formats" className="text-white/40 hover:text-white/70 transition-colors">Formats</a>
              <a href="#faq" className="text-white/40 hover:text-white/70 transition-colors">FAQ</a>
            </nav>
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
              aria-label="Show removed items"
              aria-expanded={expanded}
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          )}

          {file.status === 'done' && (
            <button
              onClick={() => onDownload(file)}
              className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
              title="Download cleaned image"
              aria-label={`Download cleaned version of ${file.name}`}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onRemove(file.name)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400/70 hover:bg-red-500/10 transition-all"
            title="Remove"
            aria-label={`Remove ${file.name} from the list`}
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
    <svg className="w-4 h-4 animate-spin text-white/30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
