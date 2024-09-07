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
      <div className="hs-accordion-group py-0.5 flex items-center gap-x-0.5 w-full">
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
        <div className="grow hs-accordion-content flex items-center gap-x-3">
          <div className="grow hs-accordion-selectable hs-accordion-selected:bg-gray-100 px-1.5 rounded-md cursor-pointer">
            <div className="flex items-center gap-x-3">
              {node.type === 'dir' ? (
                <svg className="shrink-0 size-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                </svg>
              ) : (
                <svg className="shrink-0 size-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      </div>
      {node.type === 'dir' && node.children && node.children.length > 0 && isExpanded && (
        <div className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300" role="group">
          <ul className="ms-3 ps-3 relative before:absolute before:top-0 before:start-0 before:w-0.5 before:-ms-px before:h-full before:bg-gray-100">
            {node.children.map((child, index) => (
              <TreeNode key={index} node={child} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

const RepoTreeView = ({ treeData }) => {
  return (
    <div className="hs-accordion-group bg-white border border-gray-200 rounded-xl p-4 dark:bg-neutral-800 dark:border-neutral-700">
      <ul className="hs-accordion-treeview-root space-y-1.5" role="tree" aria-orientation="vertical">
        {treeData.map((node, index) => (
          <TreeNode key={index} node={node} />
        ))}
      </ul>
    </div>
  );
};

export default RepoTreeView;
