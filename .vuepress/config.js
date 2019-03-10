const path = require('path')

module.exports = {
  title: 'Onyx Framework',
  plugins: [
    '@vuepress/back-to-top',
    '@vuepress/medium-zoom',
    [
      '@vuepress/google-analytics', {
        ga: 'UA-135279567-3'
      }
    ]
    [
      'sitemap', {
        hostname: 'https://docs.onyxframework.org'
      }
    ]
  ],
  themeConfig: {
    lastUpdated: 'Last Updated',
    repo: 'onyxframework/docs',
    editLinks: true,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'HTTP', link: '/http/' },
      { text: 'SQL', link: '/sql/' },
      { text: 'EDA', link: '/eda/' }
    ],
    sidebar: [
      {
        title: 'Essentials',
        collapsable: false,
        children: [
          ['/', 'Introduction'],
          ['/installation', 'Installation'],
          ['/components-overview', 'Components Overview']
        ]
      },
      {
        title: 'HTTP',
        collapsable: false,
        children: [
          ['/http/', 'Getting started'],
          ['/http/routing', 'Routing'],
          ['/http/headers', 'Headers'],
          ['/http/errors', 'Errors'],
          ['/http/views', 'Views'],
          ['/http/endpoints', 'Endpoints'],
          ['/http/channels', 'Channels']
        ]
      },
      {
        title: 'SQL',
        collapsable: false,
        children: [
          ['/sql/', 'Getting started'],
          ['/sql/schema', 'Schema'],
          ['/sql/query', 'Query']
        ]
      },
      {
        title: 'EDA',
        collapsable: false,
        children: [
          ['/eda/', 'Introduction'],
          ['/eda/events', 'Events'],
          ['/eda/channels/', 'Channels'],
          ['/eda/channels/in-memory', 'In-memory'],
          ['/eda/channels/redis', 'Redis']
        ]
      },
      {
        title: 'Advanced HTTP',
        collapsable: false,
        children: [
          ['/http/advanced/custom-error-renderer', 'Custom error renderer'],
          ['/http/advanced/custom-middleware', 'Custom middleware'],
          ['/http/advanced/custom-server', 'Custom server'],
          ['/http/advanced/multiple-servers', 'Multiple servers']
        ]
      },
      {
        title: 'Advanced SQL',
        collapsable: false,
        children: [
          ['/sql/advanced/custom-converters', 'Custom converters'],
          ['/sql/advanced/annotations', 'Annotations'],
          ['/sql/advanced/serializable', 'Serializable']
        ]
      },
      {
        title: 'Advanced EDA',
        collapsable: false,
        children: [
          ['/eda/advanced/custom-channels', 'Custom channels']
        ]
      }
    ]
  }
}
