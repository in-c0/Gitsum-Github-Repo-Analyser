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

                
      <div class="w-full bg-white rounded-lg shadow-md">
          <div class="hs-accordion-group">
            <div class="hs-accordion active" id="hs-basic-heading-one">
              <button class="hs-accordion-toggle hs-accordion-active:text-blue-600 px-6 py-3 inline-flex items-center gap-x-3 text-sm w-full font-semibold text-start text-gray-800 hover:text-gray-500 focus:outline-none focus:text-gray-500 rounded-lg disabled:opacity-50 disabled:pointer-events-none" aria-expanded="true" aria-controls="hs-basic-collapse-one">
                <svg class="hs-accordion-active:hidden hs-accordion-active:text-blue-600 hs-accordion-active:group-hover:text-blue-600 block size-4 text-gray-600 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <svg class="hs-accordion-active:block hs-accordion-active:text-blue-600 hs-accordion-active:group-hover:text-blue-600 hidden size-4 text-gray-600 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                </svg>
                Accordion #1
              </button>
              <div id="hs-basic-collapse-one" class="hs-accordion-content w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="hs-basic-heading-one">
                <div class="pb-4 px-6">
                  <p class="text-sm text-gray-600">
                    It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element.
                  </p>
                </div>
              </div>
            </div>

            <div class="hs-accordion" id="hs-basic-heading-two">
              <button class="hs-accordion-toggle hs-accordion-active:text-blue-600 px-6 py-3 inline-flex items-center gap-x-3 text-sm w-full font-semibold text-start text-gray-800 hover:text-gray-500 focus:outline-none focus:text-gray-500 rounded-lg disabled:opacity-50 disabled:pointer-events-none" aria-expanded="false" aria-controls="hs-basic-collapse-two">
                <svg class="hs-accordion-active:hidden hs-accordion-active:text-blue-600 hs-accordion-active:group-hover:text-blue-600 block size-4 text-gray-600 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <svg class="hs-accordion-active:block hs-accordion-active:text-blue-600 hs-accordion-active:group-hover:text-blue-600 hidden size-4 text-gray-600 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                </svg>
                Accordion #2
              </button>
              <div id="hs-basic-collapse-two" class="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="hs-basic-heading-two">
                <div class="pb-4 px-6">
                  <p class="text-sm text-gray-600">
                    It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element.
                  </p>
                </div>
              </div>
            </div>

            <div class="hs-accordion" id="hs-basic-heading-three">
              <button class="hs-accordion-toggle hs-accordion-active:text-blue-600 px-6 py-3 inline-flex items-center gap-x-3 text-sm w-full font-semibold text-start text-gray-800 hover:text-gray-500 focus:outline-none focus:text-gray-500 rounded-lg disabled:opacity-50 disabled:pointer-events-none" aria-expanded="false" aria-controls="hs-basic-collapse-three">
                <svg class="hs-accordion-active:hidden hs-accordion-active:text-blue-600 hs-accordion-active:group-hover:text-blue-600 block size-4 text-gray-600 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <svg class="hs-accordion-active:block hs-accordion-active:text-blue-600 hs-accordion-active:group-hover:text-blue-600 hidden size-4 text-gray-600 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                </svg>
                Accordion #3
              </button>
              <div id="hs-basic-collapse-three" class="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="hs-basic-heading-three">
                <div class="pb-4 px-6">
                  <p class="text-sm text-gray-600">
                    It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
      </div>
    </section>
  );
};

export default Demo;
