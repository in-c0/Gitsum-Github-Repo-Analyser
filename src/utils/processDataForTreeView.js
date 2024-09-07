import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: import.meta.env.GITHUB_TOKEN,
});

export const processDataForTreeView = (data) => {
  const buildTree = (items) => {
    return items.map(item => {
      const node = {
        name: item.path.split('/').pop(),
        path: item.path,
        type: item.type === 'blob' ? 'file' : 'dir',
        size: item.size,
        sha: item.sha,
      };

      if (item.type === 'tree') {
        node.children = []; // Placeholder for future recursive calls
      }

      return node;
    });
  };

  return buildTree(data);
};

// Fetch the entire repository tree recursively
export const fetchGitHubTree = async (owner, repo) => {
  try {
    // Fetch the repository tree recursively using Octokit
    const response = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: "1"
    });

    return processDataForTreeView(response.data.tree);
  } catch (error) {
    // Handle GitHub API errors (e.g., rate limiting, private repo access)
    if (error.status === 404) {
      return { error: "This repository is either private or does not exist. Only public repositories are supported." };
    } else if (error.status === 403) {
      return { error: "Rate limit exceeded. Log in for more requests." };
    } else {
      return { error: "An error occurred while fetching the repository data. Please try again." };
    }
  }
};
