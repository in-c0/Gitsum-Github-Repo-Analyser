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

// RepoTreeView component with tabs
const RepoTreeView = ({ treeData }) => {
  const [activeTab, setActiveTab] = useState('tab1');

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

      {/* Right panel - Tabbed content */}
      <div className="w-full md:w-2/3 p-4">
        <div className="w-full bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200 px-4">
            <nav className="flex gap-x-2" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
              <button
                type="button"
                className={`hs-tab-active:font-semibold hs-tab-active:border-blue-600 hs-tab-active:text-blue-600 py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap ${
                  activeTab === 'tab1'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-blue-600'
                }`}
                aria-selected={activeTab === 'tab1'}
                onClick={() => setActiveTab('tab1')}
                role="tab"
              >
                Summary
              </button>
              <button
                type="button"
                className={`hs-tab-active:font-semibold hs-tab-active:border-blue-600 hs-tab-active:text-blue-600 py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap ${
                  activeTab === 'tab2'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-blue-600'
                }`}
                aria-selected={activeTab === 'tab2'}
                onClick={() => setActiveTab('tab2')}
                role="tab"
              >
                File
              </button>
              <button
                type="button"
                className={`hs-tab-active:font-semibold hs-tab-active:border-blue-600 hs-tab-active:text-blue-600 py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap ${
                  activeTab === 'tab3'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-blue-600'
                }`}
                aria-selected={activeTab === 'tab3'}
                onClick={() => setActiveTab('tab3')}
                role="tab"
              >
                Ask AI
              </button>
            </nav>
          </div>

          <div className="mt-3 p-4">
            {activeTab === 'tab1' && (
              <div id="basic-tabs-1" role="tabpanel" aria-labelledby="basic-tabs-item-1">
                <p className="text-gray-500">
                  This is the <em className="font-semibold text-gray-800">first</em> item's tab body.
                </p>
              </div>
            )}
            {activeTab === 'tab2' && (
              <div id="basic-tabs-2" role="tabpanel" aria-labelledby="basic-tabs-item-2">
                <p className="text-gray-500">
                  This is the <em className="font-semibold text-gray-800">second</em> item's tab body.
                </p>
              </div>
            )}
            {activeTab === 'tab3' && (
              <div id="basic-tabs-3" role="tabpanel" aria-labelledby="basic-tabs-item-3">
                <p className="text-gray-500">
                  This is the <em className="font-semibold text-gray-800">third</em> item's tab body.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepoTreeView;
