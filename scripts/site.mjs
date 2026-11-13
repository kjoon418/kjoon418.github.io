export const site = {
  name: "Watson's Blog",
  author: 'Dr. John H. Watson',
  description: '기술, 일상, 그리고 지나온 일들을 기록합니다.',
  url: 'https://kjoon418.github.io',
  github: 'https://github.com/kjoon418',
};

export const categories = [
  { key: 'all', label: '전체', title: 'All', path: '/category/all/' },
  { key: 'tech', label: '기술', title: 'Tech', path: '/category/tech/' },
  { key: 'daily', label: '일상', title: 'Daily', path: '/category/daily/' },
  { key: 'retrospect', label: '회고', title: 'Retrospect', path: '/category/retrospect/' },
];

export const homeCategory = categories.find(({ key }) => key === 'tech');
