import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: import.meta.env.GITHUB_TOKEN,
});

export const processDataForTreeView = (data) => {
  const buildTree = (items, path = '') => {
    const tree = {};
    items.forEach(item => {
      const parts = item.path.split('/');
      let currentLevel = tree;
      
      parts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? (item.type === 'blob' ? 'file' : 'dir') : 'dir',
            size: item.size,
            sha: item.sha,
            children: {},
          };
        }
        currentLevel = currentLevel[part].children;
      });
    });

    const flattenTree = (node) => {
      const children = Object.values(node.children).map(flattenTree);
      const { children: _, ...nodeWithoutChildren } = node;
      return {
        ...nodeWithoutChildren,
        children: children.length > 0 ? children : undefined,
      };
    };

    return Object.values(tree).map(flattenTree);
  };

  return buildTree(data);
};

export const fetchGitHubTree = async (owner, repo) => {
  try {
    const response = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: "1"
    });

    console.log('X-RateLimit-Limit:', response.headers['x-ratelimit-limit']);
    console.log('X-RateLimit-Remaining:', response.headers['x-ratelimit-remaining']);
    console.log('X-RateLimit-Reset:', response.headers['x-ratelimit-reset']);
    console.log('X-RateLimit-Used:', response.headers['x-ratelimit-used']);


    return processDataForTreeView(response.data.tree);
  } catch (error) {
    if (error.status === 404) {
      return { error: "This repository is either private or does not exist. Only public repositories are supported." };
    } else if (error.status === 403) {
      return { error: "Rate limit exceeded. Log in for more requests." };
    } else {
      return { error: "An error occurred while fetching the repository data. Please try again." };
    }
  }
};
