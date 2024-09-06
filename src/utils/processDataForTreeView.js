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
    const data = await response.json();
    return processDataForTreeView(data);
  };
  
  export const buildFullTree = async (owner, repo) => {
    const buildRecursive = async (path = '') => {
      const contents = await fetchDirectoryContents(owner, repo, path);
      for (const item of contents) {
        if (item.type === 'dir') {
          item.children = await buildRecursive(item.path);
        }
      }
      return contents;
    };
  
    return buildRecursive();
  };