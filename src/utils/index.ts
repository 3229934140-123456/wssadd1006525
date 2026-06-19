import { ProgressStatus, ProgressStatusLabel } from '@/types'

export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

export const formatSimilarity = (similarity: number): string => {
  return `${Math.round(similarity * 100)}%`
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11)
}

export const calcOverallProgress = (
  progressList: ProgressStatus[]
): { overall: ProgressStatus; resolvedCount: number; totalCount: number; progressText: string } => {
  const total = progressList.length
  if (total === 0) {
    return {
      overall: 'pending',
      resolvedCount: 0,
      totalCount: 0,
      progressText: '无处理'
    }
  }

  const counts = progressList.reduce((acc, p) => {
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {} as Record<ProgressStatus, number>)

  const resolved = (counts['resolved'] || 0) + (counts['closed'] || 0)

  let overall: ProgressStatus = 'pending'
  if (resolved === total) {
    overall = 'resolved'
  } else if (counts['contacted'] || counts['verifying']) {
    overall = counts['contacted'] ? 'contacted' : 'verifying'
  } else if (counts['pending'] === total) {
    overall = 'pending'
  } else {
    overall = 'verifying'
  }

  const rate = Math.round((resolved / total) * 100)

  return {
    overall,
    resolvedCount: resolved,
    totalCount: total,
    progressText: `${ProgressStatusLabel[overall]} · ${resolved}/${total} · ${rate}%`
  }
}

export const isInTimeRange = (
  dateStr: string,
  range: 'all' | 'today' | 'yesterday' | '7d'
): boolean => {
  if (range === 'all') return true
  const date = new Date(dateStr)
  const now = new Date()
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const t = date.getTime()

  if (range === 'today') {
    return t >= todayStart && t < todayStart + 86400000
  }
  if (range === 'yesterday') {
    return t >= todayStart - 86400000 && t < todayStart
  }
  if (range === '7d') {
    return t >= todayStart - 6 * 86400000 && t < todayStart + 86400000
  }
  return true
}

export const getRepostsInLast24h = (reposts: { foundTime: string }[]): number => {
  const now = Date.now()
  return reposts.filter(
    (r) => now - new Date(r.foundTime).getTime() <= 24 * 60 * 60 * 1000
  ).length
}
