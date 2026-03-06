import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../utils/api';

export default function GistEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [files, setFiles] = useState([]);
  
  const api = useApi();
  
  useEffect(() => {
    loadGist();
  }, [id]);
  
  const loadGist = async () => {
    try {
      const gist = await api.get(`/api/gists/${id}`);
      setDescription(gist.description || '');
      setIsPublic(gist.public || false);
      
      const filesArray = Object.entries(gist.files).map(([name, data]) => ({
        name,
        content: data.content,
        language: data.language
      }));
      
      setFiles(filesArray);
    } catch (err) {
      setError('Failed to load gist');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validFiles = files.filter(f => f.name.trim());
    
    if (validFiles.length === 0) {
      setError('At least one file is required');
      return;
    }
    
    const filesObj = {};
    validFiles.forEach(f => {
      filesObj[f.name] = {
        content: f.content,
        language: f.language
      };
    });
    
    setSaving(true);
    
    try {
      const gist = await api.patch(`/api/gists/${id}`, {
        description,
        public: isPublic,
        files: filesObj
      });
      
      navigate(`/gists/${gist.id}`);
    } catch (err) {
      setError('Failed to update gist');
    } finally {
      setSaving(false);
    }
  };
  
  const addFile = () => {
    setFiles([...files, { name: '', content: '', language: 'javascript' }]);
  };
  
  const updateFile = (index, field, value) => {
    const newFiles = [...files];
    newFiles[index][field] = value;
    setFiles(newFiles);
  };
  
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const languages = [
    'javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'text'
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit gist</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description..."
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded bg-white border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <label htmlFor="public" className="text-sm text-gray-700">
            Public gist - anyone can see this gist
          </label>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Files</label>
            <button
              type="button"
              onClick={addFile}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add file
            </button>
          </div>
          
          {files.map((file, index) => (
            <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={file.name}
                  onChange={(e) => updateFile(index, 'name', e.target.value)}
                  placeholder="filename.js"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-900 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <select
                  value={file.language}
                  onChange={(e) => updateFile(index, 'language', e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-600 text-sm"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={file.content}
                onChange={(e) => updateFile(index, 'content', e.target.value)}
                placeholder="Paste your code here..."
                rows={10}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-900 font-mono text-sm focus:outline-none focus:border-blue-500 resize-y"
              />
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <Link
            to={`/gists/${id}`}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition inline-block"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
