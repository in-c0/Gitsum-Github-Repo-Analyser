// this is mock data for testing preline UI treeview
export const mockTreeData = [
    {
      name: 'root',
      children: [
        {
          name: 'src',
          children: [
            { name: 'components', children: [{ name: 'Demo.jsx' }, { name: 'Hero.jsx' }] },
            { name: 'services', children: [{ name: 'article.js' }] },
            { name: 'utils', children: [{ name: 'index.js' }] },
          ],
        },
        {
          name: 'public',
          children: [{ name: 'favicon.ico' }, { name: 'index.html' }],
        },
        { name: 'package.json' },
        { name: 'README.md' },
      ],
    },
  ];
  