import React, { useState, useRef } from 'react';
import { X, FileText, UploadCloud, Trash2, CheckCircle, AlertCircle, Clipboard } from 'lucide-react';

export default function BulkImportModal({ isOpen, onClose, onImport }) {
  const [textInput, setTextInput] = useState(""); // For pasting text
  // setMode/fileInputRef are real scaffolding for the 'upload' mode this
  // component was designed for, but the File Upload Logic branch below is
  // explicitly a stub ("omitted for brevity") with no UI to ever call
  // setMode('upload') -- left in place rather than deleting real
  // in-progress scaffolding during a lint-only pass.
  // eslint-disable-next-line no-unused-vars
  const [mode, setMode] = useState("paste"); // 'paste' or 'upload'
  // eslint-disable-next-line no-unused-vars
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleProcess = () => {
    // Determine what we are processing
    if (mode === 'paste') {
        if (!textInput.trim()) return;
        // Send raw text to App.jsx to decide if it's Action Network dump or Transcript
        onImport(textInput, 'text'); 
        onClose();
        setTextInput("");
    } else {
       // File Upload Logic (Existing)
       // ... (omitted for brevity, keeping simple for this task)
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
           <div className="flex items-center gap-2 text-indigo-400">
             <FileText size={20} />
             <h3 className="font-bold">Data Importer</h3>
           </div>
           <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
        </div>
        
        {/* Body */}
        <div className="p-6 flex-1 flex flex-col gap-6">
           
           <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
              <h4 className="text-sm font-bold text-white mb-1">Supported Formats:</h4>
              <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                  <li><strong>Action Network Splits:</strong> Copy/Paste the full text from the website (Teams + %s).</li>
                  <li><strong>Podcast Transcripts:</strong> Paste text for AI analysis.</li>
              </ul>
           </div>

           <textarea 
              className="flex-1 bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none min-h-[200px]"
              placeholder="Paste Action Network text here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
           />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950">
           <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
           <button 
                onClick={handleProcess} 
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center gap-2"
            >
              <CheckCircle size={16} /> Process Data
           </button>
        </div>
      </div>
    </div>
  );
}