import { useState, useEffect } from "react";
import { Copy, Link as LinkIcon, Clipboard, Search } from "lucide-react";
import { Button } from "@/components/retroui/Button";

export default function App() {
  const [content, setContent] = useState("");
  const [expiry, setExpiry] = useState("1d");
  const [clipboards, setClipboards] = useState([]);
  const [fetchCode, setFetchCode] = useState("");
  const [fetchedContent, setFetchedContent] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [dbStatus, setDbStatus] = useState("loading");
  const [timeString, setTimeString] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

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
      } catch (err) {
        setDbStatus("offline");
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setClipboards([]);
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code");
      if (urlCode) {
        setFetchCode(urlCode);
        fetchByCode(urlCode);
      }
    } catch (e) {
      // ignore
    }
  }, []);


  const saveClipboard = async () => {
    if (!content || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, expiresAt: expiry }),
      });
      const data = await res.json();

      if (data.code) {
        const newEntry = { content, code: data.code, expiresAt: expiry };
        setClipboards([newEntry, ...clipboards]);
        setContent("");
        const link = `${window.location.origin}/?code=${data.code}`;
        setShareLink(link);
        showAlertDialog(`Success! Code: ${data.code}`);
      } else {
        showAlertDialog("Failed to save clipboard.");
      }
    } catch (err) {
      console.error(err);
      showAlertDialog("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchByCode = async (code) => {
    if (!code || isFetching) return;
    setIsFetching(true);
    try {
      const res = await fetch(`${API_URL}/api/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.content) {
        setFetchedContent(data.content);
      } else {
        showAlertDialog(data.error || "Failed to fetch");
        setFetchedContent("");
      }
    } catch (err) {
      console.error(err);
      showAlertDialog("Network error. Could not fetch.");
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
    } catch (e) {
      showAlertDialog("Failed to copy link");
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen font-sans selection:bg-primary selection:text-black">
      {/* Top Banner / Decorative Bar */}
      <div className="overflow-hidden border-b-4 border-black bg-black py-2 text-yellow-300 dark:text-yellow-400 font-head text-xs tracking-wider select-none">
        <div className="flex w-max animate-marquee">
          <div className="px-4 whitespace-nowrap">
            ★ RETRO CLIPBOARD V2.0 ✦ SECURE END-TO-END ✦ ZERO TRACKING ✦ NO ACCOUNT REQUIRED ✦ UPSTASH REDIS POWERED ✦ 100% HAND-CRAFTED ✦&nbsp;
          </div>
          <div className="px-4 whitespace-nowrap">
            ★ RETRO CLIPBOARD V2.0 ✦ SECURE END-TO-END ✦ ZERO TRACKING ✦ NO ACCOUNT REQUIRED ✦ UPSTASH REDIS POWERED ✦ 100% HAND-CRAFTED ✦&nbsp;
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 bg-primary dark:bg-card border-b-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_#3a3a3a] transition-colors">
        {/* Menu Bar (Classic OS System style) */}
        <div className="bg-black text-white px-4 py-1.5 flex justify-between items-center text-[10px] sm:text-xs font-mono border-b-2 border-black">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="font-bold tracking-wider text-yellow-300">SYSTEM v2.0</span>
            <span className="opacity-50">|</span>
            <button 
              onClick={() => showAlertDialog("Retro Clipboard is a 100% serverless, zero-tracking, temporary copy-paste tool. Built with Redis & React.")} 
              className="hover:text-yellow-300 transition-colors uppercase font-bold cursor-pointer bg-transparent border-none p-0 outline-none"
            >
              About
            </button>
            <span className="opacity-50">|</span>
            <button 
              onClick={() => showAlertDialog("To save a clip, paste your text and select an expiration. Share the generated 4-digit code. To fetch, enter a code in the Fetch box.")} 
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
          <div className="flex items-center space-x-4 group cursor-pointer">
            <div className="bg-black text-white dark:bg-yellow-300 dark:text-black p-2.5 border-2 border-black dark:border-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_#ffdb33] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all">
              <Clipboard size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-head uppercase tracking-tighter text-black dark:text-white leading-none mt-1">
                Retro<span className="bg-black text-primary dark:bg-yellow-300 dark:text-black px-1.5 ml-1">Clipboard</span>
              </h1>
              <p className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground dark:text-neutral-400 mt-1 font-bold">
                Hand-crafted Key-Value Share
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Switch Button */}
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
        {/* Input Section */}
        <section className="bg-card border-4 border-black shadow-xl dark:shadow-[8px_8px_0_0_#ffdb33] p-6 relative transition-all">
          <div className="absolute -top-4 -left-4 bg-black text-white dark:bg-yellow-300 dark:text-black px-4 py-1 font-head text-sm uppercase border-2 border-black">
            New Clip
          </div>
          <div className="space-y-4">
            <textarea
              className="w-full p-4 border-2 border-black bg-white dark:bg-neutral-900 text-black dark:text-white focus:bg-accent dark:focus:bg-neutral-800 outline-hidden transition-colors min-h-[160px] font-medium placeholder:text-muted-foreground/50"
              placeholder="Paste your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-head text-xs uppercase mb-1 dark:text-white">Expiration</label>
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
              <div className="flex items-end flex-1">
                <Button 
                  onClick={saveClipboard}
                  className="w-full text-lg h-full min-h-[52px]"
                  size="lg"
                  disabled={isSaving}
                >
                  {isSaving ? "GENERATING..." : "SAVE CLIPBOARD"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Display Fetched Content */}
        {fetchedContent && (
          <section className="bg-card border-4 border-black shadow-xl dark:shadow-[8px_8px_0_0_#ffdb33] p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300 transition-all">
            <div className="absolute -top-4 -left-4 bg-secondary text-white dark:bg-primary dark:text-black px-4 py-1 font-head text-sm uppercase border-2 border-black">
              Fetched Result
            </div>
            <div className="relative border-2 border-black bg-white dark:bg-neutral-900">
              <textarea
                className="w-full p-4 bg-transparent text-black dark:text-white resize-none outline-none min-h-[160px] font-medium"
                readOnly
                value={fetchedContent}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(fetchedContent)}
                className="absolute top-2 right-2"
                title="Copy Content"
              >
                <Copy size={20} />
              </Button>
            </div>
          </section>
        )}

        {/* Fetch by Code Section */}
        <section className="bg-card border-4 border-black shadow-lg dark:shadow-[6px_6px_0_0_#ffdb33] p-6 relative transition-all">
          <div className="absolute -top-4 -left-4 bg-accent text-black dark:bg-yellow-300 dark:text-black px-4 py-1 font-head text-sm uppercase border-2 border-black">
            Fetch Cache
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-neutral-400" size={20} />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border-2 border-black bg-white dark:bg-neutral-900 text-black dark:text-white font-head placeholder:opacity-50 transition-colors"
                placeholder="ENTER CODE..."
                value={fetchCode}
                onChange={(e) => setFetchCode(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => fetchByCode(fetchCode)}
              variant="secondary"
              className="px-12"
              disabled={isFetching}
            >
              {isFetching ? "FETCHING..." : "FETCH CONTENT"}
            </Button>
          </div>
        </section>

        {/* Recent Clipboards */}
        {clipboards.length > 0 && (
          <section className="space-y-6 pb-12">
            <h2 className="text-3xl font-head uppercase inline-block border-b-4 border-primary dark:text-white">
              Recent Activity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clipboards.map((c) => (
                <div key={c.code} className="border-4 border-black p-4 bg-card shadow-md dark:shadow-[4px_4px_0_0_#ffdb33] hover:translate-x-1 hover:-translate-y-1 transition-transform group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-black text-white px-2 py-0.5 text-xs font-head">
                      {c.code}
                    </div>
                    <div className="flex space-x-2">
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(c.content)}
                        className="h-8 w-8 hover:bg-primary"
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyShareLink(`${window.location.origin}/?code=${c.code}`)}
                        className="h-8 w-8 hover:bg-accent"
                      >
                        <LinkIcon size={14} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-medium line-clamp-3 text-muted-foreground dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border-4 border-black dark:border-white shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:shadow-[12px_12px_0_0_#ffdb33] max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <p className="text-xl font-head mb-8 uppercase leading-tight text-black dark:text-white">{modalMessage}</p>
            <Button
              onClick={() => setShowModal(false)}
              className="w-full py-6 text-xl"
            >
              OK COOL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
