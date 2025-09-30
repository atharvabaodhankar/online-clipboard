import { useState, useEffect } from "react";
import { Sun, Moon, Copy } from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [content, setContent] = useState("");
  const [expiry, setExpiry] = useState("1d");
  const [clipboards, setClipboards] = useState([]);
  const [fetchCode, setFetchCode] = useState("");
  const [fetchedContent, setFetchedContent] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

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
        showAlertDialog(`Saved! Your code: ${data.code}`);
      } else {
        showAlertDialog("Failed to save clipboard.");
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
        setFetchedContent(data.content);
      } else {
        showAlertDialog(data.error || "Failed to fetch");
        setFetchedContent("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy to system clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showAlertDialog("Copied!");
  };

  const showAlertDialog = (message) => {
    setModalMessage(message);
    setShowModal(true);
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

      {/* Display Fetched Content */}
      {fetchedContent && (
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Fetched Content</h2>
          <div className="relative p-4 rounded-xl border border-gray-600 bg-transparent">
            <textarea
              className="w-full p-2 bg-transparent resize-none outline-none overflow-y-auto"
              rows={4}
              readOnly
              value={fetchedContent}
            />
            <button
              onClick={() => copyToClipboard(fetchedContent)}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-700"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Fetch by Code Section */}
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Fetch Clipboard by Code</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-grow p-4 rounded-xl border border-gray-600 bg-transparent focus:ring-2 focus:ring-purple-500"
            placeholder="Enter code to fetch"
            value={fetchCode}
            onChange={(e) => setFetchCode(e.target.value)}
          />
          <button
            onClick={() => fetchByCode(fetchCode)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow hover:scale-105 transition"
          >
            Fetch
          </button>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full text-center transform transition-all scale-100 opacity-100 duration-300 ease-out">
            <div className="p-6">
              <p className="text-lg text-gray-200 mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
