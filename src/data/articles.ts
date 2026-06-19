import { Article } from '@/types'

export const mockArticles: Article[] = [
  {
    id: 'a1',
    title: '深度调查：新能源车企出海的机遇与挑战',
    url: 'https://example.com/article/1',
    author: '李明远',
    sourceMedia: '财经时报',
    publishTime: '2025-06-15T09:00:00',
    followCycle: '7d',
    trackingStatus: 'tracking',
    repostCount: 23,
    problemCount: 5,
    createdAt: '2025-06-15T10:00:00'
  },
  {
    id: 'a2',
    title: '专访：AI大模型落地医疗行业的三大难题',
    url: 'https://example.com/article/2',
    author: '李明远',
    sourceMedia: '财经时报',
    publishTime: '2025-06-18T14:30:00',
    followCycle: '3d',
    trackingStatus: 'tracking',
    repostCount: 12,
    problemCount: 2,
    createdAt: '2025-06-18T15:00:00'
  },
  {
    id: 'a3',
    title: '楼市新政出台：一线城市购房门槛再降低',
    url: 'https://example.com/article/3',
    author: '李明远',
    sourceMedia: '财经时报',
    publishTime: '2025-06-10T08:00:00',
    followCycle: '7d',
    trackingStatus: 'expired',
    repostCount: 45,
    problemCount: 8,
    createdAt: '2025-06-10T09:00:00'
  },
  {
    id: 'a4',
    title: '消费复苏观察：网红城市的长红密码',
    url: 'https://example.com/article/4',
    author: '李明远',
    sourceMedia: '财经时报',
    publishTime: '2025-06-19T16:00:00',
    followCycle: '24h',
    trackingStatus: 'tracking',
    repostCount: 5,
    problemCount: 1,
    createdAt: '2025-06-19T16:30:00'
  },
  {
    id: 'a5',
    title: '芯片产业链调研：国产替代加速进行时',
    url: 'https://example.com/article/5',
    author: '李明远',
    sourceMedia: '财经时报',
    publishTime: '2025-06-05T10:00:00',
    followCycle: '7d',
    trackingStatus: 'expired',
    repostCount: 31,
    problemCount: 3,
    createdAt: '2025-06-05T11:00:00'
  }
]
