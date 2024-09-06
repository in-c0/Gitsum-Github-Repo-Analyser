import { useState } from "react";
import { linkIcon, loader } from "../assets";
// import { mockTreeData } from '../utils/mockTreeData';   // for offline testing. call with setTreeData(mockTreeData)
import { buildFullTree } from '../utils/processDataForTreeView';
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

    try {
      const [owner, repoName] = repo.url.split('/').slice(-2);
      const fetchedTreeData = await buildFullTree(owner, repoName);
      
      if (fetchedTreeData.length > 100) {
        setError("This repository is too large. Only the top-level directory structure is displayed.");
        fetchedTreeData.length = 100; // Limit to top 100 items
      }
      
      setTreeData(fetchedTreeData);
    } catch (error) {
      console.error("Error fetching repository data:", error);
      if (error.message.includes("Not Found")) {
        setError("This repository is either private or does not exist. Only public repositories are supported.");
      } else if (error.message.includes("timeout")) {
        setError("The request timed out. Please try again later.");
      } else {
        setError("An error occurred while fetching the repository data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
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
        {isLoading ? (
          <img src={loader} alt='loader' className='w-20 h-20 object-contain' />
        ) : error ? (
          <div className='font-inter font-bold text-black text-center'>
            <p className='text-red-500'>{error}</p>
            <p className='text-sm mt-2'>Please check the URL and try again.</p>
          </div>
        ) : treeData ? (
          <RepoTreeView treeData={treeData} />
        ) : null}
      </div>
    </section>
  );
};
export default Demo;


// Previously working code:

// export default Demo;

// import { useState, useEffect } from "react";

// import { copy, linkIcon, loader, tick } from "../assets";
// import { useLazyGetSummaryQuery } from "../services/article";

// const Demo = () => {
//   const [article, setArticle] = useState({
//     url: "",
//     summary: "",
//   });
//   const [allArticles, setAllArticles] = useState([]);
//   const [copied, setCopied] = useState("");

//   // RTK lazy query
//   const [getSummary, { error, isFetching }] = useLazyGetSummaryQuery();

//   // Load data from localStorage on mount
//   useEffect(() => {
//     const articlesFromLocalStorage = JSON.parse(
//       localStorage.getItem("articles")
//     );

//     if (articlesFromLocalStorage) {
//       setAllArticles(articlesFromLocalStorage);
//     }
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const existingArticle = allArticles.find(
//       (item) => item.url === article.url
//     );

//     if (existingArticle) return setArticle(existingArticle);

//     const { data } = await getSummary({ articleUrl: article.url });
//     if (data?.summary) {
//       const newArticle = { ...article, summary: data.summary };
//       const updatedAllArticles = [newArticle, ...allArticles];

//       // update state and local storage
//       setArticle(newArticle);
//       setAllArticles(updatedAllArticles);
//       localStorage.setItem("articles", JSON.stringify(updatedAllArticles));
//     }
//   };

//   // copy the url and toggle the icon for user feedback
//   const handleCopy = (copyUrl) => {
//     setCopied(copyUrl);
//     navigator.clipboard.writeText(copyUrl);
//     setTimeout(() => setCopied(false), 3000);
//   };

//   const handleKeyDown = (e) => {
//     if (e.keyCode === 13) {
//       handleSubmit(e);
//     }
//   };

//   return (
//     <section className='mt-16 w-full max-w-xl'>
//       {/* Search */}
//       <div className='flex flex-col w-full gap-2'>
//         <form
//           className='relative flex justify-center items-center'
//           onSubmit={handleSubmit}
//         >
//           <img
//             src={linkIcon}
//             alt='link-icon'
//             className='absolute left-0 my-2 ml-3 w-5'
//           />

//           <input
//             type='url'
//             placeholder='Paste the article link'
//             value={article.url}
//             onChange={(e) => setArticle({ ...article, url: e.target.value })}
//             onKeyDown={handleKeyDown}
//             required
//             className='url_input peer' // When you need to style an element based on the state of a sibling element, mark the sibling with the peer class, and use peer-* modifiers to style the target element
//           />
//           <button
//             type='submit'
//             className='submit_btn peer-focus:border-gray-700 peer-focus:text-gray-700 '
//           >
//             <p>↵</p>
//           </button>
//         </form>

//         {/* Browse History */}
//         <div className='flex flex-col gap-1 max-h-60 overflow-y-auto'>
//           {allArticles.reverse().map((item, index) => (
//             <div
//               key={`link-${index}`}
//               onClick={() => setArticle(item)}
//               className='link_card'
//             >
//               <div className='copy_btn' onClick={() => handleCopy(item.url)}>
//                 <img
//                   src={copied === item.url ? tick : copy}
//                   alt={copied === item.url ? "tick_icon" : "copy_icon"}
//                   className='w-[40%] h-[40%] object-contain'
//                 />
//               </div>
//               <p className='flex-1 font-satoshi text-blue-700 font-medium text-sm truncate'>
//                 {item.url}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Display Result */}
//       <div className='my-10 max-w-full flex justify-center items-center'>
//         {isFetching ? (
//           <img src={loader} alt='loader' className='w-20 h-20 object-contain' />
//         ) : error ? (
//           <p className='font-inter font-bold text-black text-center'>
//             Well, that wasn't supposed to happen...
//             <br />
//             <span className='font-satoshi font-normal text-gray-700'>
//               {error?.data?.error}
//             </span>
//           </p>
//         ) : (
//           article.summary && (
//             <div className='flex flex-col gap-3'>
//               <h2 className='font-satoshi font-bold text-gray-600 text-xl'>
//                 Article <span className='blue_gradient'>Summary</span>
//               </h2>
//               <div className='summary_box'>
//                 <p className='font-inter font-medium text-sm text-gray-700'>
//                   {article.summary}
//                 </p>
//               </div>
//             </div>
//           )
//         )}
//       </div>
//     </section>
//   );
// };

// export default Demo;

// 