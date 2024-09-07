import React, { useState } from 'react';

// TreeNode component
const TreeNode = ({ node }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    if (node.type === 'dir') {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`hs-accordion ${isExpanded ? 'active' : ''}`} role="treeitem" aria-expanded={isExpanded}>
      <div className="hs-accordion-heading py-0.5 flex items-center gap-x-0.5 w-full">
        {node.type === 'dir' && (
          <button
            className="hs-accordion-toggle size-6 flex justify-center items-center hover:bg-gray-100 rounded-md focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
            onClick={toggleExpand}
            aria-expanded={isExpanded}
          >
            <svg
              className="size-4 text-gray-800"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path className={isExpanded ? "hidden" : "block"} d="M12 5v14" />
            </svg>
          </button>
        )}
        <div className="grow hs-accordion-selectable hs-accordion-selected:bg-gray-100 px-1.5 rounded-md cursor-pointer">
          <div className="flex items-center gap-x-3">
            {node.type === 'dir' ? (
              <svg
                className="shrink-0 size-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
            ) : (
              <svg
                className="shrink-0 size-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              </svg>
            )}
            <div className="grow">
              <span className="text-sm text-gray-800">{node.name}</span>
            </div>
          </div>
        </div>
      </div>
      {node.type === 'dir' && node.children && node.children.length > 0 && isExpanded && (
        <div className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300" role="group">
          <div className="hs-accordion-group ps-7 relative before:absolute before:top-0 before:start-3 before:w-0.5 before:-ms-px before:h-full before:bg-gray-300">
            {node.children.map((child, index) => (
              <TreeNode key={index} node={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// RepoTreeView component
const RepoTreeView = ({ treeData }) => {
  return (
    <div className="flex flex-col md:flex-row bg-white p-4 rounded-lg shadow-md">
      {/* Left panel - Treeview */}
      <div className="hs-accordion-treeview-root w-full md:w-1/3 border-r border-gray-200" role="tree" aria-orientation="vertical">
        <div className="hs-accordion-group" role="group" data-hs-accordion-always-open="">
          {treeData.map((node, index) => (
            <TreeNode key={index} node={node} />
          ))}
        </div>
      </div>

      {/* Right panel - Content */}
      <div className="w-full md:w-2/3 p-4">
        <h2 className="text-lg font-semibold text-gray-800">File Content Area</h2>
        <p className="text-gray-600">
          Here you can display the content of the selected file or folder, or provide additional details about the
          structure.
        </p>
      </div>
    </div>
  );
};

export default RepoTreeView;
