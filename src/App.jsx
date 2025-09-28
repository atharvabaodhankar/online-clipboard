import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Copy, Trash } from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [content, setContent] = useState("");
  const [expiry, setExpiry] = useState("1d");
  const [clipboards, setClipboards] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // No API to fetch all clipboards, so initializing with an empty array.
    // If a "fetch all" API is added later, this can be updated.
    setClipboards([]);
  }, []);

  // Save new clipboard
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
        // Add to local list
        setClipboards([{ content, code: data.code, expiresAt: expiry }, ...clipboards]);
        setContent("");
        alert(`Saved! Your code: ${data.code}`);
      } else {
        alert("Failed to save clipboard.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch clipboard by code
  const fetchByCode = async (code) => {
    try {
      const res = await fetch(`${API_URL}/api/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.content) {
        alert(`Fetched: ${data.content}`);
      } else {
        alert(data.error || "Failed to fetch");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy to system clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };


  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} min-h-screen`}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Online Clipboard
        </h1>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-700">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Input Section */}
      <div className="p-6 max-w-2xl mx-auto">
        <textarea
          className="w-full p-4 rounded-xl border border-gray-600 bg-transparent focus:ring-2 focus:ring-purple-500"
          rows={4}
          placeholder="Paste or type your text/code here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center justify-between mt-4">
          <select
            className="p-2 rounded-lg border border-gray-600 bg-transparent"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          >
            <option value="1h">1 Hour</option>
            <option value="1d">1 Day</option>
            <option value="7d">7 Days</option>
            <option value="never">Never</option>
          </select>
          <button
            onClick={saveClipboard}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow hover:scale-105 transition"
          >
            Save to Clipboard
          </button>
        </div>
      </div>

      {/* Clipboard Items */}
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">📋 Your Clipboards</h2>
        <div className="space-y-4">
          {clipboards.map((clip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gray-800 shadow-lg flex justify-between items-center"
            >
              <div>
                <p className="font-mono text-sm">{clip.content.slice(0, 100)}...</p>
                <span className="text-xs text-gray-400">Expires: {clip.expiresAt}</span>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => copyToClipboard(clip.content)} className="p-2 rounded-lg hover:bg-gray-700">
                  <Copy size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
