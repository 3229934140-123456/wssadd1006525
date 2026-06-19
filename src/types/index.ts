export type FollowCycle = '24h' | '3d' | '7d'

export type RepostStatus = 'normal' | 'unsigned' | 'exaggerated' | 'rewritten'

export type TrackingStatus = 'tracking' | 'expired' | 'paused'

export interface Article {
  id: string
  title: string
  url: string
  author: string
  sourceMedia: string
  publishTime: string
  followCycle: FollowCycle
  trackingStatus: TrackingStatus
  repostCount: number
  problemCount: number
  screenshot?: string
  createdAt: string
}

export interface Repost {
  id: string
  articleId: string
  articleTitle: string
  title: string
  url: string
  sourceSite: string
  hasAuthor: boolean
  hasSourceMedia: boolean
  similarity: number
  status: RepostStatus
  foundTime: string
  screenshot?: string
  notes?: string
}

export interface EvidencePackage {
  id: string
  title: string
  articleId: string
  articleTitle: string
  repostIds: string[]
  repostCount: number
  problemTypes: RepostStatus[]
  createdAt: string
  description?: string
}

export const FollowCycleLabel: Record<FollowCycle, string> = {
  '24h': '24小时',
  '3d': '3天',
  '7d': '一周'
}

export const RepostStatusLabel: Record<RepostStatus, string> = {
  normal: '正常转载',
  unsigned: '未署名',
  exaggerated: '标题夸张',
  rewritten: '内容被改写'
}

export const TrackingStatusLabel: Record<TrackingStatus, string> = {
  tracking: '追踪中',
  expired: '已过期',
  paused: '已暂停'
}
