import { useState } from "react";
import { linkIcon } from "../assets";
import { mockTreeData } from '../utils/mockTreeData';

const Demo = () => {
  const [repo, setRepo] = useState({ url: "" });
  const [treeData, setTreeData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTreeData(mockTreeData);
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

      {treeData && (
        <div className='my-10 max-w-full flex justify-center items-center'>
          <div className='flex flex-col gap-3'>
            <h2 className='font-satoshi font-bold text-gray-600 text-xl'>
              Repository <span className='blue_gradient'>Structure</span>
            </h2>
            <div className='tree-view'>
              <pre>{JSON.stringify(treeData, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Demo;