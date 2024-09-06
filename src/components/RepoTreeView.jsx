import React, { useState } from 'react';

const TreeNode = ({ node }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    if (node.type === 'dir') {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <li className="hs-accordion" role="treeitem" aria-expanded={isExpanded}>
      <div className="hs-accordion-group py-1 px-2 flex items-center gap-x-3 w-full">
        {node.type === 'dir' && (
          <button
            className="hs-accordion-toggle size-5 flex justify-center items-center rounded-md focus:outline-none focus:bg-gray-100 dark:focus:bg-neutral-700"
            onClick={toggleExpand}
          >
            <svg
              className={`size-3.5 text-gray-800 dark:text-neutral-200 ${isExpanded ? 'transform rotate-90' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
        <div className="grow hs-accordion-content flex items-center gap-x-3">
          {node.type === 'dir' ? (
            <svg className="size-4 text-gray-500 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          ) : (
            <svg className="size-4 text-gray-500 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
          )}
          <span className="text-sm text-gray-800 dark:text-neutral-200">{node.name}</span>
        </div>
      </div>
      {node.type === 'dir' && node.children && node.children.length > 0 && isExpanded && (
        <ul className="hs-accordion-group ps-4 mt-1">
          {node.children.map((child, index) => (
            <TreeNode key={index} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

const RepoTreeView = ({ treeData }) => {
  return (
    <div className="hs-accordion-group bg-white border border-gray-200 rounded-xl p-4 dark:bg-neutral-800 dark:border-neutral-700">
      <ul className="space-y-1.5">
        {treeData.map((node, index) => (
          <TreeNode key={index} node={node} />
        ))}
      </ul>
    </div>
  );
};

export default RepoTreeView;
