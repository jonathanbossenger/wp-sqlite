import React from 'react';

const TableList = ({ tables, selectedTable, onSelectTable }) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Tables</h3>
        <p className="text-sm text-gray-600 mt-1">{tables.length} tables</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => onSelectTable(table)}
            className={`w-full text-left px-3 py-2 rounded-md mb-1 text-sm transition-colors duration-200 ${
              selectedTable === table
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {table}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TableList;
