import { useState, useEffect } from "react";
import { linkIcon, loader } from "../assets";
import RepoTreeView from './RepoTreeView';
import { flushSync } from 'react-dom';

const Demo = () => {
  const [repo, setRepo] = useState({ url: "" });
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [repoSummary, setRepoSummary] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [progress, setProgress] = useState(""); 

  const validateGitHubUrl = (url) => {
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
    return githubUrlPattern.test(url);
  };

  const clearData = () => {
    setTreeData(null);
    setRepoSummary("");
    setSelectedFile(null);
    setFileContent("");
    setProgress("");
  };

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    
    const [owner, repoName] = repo.url.split('/').slice(-2);
    
    // Fetch the file content from GitHub
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file content for ${file.path}`);
      }
      const fileData = await response.json();
      const content = atob(fileData.content);  // Decode base64
      setFileContent(content);
    } catch (error) {
      setError(`Failed to fetch file content: ${error.message}`);
    }
  };

  const fetchSummary = (owner, repoName) => {
    setRepoSummary(""); // Clear previous summary
    setProgress("Fetching repository summary...");
  
    const eventSource = new EventSource(`/api/github/summary?owner=${owner}&repo=${repoName}`);
  
    eventSource.onmessage = function (event) {
      console.log("Chunk received: ", event.data);
  
      // Update the repoSummary with the streamed data
      setRepoSummary((prevSummary) => prevSummary + event.data);
  
      // Handle the completion when "[DONE]" is received
      if (event.data.includes("[DONE]")) {
        eventSource.close();
        setProgress("Summary fetched!");
      } else {
        setProgress("Summary is being updated...");
      }
    };
  
    eventSource.onerror = function (error) {
      console.error("Error in streaming:", error);
      setError("Failed to load repository summary.");
      eventSource.close();
    };
  };
  

  
   

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    clearData();

    // Validate the GitHub URL
    if (!validateGitHubUrl(repo.url)) {
      setError("Invalid GitHub URL. Please enter a valid repository URL.");
      setIsLoading(false);
      return;
    }

    const [owner, repoName] = repo.url.split('/').slice(-2);
    if (!owner || !repoName) {
      setError("Could not extract owner and repo name from the URL.");
      setIsLoading(false);
      return;
    }

    setProgress("Fetching repository tree...");

    // Call backend to get the tree
    try {
      const response = await fetch(`/api/github/repo?owner=${owner}&repo=${repoName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch repository tree');
      }

      const { treeData } = await response.json();
      setTreeData(treeData);

      // Fetch the summary in the background
      fetchSummary(owner, repoName);
    } catch (error) {
      setError("Failed to load repository.");
    }

    setIsLoading(false);
  };

  return (
    <section className='mt-16 w-full max-w-xl'>
      {/* Input Section */}
      <div className='flex flex-col w-full gap-2'>
        <form className='relative flex justify-center items-center' onSubmit={handleSubmit}>
          <img src={linkIcon} alt='link-icon' className='absolute left-0 my-2 ml-3 w-5' />
          <input type='url' placeholder='Paste the GitHub repository link' value={repo.url} onChange={(e) => setRepo({ url: e.target.value })} required className='url_input peer' />
          <button type='submit' className='submit_btn peer-focus:border-gray-700 peer-focus:text-gray-700'>
            <p>↵</p>
          </button>
        </form>
      </div>

      {/* Display Progress */}
      {progress && (
        <div className="w-full mt-4">
          <h3 className="text-lg font-bold">Progress</h3>
          <p>{progress}</p>
        </div>
      )}

      {/* Display Summary */}
      {repoSummary && (
        <div className="w-full mt-4">
          <h3 className="text-lg font-bold">Summary</h3>
          <p>{repoSummary}</p>
        </div>
      )}

      {/* Repo Tree and Interaction Panel */}
      <div className="flex flex-wrap my-10 max-w-full">
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

        {/* File Content Panel */}
        {selectedFile && fileContent && (
          <div className="w-full mt-4">
            <h3 className="text-lg font-bold">File Content</h3>
            <pre>{fileContent}</pre>
          </div>
        )}
      </div>
    </section>
  );
};

export default Demo;
