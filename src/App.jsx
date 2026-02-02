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

  const API_URL = import.meta.env.VITE_API_URL;

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
    if (!content) return;
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
    }
  };

  const fetchByCode = async (code) => {
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
      <div className="bg-black text-white py-1 px-4 overflow-hidden whitespace-nowrap border-b-2 border-black">
        <div className="animate-marquee inline-block font-head text-[10px] uppercase tracking-widest leading-none">
          Retro Clipboard v2.0 • Secure End-to-End • Open Source • Built for Speed • No Account Required • 
          Retro Clipboard v2.0 • Secure End-to-End • Open Source • Built for Speed • No Account Required • 
        </div>
      </div>

      {/* Main Navbar */}
      <header className="border-b-4 border-black px-4 lg:px-8 py-4 lg:py-6 bg-primary shadow-[8px_8px_0_0_rgba(0,0,0,1)] sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="bg-black p-2 border-2 border-white shadow-[2px_2px_0_0_rgba(255,255,255,1)] group-hover:bg-accent transition-colors">
            <Clipboard size={24} className="text-white group-hover:text-black transition-colors" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-head uppercase tracking-tighter text-black leading-none mt-1">
            Retro<span className="bg-black text-primary px-1 ml-1">Clipboard</span>
          </h1>
        </div>
        
        <nav className="flex items-center gap-3 md:gap-6">
        
          <p className="font-head text-black text-xs md:text-sm italic font-bold">
            FAST. SECURE. <span className="underline decoration-2">RETRO.</span>
          </p>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8 space-y-12">
        {/* Input Section */}
        <section className="bg-card border-4 border-black shadow-xl p-6 relative">
          <div className="absolute -top-4 -left-4 bg-black text-white px-4 py-1 font-head text-sm uppercase">
            New Clip
          </div>
          <div className="space-y-4">
            <textarea
              className="w-full p-4 border-2 border-black bg-white focus:bg-accent outline-hidden transition-colors min-h-[160px] font-medium placeholder:text-muted-foreground/50"
              placeholder="Paste your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-head text-xs uppercase mb-1">Expiration</label>
                <select
                  className="w-full p-3 border-2 border-black bg-white font-head appearance-none"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                >
                  <option value="1h">1 Hour</option>
                  <option value="1d">1 Day</option>
                  <option value="7d">7 Days</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <div className="flex items-end flex-1">
                <Button 
                  onClick={saveClipboard}
                  className="w-full text-lg h-full min-h-[52px]"
                  size="lg"
                >
                  SAVE CLIPBOARD
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Display Fetched Content */}
        {fetchedContent && (
          <section className="bg-card border-4 border-black shadow-xl p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="absolute -top-4 -left-4 bg-secondary text-white px-4 py-1 font-head text-sm uppercase">
              Fetched Result
            </div>
            <div className="relative border-2 border-black bg-white">
              <textarea
                className="w-full p-4 bg-transparent resize-none outline-none min-h-[160px] font-medium"
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
        <section className="bg-white border-4 border-black shadow-lg p-6 relative">
          <div className="absolute -top-4 -left-4 bg-accent text-black px-4 py-1 font-head text-sm uppercase border-2 border-black">
            Fetch Cache
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border-2 border-black font-head placeholder:opacity-50"
                placeholder="ENTER CODE..."
                value={fetchCode}
                onChange={(e) => setFetchCode(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => fetchByCode(fetchCode)}
              variant="secondary"
              className="px-12"
            >
              FETCH CONTENT
            </Button>
          </div>
        </section>

        {/* Recent Clipboards */}
        {clipboards.length > 0 && (
          <section className="space-y-6 pb-12">
            <h2 className="text-3xl font-head uppercase inline-block border-b-4 border-primary">
              Recent Activity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clipboards.map((c) => (
                <div key={c.code} className="border-4 border-black p-4 bg-white shadow-md hover:translate-x-1 hover:-translate-y-1 transition-transform group">
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
                  <p className="text-sm font-medium line-clamp-3 text-muted-foreground group-hover:text-black transition-colors">
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
          <div className="bg-white border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <p className="text-xl font-head mb-8 uppercase leading-tight">{modalMessage}</p>
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
