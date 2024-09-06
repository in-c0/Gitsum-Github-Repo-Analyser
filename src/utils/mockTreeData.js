// this is mock data for testing preline UI treeview
export const mockTreeData = [
    {
      name: 'root',
      type: 'dir',
      children: [
        {
          name: 'src',
          type: 'dir',
          children: [
            { name: 'components', type: 'dir', children: [{ name: 'Demo.jsx', type: 'file' }, { name: 'Hero.jsx', type: 'file' }] },
            { name: 'services', type: 'dir', children: [{ name: 'article.js', type: 'file' }] },
            { name: 'utils', type: 'dir', children: [{ name: 'index.js', type: 'file' }] },
          ],
        },
        {
          name: 'public',
          type: 'dir',
          children: [{ name: 'favicon.ico', type: 'file' }, { name: 'index.html', type: 'file' }],
        },
        { name: 'package.json', type: 'file' },
        { name: 'README.md', type: 'file' },
      ],
    },
  ];