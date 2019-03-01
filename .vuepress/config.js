const path = require('path')

module.exports = {
  title: 'Onyx Framework',
  plugins: [
    '@vuepress/back-to-top',
    [
      '@vuepress/google-analytics', {
        ga: 'UA-135279567-3'
      }
    ],
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
      { text: 'REST', link: '/rest/' },
      { text: 'SQL', link: '/sql/' },
      { text: 'EDA', link: '/eda/' }
    ],
    sidebar: {
      '/rest/': [
        {
          title: 'Essentials',
          collapsable: false,
          children: [
            ['/rest/', 'Introduction'],
            ['/rest/routing', 'Routing'],
            ['/rest/actions', 'Actions'],
            ['/rest/views', 'Views'],
            ['/rest/renderers', 'Renderers'],
            ['/rest/channels', 'Channels']
          ]
        },
        {
          title: 'Best practices',
          collapsable: true,
          children: [
            ['/rest/best-practices/views', 'Views'],
            ['/rest/best-practices/authentication', 'Authentication']
          ]
        },
        {
          title: 'Advanced',
          collapsable: true,
          children: [
            ['/rest/advanced/params', 'Advanced params'],
            ['/rest/advanced/custom-middleware', 'Custom middleware'],
            ['/rest/advanced/custom-renderers', 'Custom renderers'],
            ['/rest/advanced/custom-server', 'Custom server'],
            ['/rest/advanced/multiple-servers', 'Multiple servers']
          ]
        }
      ],
      '/sql/': [
        {
          title: 'Essentials',
          collapsable: false,
          children: [
            ['/sql/', 'Introduction'],
            ['/sql/schema', 'Schema'],
            ['/sql/query', 'Query'],
            ['/sql/repository', 'Repository']
          ]
        },
        {
          title: 'Advanced',
          collapsable: true,
          children: [
            ['/sql/advanced/custom-converters', 'Custom converters'],
            ['/sql/advanced/serializable', 'Serializable'],
            ['/sql/advanced/annotations', 'Annotations']
          ]
        }
      ],
      '/eda/': [
        {
          title: 'Essentials',
          collapsable: false,
          children: [
            ['/eda/', 'Introduction'],
            ['/eda/events', 'Events'],
            ['/eda/channels', 'Channels']
          ]
        },
        {
          title: 'Advanced',
          collapsable: true,
          children: [
            ['/eda/advanced/custom-channels', 'Custom channels']
          ]
        }
      ],
      '/': [
        {
          title: 'Guide',
          collapsable: false,
          children: [
            ['/', 'Introduction'],
            ['/getting-started', 'Getting Started'],
            ['/components-overview', 'Components Overview'],
            ['/deployment', 'Deployment']
          ]
        },
        {
          title: 'Advanced',
          collapsable: true,
          children: [
            ['/onyx', 'Onyx component'],
            ['/http', 'HTTP component']
          ]
        }
      ]
    }
  }
}
