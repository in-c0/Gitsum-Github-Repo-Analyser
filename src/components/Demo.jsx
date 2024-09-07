import { useState } from "react";
import { linkIcon, loader } from "../assets";
// import { mockTreeData } from '../utils/mockTreeData';   // for offline testing. call with setTreeData(mockTreeData)
import { fetchGitHubTree } from '../utils/processDataForTreeView';
import RepoTreeView from './RepoTreeView';

const Demo = () => {
  const [repo, setRepo] = useState({ url: "" });
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // For file selection
  const [repoSummary, setRepoSummary] = useState(""); // Repo summary placeholder

  const validateGitHubUrl = (url) => {
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
    return githubUrlPattern.test(url);
  };

  const clearData = () => {
    setTreeData(null);
    setRepoSummary("");
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    clearData();

    if (!validateGitHubUrl(repo.url)) {
      setError("Invalid GitHub URL. Please enter a valid repository URL.");
      setIsLoading(false);
      return;
    }

    const [owner, repoName] = repo.url.split('/').slice(-2);
    const result = await fetchGitHubTree(owner, repoName);  // Use Octokit function

    if (result.error) {
      setError(result.error);
    } else {
      setTreeData(result);
      // Placeholder for repo summary
      setRepoSummary(`Summary for ${repoName}: This repository contains ${result.length} files and directories.`);
    }

    setIsLoading(false);
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    // Generate summary for the selected file, placeholder for now
    setRepoSummary(`Summary for file ${file.name}: This file contains ${file.size} bytes.`);
  };

  return (
    <section className='mt-16 w-full max-w-xl'>
      {/* Input Section */}
      <div className='flex flex-col w-full gap-2'>
        <form
          className='relative flex justify-center items-center'
          onSubmit={handleSubmit}
        >
          <img
            src={linkIcon}
            alt='link-icon'
            className='absolute left-0 my-2 ml-3 w-5'
          />

          <input
            type='url'
            placeholder='Paste the GitHub repository link'
            value={repo.url}
            onChange={(e) => setRepo({ url: e.target.value })}
            required
            className='url_input peer'
          />
          <button
            type='submit'
            className='submit_btn peer-focus:border-gray-700 peer-focus:text-gray-700'
          >
            <p>↵</p>
          </button>
        </form>
      </div>

      {/* Repo Tree and Side Panel */}
      <div className="flex flex-wrap my-10 max-w-full">
        {/* Left: Repo Tree */}
        <div className="flex-grow max-h-screen overflow-auto">
          {isLoading ? (
            <img src={loader} alt='loader' className='w-20 h-20 object-contain' />
          ) : error ? (
            <div className='font-inter font-bold text-black text-center'>
              <p className='text-red-500'>{error}</p>
              <p className='text-sm mt-2'>Please try again later.</p>
            </div>
          ) : treeData ? (
            <RepoTreeView treeData={treeData} onFileClick={handleFileClick} />
          ) : null}
        </div>

        {/* Right: AI Interaction Panel */}
        {treeData && (
          <div className="w-1/2 min-w-[300px] pl-6">
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-md dark:bg-neutral-800 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Interaction Panel</h3>

              {/* Repository Summary */}
              <div className="mt-4">
                <h4 className="text-md font-bold">Repository Summary</h4>
                <p className="text-sm text-gray-800 dark:text-gray-200 mt-2">
                  {repoSummary}
                </p>
              </div>

              {/* File Summary */}
              {selectedFile && (
                <div className="mt-6">
                  <h4 className="text-md font-bold">File Summary</h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-2">
                    Summary for {selectedFile.name}: This file contains {selectedFile.size} bytes.
                  </p>
                </div>
              )}

              {/* Chat Section for AI */}
              <div className="mt-6">
                <h4 className="text-md font-bold">Chat with AI</h4>
                <div className="border-t border-gray-200 pt-4">
                  <textarea
                    placeholder="Ask the AI about the code..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 dark:bg-neutral-700 dark:text-white"
                    rows="4"
                  ></textarea>
                  <button className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600">
                    Ask AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Demo;
