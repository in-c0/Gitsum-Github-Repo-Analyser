import { useState } from "react";
import { linkIcon, loader } from "../assets";
import { fetchGitHubTree, fetchGitHubFileContent } from '../utils/processDataForTreeView';  // import the file fetching function
import RepoTreeView from './RepoTreeView';


const Demo = () => {
  const [repo, setRepo] = useState({ url: "" });
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [repoSummary, setRepoSummary] = useState("");
  const [fileContent, setFileContent] = useState("");

  const [owner, repoName] = repo.url.split('/').slice(-2);

  const validateGitHubUrl = (url) => {
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
    return githubUrlPattern.test(url);
  };

  const clearData = () => {
    setTreeData(null);
    setRepoSummary("");
    setSelectedFile(null);
    setFileContent("");
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

  const handleFileClick = async (file) => {
    const [owner, repoName] = repo.url.split('/').slice(-2);
    setSelectedFile(file);
  
    // Fetch file content using Octokit
    const content = await fetchGitHubFileContent(owner, repoName, file.path);
  
    if (content.error) {
      setError(content.error);
    } else {
      setFileContent(content);
  
      // Assuming you have a function to summarize the file using ChatGPT or another service
      const summary = await summarizeFileContent(content);  // Placeholder for your summarization logic
      setRepoSummary(summary);
    }
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
            <RepoTreeView treeData={treeData} onFileClick={handleFileClick} owner={owner} repo={repoName} />
          ) : null}
        </div>

        {selectedFile && (
          <div className="w-full">
            <h3 className="text-lg font-bold mt-4">File Content</h3>
            <pre>{fileContent}</pre>
          </div>
        )}

        {repoSummary && (
          <div className="w-full mt-4">
            <h3 className="text-lg font-bold">Summary</h3>
            <p>{repoSummary}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Demo;
