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

  const validateGitHubUrl = (url) => {
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
    return githubUrlPattern.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
      if (result.length > 100) {
        setError("This repository is too large. Only the top-level directory structure is displayed.");
        result.length = 100; // Limit to top 100 items
      }
    }

    setIsLoading(false);
  };

  return (
    <section className='mt-16 w-full max-w-xl'>
      {/* An input field to accept the GitHub repository URL */}
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

      {/* Display Result */}
      <div className='my-10 max-w-full flex justify-center items-center'>
        {isLoading ? (
          <img src={loader} alt='loader' className='w-20 h-20 object-contain' />
        ) : error ? (
          <div className='font-inter font-bold text-black text-center'>
            <p className='text-red-500'>{error}</p>
            <p className='text-sm mt-2'>Please try again later, or check FAQ for troubleshooting.</p>
          </div>
        ) : treeData ? (
          <RepoTreeView treeData={treeData} />
        ) : null}
      </div>
    </section>
  );
};

export default Demo;
