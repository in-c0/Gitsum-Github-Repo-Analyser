import { useState } from "react";
import { linkIcon } from "../assets";
import { mockTreeData } from '../utils/mockTreeData';
import { buildFullTree } from '../utils/processDataForTreeView';
import RepoTreeView from './RepoTreeView';

const Demo = () => {
  const [repo, setRepo] = useState({ url: "" });
  const [treeData, setTreeData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const [owner, repo] = article.url.split('/').slice(-2);
    // const treeData = await buildFullTree(owner, repo);
    setTreeData(mockTreeData); // offline mock data for now
    
  };

  return (
    <section className='mt-16 w-full max-w-xl'>
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
      {article.treeData && (
        <RepoTreeView treeData={article.treeData} />
      )}
    </div>    
    </section>
  );
};

export default Demo;