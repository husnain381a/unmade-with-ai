import { useState, useRef, useCallback, useEffect } from 'react';
import {
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
  Plus,
  ChevronDown,
} from 'lucide-react';
import { removeC2PA, formatBytes, type RemovalResult } from './utils/c2pa-remover';
import { SITE, FAQS, HOWTO_STEPS, FORMATS, TOOLS, WHAT_IS_C2PA, H1 } from './content/site';

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
    <div className="app">
      <a className="skip-link" href="#tool">Skip to image tool</a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#tool" aria-label="Unmade with AI, image tool">
            <img src="/logo.svg" width="32" height="32" alt="" />
            <span>Unmade<span className="brand-suffix"> with AI</span></span>
          </a>
          <nav className="header-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#faq">Questions</a>
          </nav>
        </div>
      </header>

      <main className="container">
        <div className="workspace-intro">
          <h1>{H1}</h1>
          <div className="intro-description">
            <p>Strip Content Credentials in your browser. Keep every pixel.</p>
            <span className="local-note"><Lock aria-hidden="true" />100% local. Images stay on your device.</span>
          </div>
        </div>

        <section id="tool" aria-labelledby="tool-heading" className="workspace">
          <h2 id="tool-heading" className="visually-hidden">C2PA metadata remover tool</h2>
          <div className="workspace-bar">
            <span className="workspace-title">{hasFiles ? 'Your images' : 'Select your images'}</span>
            <span className="workspace-caption">{hasFiles ? `${files.length} image${files.length === 1 ? '' : 's'} in this session` : 'JPEG, PNG, WebP'}</span>
          </div>
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !hasFiles && inputRef.current?.click()}
            className={`drop-zone${dragging ? ' is-dragging' : ''}${hasFiles ? ' has-files' : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="visually-hidden"
              tabIndex={-1}
              aria-label="Select JPEG, PNG or WebP images"
              aria-describedby="file-help"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            {!hasFiles ? (
              <div className="drop-empty">
                <Upload className="upload-symbol" strokeWidth={1.25} aria-hidden="true" />
                <p className="drop-title">{dragging ? 'Drop to process' : 'Drop your images here'}</p>
                <p className="drop-description">Choose one image or a whole batch.</p>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                >
                  <Plus aria-hidden="true" />Choose images
                </button>
              </div>
            ) : (
              <div className="results">
                <FileList files={files} onRemove={removeFile} onDownload={downloadFile} />
                <div className="results-actions">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                    className="button button-secondary"
                  >
                    <Plus aria-hidden="true" />Add more images
                  </button>
                  {files.filter(f => f.status === 'done').length > 1 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        files.filter(f => f.status === 'done').forEach(downloadFile);
                      }}
                      className="button button-primary"
                    >
                      <Download aria-hidden="true" />Download all
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="workspace-foot" id="file-help">
            <span><Lock aria-hidden="true" />No uploads. No server.</span>
            <span>Original image quality, preserved</span>
          </div>
          <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {hasFiles && `${files.filter(f => f.status === 'done' || f.status === 'clean').length} of ${files.length} images processed. ${files.filter(f => f.status === 'error').length} errors.`}
          </p>
        </section>

        <section aria-labelledby="how-it-works" className="how-section">
          <div className="section-intro">
            <h2 id="how-it-works">How to remove C2PA metadata</h2>
            <p>The whole job runs inside your browser tab.</p>
          </div>
          <ol className="steps">
            {HOWTO_STEPS.map((step, i) => (
              <li key={step.name} id={`step-${i + 1}`}>
                <span className="step-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{step.name}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="what-is-c2pa" className="reference-section explainer">
          <div className="reference-heading">
            <h2 id="what-is-c2pa">What is C2PA metadata?</h2>
          </div>
          <div className="reference-body prose">
            {WHAT_IS_C2PA.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            <p className="answer-note">{SITE.answer}</p>
          </div>
        </section>

        <section aria-labelledby="formats" className="formats-section">
          <div className="section-intro">
            <h2 id="formats">Supported formats</h2>
            <p>Different containers. The same pixel-preserving approach.</p>
          </div>
          <table className="formats-table">
            <thead>
              <tr>
                <th scope="col">Format</th>
                <th scope="col">Container</th>
                <th scope="col">What is removed</th>
              </tr>
            </thead>
            <tbody>
              {FORMATS.map(f => (
                <tr key={f.format}>
                  <th scope="row">{f.format}</th>
                  <td data-label="Container">{f.container}</td>
                  <td data-label="What is removed">{f.removed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="which-tools" className="reference-section">
          <div className="reference-heading">
            <h2 id="which-tools">Which AI tools add C2PA metadata?</h2>
            <p>Any generator that supports the standard can embed provenance into its exports.</p>
          </div>
          <ul className="tools-list">
            {TOOLS.map(tool => (
              <li key={tool.name}>
                <h3>{tool.name}</h3>
                <p>{tool.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq" className="reference-section faq-section">
          <div className="reference-heading">
            <h2 id="faq">Frequently asked questions</h2>
            <p>About your images, privacy, and what this tool removes.</p>
          </div>
          <div className="faq-list">
            {FAQS.map(faq => (
              <details className="faq-item" key={faq.q}>
                <summary>
                  <h3>{faq.q}</h3>
                  <ChevronDown aria-hidden="true" />
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="privacy-note">
          <Lock aria-hidden="true" />
          <p>
            All processing happens entirely in your browser using the Web File API. No image data is
            uploaded to any server. Your files never leave your device.
          </p>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <p className="footer-brand"><img src="/logo.svg" width="24" height="24" alt="" />Unmade with AI</p>
              <p>Removes C2PA. Local only. Open image standards.</p>
            </div>
            <nav aria-label="Footer" className="footer-nav">
              <a href="#tool">Remove metadata</a>
              <a href="#what-is-c2pa">What is C2PA</a>
              <a href="#formats">Formats</a>
              <a href="#faq">FAQ</a>
            </nav>
          </div>
          <div className="footer-bottom">
            <a href="https://husnainmazhar.com" target="_blank" rel="noopener noreferrer">Developed by Husnain Mazhar</a>
            <span>© {new Date().getFullYear()} Unmade with AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
    <div className="file-list">
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
      case 'processing': return <Spinner />;
      case 'done': return <CheckCircle2 aria-hidden="true" />;
      case 'clean': return <CheckCircle2 aria-hidden="true" />;
      case 'error': return <XCircle aria-hidden="true" />;
      default: return <ImageOff aria-hidden="true" />;
    }
  };

  const statusLabel = () => {
    switch (file.status) {
      case 'processing': return 'Processing…';
      case 'done': return `${file.result!.removedItems.length} item${file.result!.removedItems.length !== 1 ? 's' : ''} removed`;
      case 'clean': return 'No C2PA metadata found';
      case 'error': return file.error;
      default: return null;
    }
  };

  const saved = file.result ? file.result.originalSize - file.result.newSize : 0;

  return (
    <div className={`file-row status-${file.status}`}>
      <div className="file-main">
        <div className="file-thumbnail">
          {file.previewUrl && file.status !== 'error' ? (
            <img src={file.previewUrl} width="48" height="48" alt="" />
          ) : (
            <FileImage aria-hidden="true" />
          )}
        </div>
        <div className="file-info">
          <p className="file-name" title={file.name}>{file.name}</p>
          <p className="file-status">{statusIcon()}{statusLabel()}</p>
        </div>
        {file.result && (
          <div className="file-sizes">
            <span><span className="size-label">Original</span>{formatBytes(file.result.originalSize)}</span>
            <span><span className="size-label">Processed</span>{formatBytes(file.result.newSize)}</span>
            {saved > 0 && <span className="size-saved">{formatBytes(saved)} smaller</span>}
          </div>
        )}
        <div className="file-actions">
          {(file.status === 'done' || file.status === 'clean') && file.result && file.result.removedItems.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(x => !x)}
              className="icon-button details-button"
              aria-label="Show removed items"
              aria-expanded={expanded}
            >
              <ChevronRight className={expanded ? 'is-expanded' : ''} aria-hidden="true" />
            </button>
          )}
          {file.status === 'done' && (
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="button button-secondary file-download"
              title="Download cleaned image"
              aria-label={`Download cleaned version of ${file.name}`}
            >
              <Download aria-hidden="true" /><span>Download</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(file.name)}
            className="icon-button remove-button"
            title="Remove"
            aria-label={`Remove ${file.name} from the list`}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>
      {expanded && file.result && file.result.removedItems.length > 0 && (
        <div className="removed-details">
          <p>Removed metadata</p>
          <ul>
            {file.result.removedItems.map((item, i) => (
              <li key={i}><AlertCircle aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
