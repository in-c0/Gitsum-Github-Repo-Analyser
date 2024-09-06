// handles the GitHub API response and create a nested structure suitable for a tree view
// We are going to use GitHub API Call to layout a public Repository Structure:
// GET https://api.github.com/repos/{owner}/{repo}/contents/
// which will give us a response as such :
// [ { "name": "README.md", "path": "README.md", "type": "file", "size": 536, "download_url": "https://raw.githubusercontent.com/owner/sample-repo/main/README.md" }, { "name": "src", "path": "src", "type": "dir", "size": 0 }, { "name": "docs", "path": "docs", "type": "dir", "size": 0 }, ... ]
// (we will recursively fetch the directory structure for each folder)
export const processDataForTreeView = (data) => {
    const buildTree = (items) => {
      return items.map(item => {
        const node = {
          name: item.name,
          path: item.path,
          type: item.type,
          size: item.size,
          download_url: item.download_url
        };
  
        if (item.type === 'dir') {
          node.children = []; // Placeholder for future recursive calls
        }
  
        return node;
      });
    };
  
    return buildTree(data);
  };
      
  export const fetchDirectoryContents = async (owner, repo, path = '') => {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
      
      if (!response.ok) {
        if (response.status === 404) {
            return { error: "This repository is either private or does not exist. Only public repositories are supported." };
        } else if (response.status === 403) {
            return { error: "API rate limit exceeded. Please try again later." };
        } else {
            return { error: "An error occurred while fetching the repository data. Please try again." };
        }
      }

      const data = await response.json();
      return processDataForTreeView(data);
  };

  export const buildFullTree = async (owner, repo) => {
    const buildRecursive = async (path = '') => {
      const contents = await fetchDirectoryContents(owner, repo, path);
      if (contents.error) {
        return contents;
      }
      for (const item of contents) {
        if (item.type === 'dir') {
          const subContents = await buildRecursive(item.path);
          if (subContents.error) {
            return subContents;
          }
          item.children = subContents;
        }
      }
      return contents;
    };

    return buildRecursive();
  };