import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Loader2, FileText, Check, Radio, Server, Folder, Plus, ExternalLink } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState([]);
  const [pipeline, setPipeline] = useState('general');
  const [pipelines, setPipelines] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/pipelines")
      .then(res => res.json())
      .then(data => {
        setPipelines(data);
        if (data.general) setPipeline('general');
      })
      .catch(err => {
        console.warn("Backend not found. Loading mock data for UI preview.");
      });
  }, []);

  const createPipeline = async () => {
    if (!newPipelineName.trim()) return;
    setErrorMsg("");
    
    try {
      const res = await fetch("http://localhost:8000/create_pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPipelineName.trim() })
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setPipelines(prev => ({ ...prev, [data.pipeline.id]: data.pipeline }));
        setPipeline(data.pipeline.id);
        setNewPipelineName("");
        setIsCreating(false);
      } else {
        setErrorMsg(data.message);
      }
    } catch (err) {
      setErrorMsg("Error connecting to server.");
    }
  };

  const uploadToBackend = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("pipeline", pipeline);

    try {
      setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'uploading' } : f));
      
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        // Force the link to open in an external browser using target="_blank"
        // Pywebview settings in app.py will catch this and route it to Edge/Chrome
        if (result.sheet_url) {
            const link = document.createElement('a');
            link.href = result.sheet_url;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'completed', url: result.sheet_url } : f));
        return { success: true };
      }
      throw new Error("Upload failed");
    } catch (error) {
      setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error' } : f));
      return { success: false };
    }
  };

  const handleFiles = async (newFiles) => {
    const fileList = Array.from(newFiles);
    const newFileObjects = fileList.map(file => ({ id: Math.random(), name: file.name, status: 'uploading' }));
    setFiles(prev => [...prev, ...newFileObjects]);
    
    for (const f of fileList) {
        await uploadToBackend(f);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#eef2f6]">
      <div className="w-64 bg-[#0a315e] text-white p-8 flex flex-col">
        <h2 className="mb-8 font-bold flex-shrink-0">Nexus Admin</h2>
        
        <div className="flex flex-col gap-4 overflow-y-auto mb-4 flex-grow pr-2">
          {Object.values(pipelines).map(p => (
            <button 
              key={p.id}
              onClick={() => setPipeline(p.id)} 
              className={`flex items-center gap-3 text-left transition-colors ${pipeline === p.id ? 'text-white font-medium' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {p.id === 'general' ? <Radio size={16} className="flex-shrink-0"/> : 
               p.id === 'robot' ? <Server size={16} className="flex-shrink-0"/> : 
               <Folder size={16} className="flex-shrink-0"/>}
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-[#1a4a82] flex-shrink-0">
          {isCreating ? (
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                value={newPipelineName}
                onChange={e => setNewPipelineName(e.target.value)}
                placeholder="New Folder Name"
                className="text-black px-3 py-2 rounded-lg text-sm w-full outline-none"
                autoFocus
              />
              {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
              <div className="flex gap-2">
                <button onClick={createPipeline} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg flex-1 transition-colors">Create</button>
                <button onClick={() => {setIsCreating(false); setErrorMsg("");}} className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-2 rounded-lg flex-1 transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreating(true)} 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Plus size={16}/> Create Folder
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="bg-white rounded-3xl p-10 shadow-sm max-w-2xl mx-auto">
          <div 
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 p-12 rounded-2xl text-center cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            <UploadCloud className="mx-auto text-blue-500 mb-4" size={48} />
            <p>Drag & Drop files</p>
            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>
          <div className="mt-8 space-y-4">
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="flex items-center gap-2"><FileText size={16}/> {f.name}</span>
                
                {/* Status Area */}
                <div className="flex items-center gap-3">
                    {f.status === 'uploading' && <Loader2 className="animate-spin text-blue-500" />}
                    {f.status === 'completed' && <Check className="text-green-500" />}
                    {f.status === 'error' && <span className="text-red-500 text-xs font-medium">Failed</span>}
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}