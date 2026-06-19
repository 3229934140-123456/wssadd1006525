export default defineAppConfig({
  pages: [
    'pages/articles/index',
    'pages/tracking/index',
    'pages/evidence/index',
    'pages/article-detail/index',
    'pages/repost-detail/index',
    'pages/add-article/index',
    'pages/evidence-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '稿踪',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F6F7'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#165DFF',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/articles/index',
        text: '我的稿件'
      },
      {
        pagePath: 'pages/tracking/index',
        text: '追踪'
      },
      {
        pagePath: 'pages/evidence/index',
        text: '证据包'
      }
    ]
  }
})
