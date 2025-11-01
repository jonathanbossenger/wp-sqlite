import React, { useState, useEffect } from 'react';

const RecentDirectories = ({ onDirectorySelect, isSelecting }) => {
  const [recentDirectories, setRecentDirectories] = useState([]);

  useEffect(() => {
    const loadRecentDirectories = async () => {
      try {
        const directories = await window.electronAPI.getRecentDirectories();
        setRecentDirectories(directories);
      } catch (error) {
        console.error('Error loading recent directories:', error);
      }
    };

    loadRecentDirectories();
  }, []);

  if (recentDirectories.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-700 mb-3">Recent Directories</h3>
      <div className="space-y-2 max-w-2xl mx-auto">
        {recentDirectories.map((directory, index) => (
          <button
            key={index}
            onClick={() => onDirectorySelect(directory)}
            disabled={isSelecting}
            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-50 transition-colors duration-200 font-mono text-sm text-gray-600"
          >
            {directory}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentDirectories;
