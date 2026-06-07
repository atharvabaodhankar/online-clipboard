import { useState, useEffect } from "react";
import { 
  Copy, 
  Link as LinkIcon, 
  Clipboard, 
  Search, 
  FileText, 
  UploadCloud, 
  File, 
  Trash2, 
  QrCode, 
  Download, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import QRCode from "qrcode";
import { Button } from "@/components/retroui/Button";

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getOrCreateVisitorToken() {
  let token = localStorage.getItem("visitor_token");
  if (!token) {
    token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("visitor_token", token);
  }
  return token;
}

function TextPreview({ fileUrl }) {
  const [text, setText] = useState("Loading preview...");
  useEffect(() => {
    fetch(fileUrl)
      .then(res => res.text())
      .then(txt => setText(txt.slice(0, 5000) + (txt.length > 5000 ? "\n\n[Content truncated for preview...]" : "")))
      .catch(() => setText("Failed to load text preview."));
  }, [fileUrl]);

  return (
    <div className="border-4 border-black bg-white dark:bg-neutral-900 p-4 rounded-xs shadow-inner">
      <pre className="font-mono text-xs whitespace-pre-wrap max-h-[300px] overflow-y-auto text-black dark:text-white">
        {text}
      </pre>
    </div>
  );
}

function FilePreview({ fileUrl, fileName }) {
  const fileExt = fileName.split(".").pop().toLowerCase();
  
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileExt)) {
    return (
      <div className="border-4 border-black bg-neutral-100 dark:bg-neutral-800 p-4 flex justify-center items-center rounded-xs shadow-inner">
        <img src={fileUrl} alt={fileName} className="max-h-[300px] max-w-full object-contain border-2 border-black bg-white" />
      </div>
    );
  }
  
  if (fileExt === "pdf") {
    return (
      <div className="border-4 border-black bg-neutral-800 rounded-xs overflow-hidden shadow-inner">
        <iframe src={fileUrl} className="w-full h-[450px]" title="PDF Preview" />
      </div>
    );
  }
  
  if (fileExt === "txt") {
    return <TextPreview fileUrl={fileUrl} />;
  }

  return (
    <div className="border-4 border-black bg-neutral-100 dark:bg-neutral-850 p-8 text-center rounded-xs">
      <p className="font-head text-sm uppercase text-neutral-500 dark:text-neutral-400">Preview Unavailable</p>
      <p className="text-xs text-muted-foreground mt-1">Click download to view the file locally.</p>
    </div>
  );
}


export default function App() {
  const [activeTab, setActiveTab] = useState("text"); // "text" or "file"
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiry, setExpiry] = useState("1d");
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  
  const [clipboards, setClipboards] = useState([]);
  const [fetchCode, setFetchCode] = useState("");
  const [fetchedRecord, setFetchedRecord] = useState(null);
  const [fetchedContent, setFetchedContent] = useState("");
  const [viewingMode, setViewingMode] = useState("create"); // "create" or "result"
  
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [savedShareInfo, setSavedShareInfo] = useState(null); // { code, url, qrCodeUrl, type }
  
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [dbStatus, setDbStatus] = useState("loading");
  const [timeString, setTimeString] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // DB Connection status polling
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/status`);
        const data = await res.json();
        if (data.status === "ok") {
          setDbStatus("online");
        } else {
          setDbStatus("offline");
        }
      } catch {
        setDbStatus("offline");
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // Clock time update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Client path-routing loader
  useEffect(() => {
    setClipboards([]);
    try {
      const path = window.location.pathname;
      const match = path.match(/^\/(t|f)\/(\d{4})$/);
      if (match) {
        const code = match[2];
        setFetchCode(code);
        fetchByCode(code);
      } else {
        // Fallback to legacy query parameters
        const params = new URLSearchParams(window.location.search);
        const urlCode = params.get("code");
        if (urlCode) {
          setFetchCode(urlCode);
          fetchByCode(urlCode);
        }
      }
    } catch (e) {
      console.error(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveClipboard = async () => {
    if (!content || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          content,
          expiresAt: expiry,
          maxViews: burnAfterRead ? 1 : 999
        }),
      });
      const data = await res.json();

      if (data.code) {
        const newEntry = { 
          type: "text", 
          content, 
          code: data.code, 
          expiresAt: expiry, 
          burnAfterRead 
        };
        setClipboards([newEntry, ...clipboards]);
        setContent("");
        
        const directUrl = `${window.location.origin}/t/${data.code}`;
        const qrCodeDataUrl = await QRCode.toDataURL(directUrl, {
          width: 256,
          margin: 2
        });

        setSavedShareInfo({
          code: data.code,
          url: directUrl,
          qrCodeUrl: qrCodeDataUrl,
          type: "text",
          burnAfterRead
        });
      } else {
        showAlertDialog(data.error || "Failed to save clipboard.");
      }
    } catch (err) {
      console.error(err);
      showAlertDialog("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAndShareFile = async () => {
    if (!selectedFile || isSaving) return;
    setIsSaving(true);
    
    try {
      const visitorToken = getOrCreateVisitorToken();

      // Step 1: Initialize Upload
      const initRes = await fetch("https://storage.to/api/upload/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Visitor-Token": visitorToken
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          content_type: selectedFile.type || "application/octet-stream",
          size: selectedFile.size
        })
      });

      if (!initRes.ok) {
        throw new Error(`Upload initialization failed with status ${initRes.status}`);
      }

      const initData = await initRes.json();
      if (!initData.success) {
        throw new Error(initData.error || "Failed to initialize upload on storage.to");
      }

      const { upload_url, r2_key } = initData;

      // Step 2: Upload File Bytes
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream"
        },
        body: selectedFile
      });

      if (!uploadRes.ok) {
        throw new Error(`File upload failed with status ${uploadRes.status}`);
      }

      // Step 3: Confirm Upload
      const confirmRes = await fetch("https://storage.to/api/upload/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Visitor-Token": visitorToken
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          size: selectedFile.size,
          content_type: selectedFile.type || "application/octet-stream",
          r2_key: r2_key
        })
      });

      if (!confirmRes.ok) {
        throw new Error(`Upload confirmation failed with status ${confirmRes.status}`);
      }

      const confirmData = await confirmRes.json();
      if (!confirmData.success || !confirmData.file) {
        throw new Error(confirmData.error || "Failed to confirm upload on storage.to");
      }

      const { file: fileDetails } = confirmData;

      // Step 4: Share details with OClip backend
      const shareRes = await fetch(`${API_URL}/api/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "file",
          provider: "storage.to",
          fileId: fileDetails.id,
          fileUrl: fileDetails.url,
          rawUrl: fileDetails.raw_url,
          fileName: fileDetails.filename,
          size: formatBytes(fileDetails.size),
          expiresAt: expiry,
          maxViews: burnAfterRead ? 1 : 999
        })
      });
      
      const shareData = await shareRes.json();
      
      if (shareData.code) {
        const newEntry = {
          type: "file",
          provider: "storage.to",
          fileId: fileDetails.id,
          fileUrl: fileDetails.url,
          rawUrl: fileDetails.raw_url,
          fileName: fileDetails.filename,
          size: formatBytes(fileDetails.size),
          code: shareData.code,
          expiresAt: expiry,
          burnAfterRead
        };
        setClipboards([newEntry, ...clipboards]);
        setSelectedFile(null);
        
        const directUrl = `${window.location.origin}/f/${shareData.code}`;
        const qrCodeDataUrl = await QRCode.toDataURL(directUrl, {
          width: 256,
          margin: 2
        });
        
        setSavedShareInfo({
          code: shareData.code,
          url: directUrl,
          qrCodeUrl: qrCodeDataUrl,
          type: "file",
          burnAfterRead
        });
      } else {
        showAlertDialog(shareData.error || "Failed to share file.");
      }
    } catch (err) {
      console.error(err);
      showAlertDialog(err.message || "Network error uploading file.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchByCode = async (code) => {
    if (!code || isFetching) return;
    setIsFetching(true);
    setViewingMode("result");
    try {
      const res = await fetch(`${API_URL}/api/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.record) {
        setFetchedRecord(data.record);
        setFetchedContent(data.record.content || "");
      } else {
        showAlertDialog(data.error || "Failed to fetch. Code might be expired or already burned.");
        setFetchedRecord(null);
        setFetchedContent("");
        setViewingMode("create");
      }
    } catch (err) {
      console.error(err);
      showAlertDialog("Network error. Could not fetch.");
      setViewingMode("create");
    } finally {
      setIsFetching(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showAlertDialog("Copied to clipboard!");
  };

  const showAlertDialog = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const copyShareLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      showAlertDialog("Link copied!");
    } catch {
      showAlertDialog("Failed to copy link");
    }
  };

  const downloadQrCode = (qrCodeUrl, code) => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `oclip-qr-${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag & drop configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    multiple: false
  });

  return (
    <div className="bg-background text-foreground min-h-screen font-sans selection:bg-primary selection:text-black transition-colors">
      {/* Top Banner / Decorative Bar */}
      <div className="overflow-hidden border-b-4 border-black bg-black py-2 text-yellow-300 dark:text-yellow-400 font-head text-xs tracking-wider select-none">
        <div className="flex w-max animate-marquee">
          <div className="px-4 whitespace-nowrap">
            ★ OCLIP V2.0 ✦ UNIVERSAL FILE & TEXT SHARE ✦ SECURE END-TO-END ✦ ZERO TRACKING ✦ BURN-AFTER-READ ✦ POWERED BY REDIS ✦&nbsp;
          </div>
          <div className="px-4 whitespace-nowrap">
            ★ OCLIP V2.0 ✦ UNIVERSAL FILE & TEXT SHARE ✦ SECURE END-TO-END ✦ ZERO TRACKING ✦ BURN-AFTER-READ ✦ POWERED BY REDIS ✦&nbsp;
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-primary dark:bg-card border-b-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_#3a3a3a] transition-colors">
        {/* Menu Bar (Classic OS System style) */}
        <div className="bg-black text-white px-4 py-1.5 flex justify-between items-center text-[10px] sm:text-xs font-mono border-b-2 border-black">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="font-bold tracking-wider text-yellow-300">SYSTEM v2.0</span>
            <span className="opacity-50">|</span>
            <button 
              onClick={() => showAlertDialog("OClip v2 is a zero-tracking universal pastebin & file share platform. Built with Upstash Redis and file.io.")} 
              className="hover:text-yellow-300 transition-colors uppercase font-bold cursor-pointer bg-transparent border-none p-0 outline-none"
            >
              About
            </button>
            <span className="opacity-50">|</span>
            <button 
              onClick={() => showAlertDialog("Save clips or upload files directly. Generate unique 4-digit security codes. Choose custom expiry or Burn-after-read options.")} 
              className="hover:text-yellow-300 transition-colors uppercase font-bold cursor-pointer bg-transparent border-none p-0 outline-none"
            >
              Help
            </button>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Real-time DB status indicator */}
            <div className="flex items-center space-x-1.5 bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded-xs">
              <span className={`inline-block w-2 h-2 rounded-full ${
                dbStatus === "online" ? "bg-green-500 animate-pulse" : dbStatus === "offline" ? "bg-red-500" : "bg-yellow-500 animate-pulse"
              }`} />
              <span className="font-bold text-[8px] sm:text-[9px] uppercase tracking-wider text-white">
                {dbStatus === "online" ? "REDIS: ONLINE" : dbStatus === "offline" ? "REDIS: OFFLINE" : "REDIS: LINKING"}
              </span>
            </div>
            
            {/* Clock */}
            <span className="font-mono font-bold tracking-widest text-yellow-300 select-none bg-neutral-900 px-2 py-0.5 border border-neutral-700 hidden sm:inline">
              {timeString || "00:00:00"}
            </span>
          </div>
        </div>

        {/* Main Header Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => setViewingMode("create")}>
            <div className="bg-black text-white dark:bg-yellow-300 dark:text-black p-2.5 border-2 border-black dark:border-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_#ffdb33] transition-all">
              <Clipboard size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-head uppercase tracking-tighter text-black dark:text-white leading-none mt-1">
                OClip<span className="bg-black text-primary dark:bg-yellow-300 dark:text-black px-1.5 ml-1">V2</span>
              </h1>
              <p className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground dark:text-neutral-400 mt-1 font-bold">
                Universal Key-Value Share
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="relative flex items-center justify-between bg-black text-white dark:bg-white dark:text-black font-head text-[10px] sm:text-xs uppercase px-3 py-2 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer select-none"
            >
              <span className="mr-2 font-bold">{theme === "light" ? "DARK MODE" : "LIGHT MODE"}</span>
              <div className="w-3.5 h-3.5 bg-primary dark:bg-black border border-black rounded-xs flex items-center justify-center">
                <span className="text-[8px]">{theme === "light" ? "○" : "●"}</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8 space-y-12">
        {/* Creator Section */}
        {viewingMode === "create" ? (
          <>
            {/* Input Section Container */}
            <section className="bg-card border-4 border-black shadow-xl dark:shadow-[8px_8px_0_0_#ffdb33] relative transition-all">
              
              {/* Neo-brutalist Custom Tab Headers */}
              <div className="flex border-b-4 border-black bg-neutral-100 dark:bg-neutral-800">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`flex-1 py-4 px-6 font-head text-xs sm:text-sm uppercase tracking-wider border-r-4 border-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "text" 
                      ? "bg-primary text-black font-extrabold" 
                      : "bg-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  <FileText size={18} />
                  Text Clip
                </button>
                <button
                  onClick={() => setActiveTab("file")}
                  className={`flex-1 py-4 px-6 font-head text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "file" 
                      ? "bg-primary text-black font-extrabold" 
                      : "bg-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  <UploadCloud size={18} />
                  File Share
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-6">
                {activeTab === "text" ? (
                  /* Text Paste Area */
                  <div className="space-y-4">
                    <textarea
                      className="w-full p-4 border-2 border-black bg-white dark:bg-neutral-900 text-black dark:text-white focus:bg-accent dark:focus:bg-neutral-800 outline-hidden transition-colors min-h-[180px] font-medium placeholder:text-muted-foreground/50"
                      placeholder="Paste your code, notes, log files, or raw text here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                ) : (
                  /* File Upload Drop Zone */
                  <div className="space-y-4">
                    {!selectedFile ? (
                      <div 
                        {...getRootProps()} 
                        className={`border-4 border-dashed border-black p-10 text-center cursor-pointer transition-colors bg-white dark:bg-neutral-900 hover:bg-yellow-50 dark:hover:bg-neutral-800 flex flex-col items-center justify-center gap-4 ${
                          isDragActive ? "bg-yellow-100 border-solid" : ""
                        }`}
                      >
                        <input {...getInputProps()} />
                        <UploadCloud size={48} className="text-neutral-400 dark:text-neutral-500 animate-bounce" />
                        <div>
                          <p className="font-head text-sm uppercase dark:text-white">
                            {isDragActive ? "DROP FILE HERE!" : "Drag & Drop file here"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            or click to browse your system (Supports up to 2GB files)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-4 border-black p-6 bg-yellow-50 dark:bg-neutral-800 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-4 min-w-0">
                          <File size={36} className="text-black dark:text-yellow-300 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-head text-xs sm:text-sm uppercase truncate dark:text-white">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(selectedFile.size)}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setSelectedFile(null)}
                          className="border-red-500 hover:bg-red-500 text-red-500 hover:text-white border-2 shrink-0"
                          title="Remove File"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Expiry and Burn-After-Read Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t-2 border-neutral-200 dark:border-neutral-800">
                  <div>
                    <label className="block font-head text-xs uppercase mb-1.5 dark:text-white">Expiration Time</label>
                    <select
                      className="w-full p-3 border-2 border-black bg-white dark:bg-neutral-900 text-black dark:text-white font-head appearance-none"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                    >
                      <option value="1h">1 Hour</option>
                      <option value="1d">1 Day</option>
                      <option value="7d">7 Days</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="relative flex items-center gap-3 p-3 border-2 border-black bg-white dark:bg-neutral-900 select-none cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <input 
                        type="checkbox" 
                        checked={burnAfterRead} 
                        onChange={(e) => setBurnAfterRead(e.target.checked)} 
                        className="w-5 h-5 accent-black border-2 border-black rounded-xs shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="block font-head text-xs uppercase text-black dark:text-white">Burn After Read</span>
                        <span className="block text-[10px] text-muted-foreground">Deletes immediately after first download/fetch</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Action */}
                <div>
                  {activeTab === "text" ? (
                    <Button 
                      onClick={saveClipboard}
                      className="w-full text-lg min-h-[52px]"
                      size="lg"
                      disabled={isSaving || !content}
                    >
                      {isSaving ? "GENERATING SECURE CLIP..." : "SAVE TEXT CLIPBOARD"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={uploadAndShareFile}
                      className="w-full text-lg min-h-[52px]"
                      size="lg"
                      disabled={isSaving || !selectedFile}
                    >
                      {isSaving ? "UPLOADING TO SECURE STORAGE..." : "UPLOAD AND SHARE FILE"}
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* Fetch by Code Section */}
            <section className="bg-card border-4 border-black shadow-lg dark:shadow-[6px_6px_0_0_#ffdb33] p-6 relative transition-all">
              <div className="absolute -top-4 -left-4 bg-accent text-black dark:bg-yellow-300 dark:text-black px-4 py-1 font-head text-xs sm:text-sm uppercase border-2 border-black">
                Retrieve Share
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-neutral-400" size={20} />
                  <input
                    type="text"
                    maxLength={4}
                    className="w-full pl-10 pr-4 py-3 border-2 border-black bg-white dark:bg-neutral-900 text-black dark:text-white font-head placeholder:opacity-50 transition-colors uppercase tracking-widest text-center"
                    placeholder="ENTER 4-DIGIT CODE..."
                    value={fetchCode}
                    onChange={(e) => setFetchCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
                <Button 
                  onClick={() => fetchByCode(fetchCode)}
                  variant="secondary"
                  className="px-12 font-bold uppercase tracking-wider"
                  disabled={isFetching || fetchCode.length !== 4}
                >
                  {isFetching ? "RETRIEVING..." : "FETCH CONTENT"}
                </Button>
              </div>
            </section>

            {/* Recent activity block */}
            {clipboards.length > 0 && (
              <section className="space-y-6 pb-12">
                <h2 className="text-3xl font-head uppercase inline-block border-b-4 border-primary dark:text-white select-none">
                  Session Activity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clipboards.map((c) => (
                    <div key={c.code} className="border-4 border-black p-4 bg-card shadow-md dark:shadow-[4px_4px_0_0_#ffdb33] hover:translate-x-1 hover:-translate-y-1 transition-transform group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-black text-white dark:bg-yellow-300 dark:text-black px-2 py-0.5 text-xs font-head">
                            {c.code}
                          </div>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground dark:text-neutral-400">
                            {c.type === "file" ? "FILE" : "TEXT"}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(c.type === "file" ? (c.rawUrl || c.fileUrl) : c.content)}
                            className="h-8 w-8 hover:bg-primary"
                            title={c.type === "file" ? "Copy direct download link" : "Copy text content"}
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyShareLink(`${window.location.origin}/${c.type === "file" ? "f" : "t"}/${c.code}`)}
                            className="h-8 w-8 hover:bg-accent"
                            title="Copy short link"
                          >
                            <LinkIcon size={14} />
                          </Button>
                        </div>
                      </div>
                      
                      {c.type === "file" ? (
                        <div className="flex items-center gap-3">
                          <File size={20} className="text-black dark:text-yellow-300" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate text-black dark:text-white">{c.fileName}</p>
                            <p className="text-[10px] text-muted-foreground">{c.size}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-medium line-clamp-3 text-muted-foreground dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {c.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* Result/View Mode Section */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  setViewingMode("create");
                  setFetchedRecord(null);
                  setFetchedContent("");
                }}
                className="flex items-center gap-2 font-head text-xs uppercase cursor-pointer border-2 border-black bg-white dark:bg-neutral-900 text-black dark:text-white px-3 py-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all"
              >
                <ArrowLeft size={16} />
                Create New Clip
              </button>

              {fetchedRecord?.maxViews === 1 && (
                <div className="flex items-center gap-1.5 bg-red-100 border-2 border-red-500 text-red-700 px-3 py-1 text-xs font-bold font-mono">
                  <AlertTriangle size={14} />
                  BURN AFTER READ (DELETED FROM SERVER)
                </div>
              )}
            </div>

            {fetchedRecord ? (
              <section className="bg-card border-4 border-black shadow-xl dark:shadow-[8px_8px_0_0_#ffdb33] p-6 relative transition-all">
                <div className="absolute -top-4 -left-4 bg-secondary text-white dark:bg-primary dark:text-black px-4 py-1 font-head text-sm uppercase border-2 border-black">
                  {fetchedRecord.type === "file" ? "Shared File" : "Shared Text"}
                </div>
                
                <div className="space-y-6">
                  {fetchedRecord.type === "file" ? (
                    /* File view panel */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-4 border-black p-4 bg-yellow-50 dark:bg-neutral-850 gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <File size={40} className="text-black dark:text-yellow-300 shrink-0" />
                          <div className="min-w-0">
                            <h2 className="font-head text-sm sm:text-md uppercase truncate dark:text-white">{fetchedRecord.fileName}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Size: {fetchedRecord.size} | Views: {fetchedRecord.views} / {fetchedRecord.maxViews}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto shrink-0">
                          <a 
                            href={fetchedRecord.rawUrl || fetchedRecord.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none"
                          >
                            <Button className="w-full flex items-center justify-center gap-2 font-bold px-6">
                              <Download size={18} />
                              DOWNLOAD FILE
                            </Button>
                          </a>
                        </div>
                      </div>

                      {/* Preview rendering */}
                      <div className="space-y-2">
                        <h3 className="font-head text-xs uppercase dark:text-white">File Preview</h3>
                        <FilePreview fileUrl={fetchedRecord.rawUrl || fetchedRecord.fileUrl} fileName={fetchedRecord.fileName} />
                      </div>
                    </div>
                  ) : (
                    /* Text view panel */
                    <div className="relative border-2 border-black bg-white dark:bg-neutral-900">
                      <textarea
                        className="w-full p-4 bg-transparent text-black dark:text-white resize-none outline-hidden min-h-[240px] font-mono text-sm leading-relaxed"
                        readOnly
                        value={fetchedContent}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(fetchedContent)}
                          className="bg-white hover:bg-neutral-100"
                          title="Copy Content"
                        >
                          <Copy size={20} className="text-black" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Sharing info options footer */}
                  <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-6 flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div>
                      <p className="font-head text-xs uppercase dark:text-white">Share Info</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Code: <span className="font-bold font-mono text-black dark:text-white">{fetchedRecord.code}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                      <Button
                        variant="outline"
                        onClick={() => copyShareLink(`${window.location.origin}/${fetchedRecord.type === "file" ? "f" : "t"}/${fetchedRecord.code}`)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <LinkIcon size={14} />
                        COPY SHARE LINK
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          const directUrl = `${window.location.origin}/${fetchedRecord.type === "file" ? "f" : "t"}/${fetchedRecord.code}`;
                          const qrCodeDataUrl = await QRCode.toDataURL(directUrl, { width: 256, margin: 2 });
                          setSavedShareInfo({
                            code: fetchedRecord.code,
                            url: directUrl,
                            qrCodeUrl: qrCodeDataUrl,
                            type: fetchedRecord.type,
                            burnAfterRead: fetchedRecord.maxViews === 1
                          });
                        }}
                        className="flex items-center gap-2 text-xs font-bold"
                      >
                        <QrCode size={14} />
                        VIEW QR CODE
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <div className="text-center py-12 border-4 border-dashed border-black">
                <p className="font-head uppercase text-neutral-500">Loading details...</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Share Success Modal Overlay */}
      {savedShareInfo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border-4 border-black dark:border-white shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:shadow-[12px_12px_0_0_#ffdb33] max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <h2 className="font-head text-lg sm:text-xl uppercase mb-4 text-black dark:text-white">Clip Saved Successfully!</h2>
            
            <div className="space-y-6">
              {/* Massive 4-digit code */}
              <div className="bg-neutral-100 dark:bg-neutral-800 border-2 border-black p-4 select-all">
                <p className="text-[10px] uppercase font-head text-muted-foreground tracking-widest">Share Code</p>
                <p className="text-4xl sm:text-5xl font-head font-extrabold tracking-widest text-black dark:text-yellow-300 mt-1">
                  {savedShareInfo.code}
                </p>
              </div>

              {/* QR Code image */}
              <div className="flex flex-col items-center gap-2">
                <div className="border-4 border-black p-2 bg-white rounded-xs">
                  <img src={savedShareInfo.qrCodeUrl} alt="QR Code" className="w-[160px] h-[160px]" />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadQrCode(savedShareInfo.qrCodeUrl, savedShareInfo.code)}
                  className="flex items-center gap-1.5 border-black dark:border-white mt-1"
                >
                  <Download size={12} />
                  Download QR Code
                </Button>
              </div>

              {/* Direct share link */}
              <div className="space-y-1.5 text-left">
                <label className="block font-head text-[10px] uppercase text-muted-foreground">Direct Link</label>
                <div className="flex border-2 border-black">
                  <input 
                    type="text" 
                    readOnly 
                    value={savedShareInfo.url} 
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 font-mono text-xs text-black dark:text-white select-all border-r-2 border-black outline-hidden"
                  />
                  <Button 
                    onClick={() => copyToClipboard(savedShareInfo.url)}
                    className="rounded-none px-3"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              {savedShareInfo.burnAfterRead && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border-2 border-red-500 text-red-600 dark:text-red-400 p-3 text-xs font-bold font-mono text-left">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Note: This is a Burn After Read item. It will destroy itself from the database immediately after the first fetch.</span>
                </div>
              )}
            </div>

            <Button
              onClick={() => setSavedShareInfo(null)}
              className="w-full py-3 mt-6 text-md font-bold uppercase tracking-wider"
            >
              OK COOL
            </Button>
          </div>
        </div>
      )}

      {/* Legacy General Alert Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border-4 border-black dark:border-white shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:shadow-[12px_12px_0_0_#ffdb33] max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <p className="text-md sm:text-lg font-head mb-8 uppercase leading-tight text-black dark:text-white">{modalMessage}</p>
            <Button
              onClick={() => setShowModal(false)}
              className="w-full py-4 text-lg font-bold uppercase tracking-wider"
            >
              OK COOL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
