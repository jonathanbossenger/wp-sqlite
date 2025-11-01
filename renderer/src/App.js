import React, { useState, useEffect } from 'react';
import RecentDirectories from './components/RecentDirectories';
import DatabaseViewer from './components/DatabaseViewer';

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState(null);
  const [recentDirectories, setRecentDirectories] = useState([]);

  const loadRecentDirectories = async () => {
    try {
      const directories = await window.electronAPI.getRecentDirectories();
      setRecentDirectories(directories);
    } catch (error) {
      console.error('Error loading recent directories:', error);
    }
  };

  useEffect(() => {
    loadRecentDirectories();
  }, []);

  const handleSelectDirectory = async () => {
    setIsSelecting(true);
    setError(null);
    try {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        setSelectedDirectory(directory);
        await loadRecentDirectories();
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError(error.message || 'Error selecting WordPress Studio directory');
      setSelectedDirectory(null);
    }
    setIsSelecting(false);
  };

  const handleSelectRecentDirectory = async (directory) => {
    setIsSelecting(true);
    setError(null);
    try {
      const validatedDirectory = await window.electronAPI.selectRecentDirectory(directory);
      if (validatedDirectory) {
        setSelectedDirectory(validatedDirectory);
        await loadRecentDirectories();
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError(error.message || 'Error selecting WordPress Studio directory');
      setSelectedDirectory(null);
      await loadRecentDirectories();
    }
    setIsSelecting(false);
  };

  const handleQuit = async () => {
    await window.electronAPI.quitApp();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex flex-col bg-white rounded-xl shadow-lg">
          <div className="p-6 flex-none">
            <h1 className="text-3xl font-bold text-gray-800">WP SQLite Database Viewer</h1>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
          
          {selectedDirectory ? (
            <DatabaseViewer 
              directory={selectedDirectory}
              onChangeDirectory={handleSelectDirectory}
              isSelecting={isSelecting}
              onQuit={handleQuit}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Select your WordPress Studio installation directory
                </h2>
                
                <RecentDirectories 
                  onDirectorySelect={handleSelectRecentDirectory} 
                  isSelecting={isSelecting}
                />

                <div className="space-x-3">
                  <button
                    onClick={handleSelectDirectory}
                    disabled={isSelecting}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition-colors duration-200 shadow-sm"
                  >
                    {isSelecting ? 'Selecting...' : 'Select Directory'}
                  </button>
                  <button
                    onClick={handleQuit}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg text-sm transition-colors duration-200 shadow-sm"
                  >
                    Quit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
