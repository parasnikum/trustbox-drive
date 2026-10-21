import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Download,
  FileText,
  CheckCircle,
  Code,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Film,
  Music,
  FileCode,
  Table,
  Loader2,
  AlertTriangle,
  Eye,
  Globe,
  AlignLeft,
  ChevronDown,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';
import mammoth from 'mammoth';
import { marked } from 'marked';
import { FileItem } from '../../types';
import { ensureFreshToken } from '../../services/apiClient';

interface PreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
}

interface SubtitleCue {
  id: string;
  time: string;
  text: string;
}

const INITIAL_CHUNK_BYTES = 256 * 1024;
const MAX_CSV_RENDER_ROWS = 500;

export const PreviewModal: React.FC<PreviewModalProps> = ({ file, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'gdocs'>('preview');
  const [wordWrap, setWordWrap] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('trustBox_token') || '');

  const [loadedBytes, setLoadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [hasMoreChunks, setHasMoreChunks] = useState<boolean>(false);
  const [isStreamingMore, setIsStreamingMore] = useState<boolean>(false);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!file) return;

    const abortController = new AbortController();

    setLoading(false);
    setError(null);
    setTextContent('');
    setDocxHtml('');
    setActiveTab('preview');
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setCopied(false);
    setLoadedBytes(0);
    setTotalBytes(Number(file.size || 0));
    setHasMoreChunks(false);

    const ext = getExtension(file.name);
    const mime = (file.mimeType || '').toLowerCase();

    const isDocxFile = mime.includes('word') || mime.includes('officedocument') || ext === 'docx' || ext === 'doc';
    const isTextLike =
      mime.startsWith('text/') ||
      mime.includes('json') ||
      mime.includes('javascript') ||
      mime.includes('xml') ||
      ['txt', 'log', 'js', 'jsx', 'ts', 'tsx', 'py', 'json', 'xml', 'css', 'scss', 'c', 'cpp', 'h', 'cs', 'java', 'go', 'rs', 'php', 'sh', 'bat', 'cmd', 'ps1', 'sql', 'yaml', 'yml', 'ini', 'env', 'conf', 'md', 'markdown', 'html', 'htm', 'srt', 'vtt', 'sub', 'ass', 'csv', 'tsv'].includes(ext);

    const loadContent = async () => {

      const validToken = (await ensureFreshToken()) || localStorage.getItem('trustBox_token') || '';
      if (validToken) {
        setAuthToken(validToken);
      }

      const getUrl = (t: string) =>
        `/api/files/${file.id}/download?inline=true${t ? `&token=${encodeURIComponent(t)}` : ''}`;

      if (isDocxFile) {
        setLoading(true);
        try {
          let res = await fetch(getUrl(validToken), { signal: abortController.signal });
          if (res.status === 401) {
            const renewed = await ensureFreshToken();
            if (renewed) {
              setAuthToken(renewed);
              res = await fetch(getUrl(renewed), { signal: abortController.signal });
            }
          }
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const buffer = await res.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          setDocxHtml(result.value);
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          console.error('Docx render error:', err);
          setError('Failed to render Word document formatted preview. You can switch to Google Docs view or download the file.');
        } finally {
          setLoading(false);
        }
      } else if (isTextLike) {
        setLoading(true);
        const fileSize = Number(file.size || 0);
        const isLargeFile = fileSize > INITIAL_CHUNK_BYTES;

        const headers: Record<string, string> = {};
        if (isLargeFile) {
          headers['Range'] = `bytes=0-${INITIAL_CHUNK_BYTES - 1}`;
        }

        try {
          let res = await fetch(getUrl(validToken), { headers, signal: abortController.signal });
          if (res.status === 401) {
            const renewed = await ensureFreshToken();
            if (renewed) {
              setAuthToken(renewed);
              res = await fetch(getUrl(renewed), { headers, signal: abortController.signal });
            }
          }
          if (!res.ok && res.status !== 206) throw new Error(`HTTP error ${res.status}`);
          const text = await res.text();
          setTextContent(text);
          const bytesCount = new Blob([text]).size;
          setLoadedBytes(bytesCount);
          if (fileSize > bytesCount) {
            setHasMoreChunks(true);
          }
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          console.error('Text load error:', err);
          setError('Failed to read file content stream. You can download the file directly.');
        } finally {
          setLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      abortController.abort();
    };
  }, [file]);

  const loadNextChunk = async () => {
    if (!file || isStreamingMore || !hasMoreChunks) return;
    setIsStreamingMore(true);

    const token = (await ensureFreshToken()) || authToken || localStorage.getItem('trustBox_token');
    const previewUrl = `/api/files/${file.id}/download?inline=true${token ? `&token=${encodeURIComponent(token)}` : ''}`;

    const start = loadedBytes;
    const end = start + INITIAL_CHUNK_BYTES - 1;

    try {
      const res = await fetch(previewUrl, {
        headers: { Range: `bytes=${start}-${end}` },
      });
      if (!res.ok && res.status !== 206) throw new Error(`HTTP error ${res.status}`);
      const newText = await res.text();
      setTextContent((prev) => prev + newText);
      const newlyLoaded = loadedBytes + new Blob([newText]).size;
      setLoadedBytes(newlyLoaded);
      if (newlyLoaded >= Number(file.size || 0) || newText.length === 0) {
        setHasMoreChunks(false);
      }
    } catch (err) {
      console.error('Error fetching stream chunk:', err);
    } finally {
      setIsStreamingMore(false);
    }
  };

  const ext = file ? getExtension(file.name) : '';
  const mime = file ? (file.mimeType || '').toLowerCase() : '';

  const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext);
  const isVideo = mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi', 'm4v', 'flv'].includes(ext);
  const isAudio = mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'].includes(ext);
  const isPdf = mime.includes('pdf') || ext === 'pdf';
  const isDocx = mime.includes('word') || mime.includes('officedocument') || ext === 'docx' || ext === 'doc';
  const isMarkdown = mime.includes('markdown') || ['md', 'markdown'].includes(ext);
  const isHtml = mime.includes('html') || ['html', 'htm'].includes(ext);
  const isSrt = ['srt', 'vtt', 'sub', 'ass'].includes(ext);
  const isCsv = mime.includes('csv') || ['csv', 'tsv'].includes(ext);
  const isTextOrCode =
    mime.startsWith('text/') ||
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('xml') ||
    ['txt', 'log', 'js', 'jsx', 'ts', 'tsx', 'py', 'json', 'xml', 'css', 'scss', 'c', 'cpp', 'h', 'cs', 'java', 'go', 'rs', 'php', 'sh', 'bat', 'cmd', 'ps1', 'sql', 'yaml', 'yml', 'ini', 'env', 'conf'].includes(ext);

  const handleCopy = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const subtitleCues = useMemo<SubtitleCue[]>(() => {
    if (!isSrt || !textContent) return [];
    return parseSRT(textContent);
  }, [isSrt, textContent]);

  const { csvRows, csvTotalCount } = useMemo(() => {
    if (!isCsv || !textContent) return { csvRows: [], csvTotalCount: 0 };
    return parseCSV(textContent, MAX_CSV_RENDER_ROWS);
  }, [isCsv, textContent]);

  const renderedMarkdown = useMemo<string>(() => {
    if (!isMarkdown || !textContent) return '';
    try {
      return marked.parse(textContent, { breaks: true, gfm: true }) as string;
    } catch {
      return textContent;
    }
  }, [isMarkdown, textContent]);

  const { lineCount, lineNumbersBlock } = useMemo(() => {
    if (!textContent) return { lineCount: 0, lineNumbersBlock: '' };
    const count = (textContent.match(/\n/g) || []).length + 1;
    const maxLines = Math.min(count, 5000);
    let block = '';
    for (let i = 1; i <= maxLines; i++) {
      block += i + '\n';
    }
    return { lineCount: count, lineNumbersBlock: block };
  }, [textContent]);

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDraggingImage(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleImageMouseUp = () => {
    setIsDraggingImage(false);
  };

  const handleImageDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  };

  const handleImageWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(Number((z + 0.2).toFixed(1)), 4));
    } else {
      setZoom((z) => {
        const next = Math.max(Number((z - 0.2).toFixed(1)), 0.5);
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  if (!file) return null;

  const token = authToken || localStorage.getItem('trustBox_token');
  const previewUrl = `/api/files/${file.id}/download?inline=true${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  const downloadUrl = `/api/files/${file.id}/download${token ? `&token=${encodeURIComponent(token)}` : ''}`;

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-zinc-950/80 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${isFullScreen ? 'h-full max-h-screen rounded-none' : 'max-w-5xl max-h-[92vh] rounded-3xl'
          } bg-zinc-900 border border-zinc-800 p-5 shadow-2xl flex flex-col text-zinc-100 font-sans transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              {getFileTypeIcon(file)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-zinc-50 truncate" title={file.name}>
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold mt-0.5">
                <span>{file.mimeType || ext.toUpperCase() || 'File'}</span>
                <span>•</span>
                <span>{formatBytes(file.size)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Download</span>
            </a>

            <button
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {(isDocx || isMarkdown || isHtml || isSrt || isCsv || isTextOrCode) && !loading && !error && (
          <div className="flex items-center justify-between mb-3 bg-zinc-950/80 p-2 rounded-2xl border border-zinc-800 flex-wrap gap-2 text-xs">
            <div className="flex gap-1">
              {isDocx && (
                <>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'preview' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    <Eye size={14} />
                    <span>Word View</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('gdocs')}
                    className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'gdocs' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    <Globe size={14} />
                    <span>Google Docs</span>
                  </button>
                </>
              )}

              {(isMarkdown || isHtml || isSrt || isCsv) && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'preview' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  <Eye size={14} />
                  <span>{isMarkdown ? 'Formatted' : isHtml ? 'Visual' : isSrt ? 'Subtitles' : 'Data Table'}</span>
                </button>
              )}

              {!isDocx && (
                <button
                  onClick={() => setActiveTab('code')}
                  className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'code' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  <Code size={14} />
                  <span>Source Code</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {loadedBytes > 0 && totalBytes > INITIAL_CHUNK_BYTES && (
                <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  ⚡ Streamed: {formatBytes(loadedBytes)} / {formatBytes(totalBytes)}
                </span>
              )}

              {activeTab === 'code' && (
                <button
                  onClick={() => setWordWrap(!wordWrap)}
                  className={`py-1 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${wordWrap ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  <AlignLeft size={13} />
                  <span>{wordWrap ? 'Wrap On' : 'Wrap Off'}</span>
                </button>
              )}

              {textContent && (
                <button
                  onClick={handleCopy}
                  className="py-1 px-3 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {isImage && (
          <div className="flex items-center justify-between mb-3 bg-zinc-950/80 px-4 py-2 rounded-2xl border border-zinc-800 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 4))}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>

              <span className="font-bold min-w-[50px] text-center font-mono text-zinc-200">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={() => {
                  setZoom((z) => {
                    const next = Math.max(Number((z - 0.25).toFixed(2)), 0.5);
                    if (next <= 1) setPan({ x: 0, y: 0 });
                    return next;
                  });
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>

              <div className="w-px h-4 bg-zinc-800 mx-1" />

              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw size={16} />
              </button>

              <button
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Reset View"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              {zoom > 1 ? 'Drag image to pan • Double-click to reset' : 'Scroll wheel or double-click to zoom'}
            </span>
          </div>
        )}

        <div
          ref={containerRef}
          className="flex-1 min-h-[380px] bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[340px] text-zinc-400 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Streaming document content...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[340px] text-rose-400 gap-3 p-6 text-center">
              <AlertTriangle size={36} />
              <p className="text-xs max-w-md text-zinc-300">{error}</p>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold mt-2 shadow-sm transition-colors cursor-pointer"
              >
                Download File
              </a>
            </div>
          ) : isImage ? (
            <div
              className={`flex items-center justify-center h-full w-full p-4 overflow-hidden select-none ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
                }`}
              onMouseDown={handleImageMouseDown}
              onMouseMove={handleImageMouseMove}
              onMouseUp={handleImageMouseUp}
              onDoubleClick={handleImageDoubleClick}
              onWheel={handleImageWheel}
            >
              <img
                src={previewUrl}
                alt={file.name}
                draggable={false}
                className="max-w-full max-h-[520px] object-contain rounded-xl shadow-2xl transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          ) : isVideo ? (
            <div className="flex items-center justify-center h-full w-full bg-black rounded-xl overflow-hidden p-2">
              <video
                src={previewUrl}
                controls
                autoPlay={false}
                preload="metadata"
                className="w-full max-h-[540px] rounded-lg"
              />
            </div>
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[340px] p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-400 shadow-lg shadow-amber-500/10">
                <Music size={36} />
              </div>
              <h4 className="text-base font-bold text-zinc-100 mb-1">{file.name}</h4>
              <p className="text-xs text-zinc-400 font-semibold mb-6">Audio Track • {formatBytes(file.size)}</p>
              <audio src={previewUrl} controls className="w-full max-w-md rounded-xl" />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${previewUrl}#toolbar=1`}
              title={file.name}
              className="w-full h-full min-h-[580px] border-none bg-zinc-900 rounded-xl"
            />
          ) : isDocx ? (
            activeTab === 'gdocs' ? (
              isLocalhost ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[340px] p-6 text-center text-zinc-400">
                  <Globe size={36} className="text-blue-400 mb-2 opacity-80" />
                  <h4 className="text-sm font-bold text-zinc-200 mb-1">Google Docs Viewer Localhost Notice</h4>
                  <p className="text-xs text-zinc-400 max-w-md mb-4">
                    Google Docs Viewer requires a publicly accessible URL to render documents. Please use the built-in{' '}
                    <strong className="text-blue-400">Word View</strong> tab above.
                  </p>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors"
                  >
                    Switch to Word View
                  </button>
                </div>
              ) : (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + previewUrl)}&embedded=true`}
                  title={file.name}
                  className="w-full h-full min-h-[580px] border-none bg-white rounded-xl"
                />
              )
            ) : (
              <div className="p-6 text-zinc-200 overflow-y-auto flex-1">
                <div
                  className="prose dark:prose-invert max-w-none text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                />
              </div>
            )
          ) : isMarkdown && activeTab === 'preview' ? (
            <div
              className="p-6 text-zinc-200 text-xs leading-relaxed overflow-y-auto flex-1"
              dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
            />
          ) : isHtml && activeTab === 'preview' ? (
            <iframe
              srcDoc={textContent}
              title={file.name}
              sandbox="allow-same-origin allow-scripts"
              className="w-full h-full min-h-[520px] border-none bg-white rounded-xl"
            />
          ) : isSrt && activeTab === 'preview' ? (
            <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
              {subtitleCues.map((cue, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      #{cue.id}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">{cue.time}</span>
                  </div>
                  <p className="text-xs text-zinc-200 whitespace-pre-wrap">{cue.text}</p>
                </div>
              ))}
            </div>
          ) : isCsv && activeTab === 'preview' ? (
            <div className="overflow-auto w-full h-full flex-1 flex flex-col">
              {csvTotalCount > MAX_CSV_RENDER_ROWS && (
                <div className="p-2.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] font-semibold text-amber-300 flex items-center justify-between px-4">
                  <span>
                    ⚡ Displaying first {MAX_CSV_RENDER_ROWS} of {csvTotalCount.toLocaleString()} rows for optimized browser performance.
                  </span>
                  <a href={downloadUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">
                    Download full file
                  </a>
                </div>
              )}
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse text-xs text-zinc-300">
                  <thead>
                    {csvRows.length > 0 && (
                      <tr className="bg-zinc-900 border-b border-zinc-800 sticky top-0 font-bold text-zinc-200 z-10">
                        <th className="p-2.5 border-r border-zinc-800 text-center w-12 text-zinc-500 font-mono text-[10px]">
                          #
                        </th>
                        {csvRows[0].map((col, idx) => (
                          <th key={idx} className="p-2.5 border-r border-zinc-800 whitespace-nowrap">
                            {col || `Col ${idx + 1}`}
                          </th>
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                    {csvRows.slice(1).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="p-2 border-r border-zinc-800 text-center font-mono text-zinc-500 text-[10px]">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-zinc-800 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (isTextOrCode || activeTab === 'code') && textContent !== '' ? (

            <div className="flex flex-col w-full h-full overflow-hidden flex-1">
              <div className="flex flex-1 overflow-auto">
                <pre className="p-3 bg-zinc-950 border-r border-zinc-800/80 text-zinc-600 text-right select-none min-w-[48px] font-mono text-xs leading-5">
                  {lineNumbersBlock}
                </pre>
                <pre
                  className={`flex-1 p-3 overflow-x-auto font-mono text-xs leading-5 text-zinc-200 ${wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                    }`}
                >
                  {textContent}
                </pre>
              </div>

              {hasMoreChunks && (
                <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4">
                  <span className="text-xs text-zinc-400">
                    Loaded {formatBytes(loadedBytes)} of {formatBytes(totalBytes)} ({lineCount.toLocaleString()} lines)
                  </span>
                  <button
                    onClick={loadNextChunk}
                    disabled={isStreamingMore}
                    className="py-1.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700 shadow-xs"
                  >
                    {isStreamingMore ? <Loader2 size={14} className="animate-spin text-blue-400" /> : <ChevronDown size={14} />}
                    <span>{isStreamingMore ? 'Streaming...' : `Load Next Chunk (+${formatBytes(INITIAL_CHUNK_BYTES)})`}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[340px] text-zinc-400 p-6 text-center">
              <FileText size={48} className="mb-3 text-zinc-600" />
              <h4 className="text-sm font-bold text-zinc-200 mb-1">Direct browser preview not supported for this file type</h4>
              <p className="text-xs text-zinc-400 mb-5 max-w-sm">
                You can download and open this file using your computer&apos;s native applications.
              </p>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>Download File ({formatBytes(file.size)})</span>
              </a>
            </div>
          )}
        </div>

        <div className="mt-3 p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle size={14} />
            <span>Range HTTP Streaming Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span>SHA-256 Checksum:</span>
            <code className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-900/60 px-2 py-0.5 rounded-md truncate max-w-[200px] sm:max-w-none">
              {file.checksum}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function formatBytes(bytesStr?: string | number): string {
  if (!bytesStr) return '0 B';
  const bytes = Number(bytesStr);
  if (isNaN(bytes) || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileTypeIcon(file: FileItem) {
  const ext = getExtension(file.name);
  const mime = (file.mimeType || '').toLowerCase();

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <Eye size={22} className="text-blue-400" />;
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext)) {
    return <Film size={22} className="text-purple-400" />;
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
    return <Music size={22} className="text-amber-400" />;
  }
  if (mime.includes('pdf') || ext === 'pdf') {
    return <FileText size={22} className="text-rose-400" />;
  }
  if (mime.includes('word') || mime.includes('officedocument') || ext === 'docx' || ext === 'doc') {
    return <FileText size={22} className="text-blue-400" />;
  }
  if (mime.includes('csv') || ext === 'csv') {
    return <Table size={22} className="text-emerald-400" />;
  }
  if (mime.includes('javascript') || mime.includes('json') || mime.includes('html') || ['js', 'ts', 'py', 'html', 'css', 'json', 'md', 'srt'].includes(ext)) {
    return <FileCode size={22} className="text-emerald-400" />;
  }
  return <FileText size={22} className="text-zinc-400" />;
}

function parseSRT(srtText: string): SubtitleCue[] {
  const blocks = srtText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n\n');
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    if (lines.length >= 2) {
      const timeIdx = lines.findIndex((l) => l.includes('-->'));
      if (timeIdx !== -1) {
        const id = lines.slice(0, timeIdx).join(' ') || `${cues.length + 1}`;
        const time = lines[timeIdx];
        const text = lines.slice(timeIdx + 1).join('\n');
        cues.push({ id, time, text });
      }
    }
  }
  return cues;
}

function parseCSV(csvText: string, maxRows = 500): { csvRows: string[][]; csvTotalCount: number } {
  const lines = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const csvTotalCount = lines.length;
  const targetLines = lines.slice(0, maxRows);

  const csvRows = targetLines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });

  return { csvRows, csvTotalCount };
}
