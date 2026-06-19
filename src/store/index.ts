import { create } from 'zustand'
import Taro from '@tarojs/taro'
import {
  Article,
  Repost,
  EvidencePackage,
  RepostStatus,
  FollowCycle,
  TrackingStatus,
  ProgressStatus
} from '@/types'
import { mockArticles } from '@/data/articles'
import { mockReposts } from '@/data/reposts'
import { mockEvidence } from '@/data/evidence'
import { generateId } from '@/utils'

interface AppState {
  articles: Article[]
  reposts: Repost[]
  evidenceList: EvidencePackage[]
  trackingFilter: {
    articleId: string
    statusFilter: 'all' | 'unhandled' | RepostStatus
    timeRange: 'all' | 'today' | 'yesterday' | '7d'
  }

  initData: () => void
  setTrackingFilter: (filter: Partial<AppState['trackingFilter']>) => void

  addArticle: (data: {
    title: string
    url: string
    author: string
    sourceMedia: string
    followCycle: FollowCycle
  }) => Article

  updateRepostStatus: (repostId: string, status: RepostStatus) => void
  updateRepostProgress: (repostId: string, progress: ProgressStatus) => void
  updateRepostHandlingNotes: (repostId: string, notes: string) => void

  addRepostToEvidence: (repostId: string) => { evidenceId: string; isNew: boolean }

  getArticleById: (id: string) => Article | undefined
  getRepostById: (id: string) => Repost | undefined
  getEvidenceById: (id: string) => EvidencePackage | undefined
  getRepostsByArticleId: (articleId: string) => Repost[]
  getRepostsByIds: (ids: string[]) => Repost[]

  _persist: () => void
  _hydrate: () => void
  _migrate: (data: any) => any
  _migrateRepost: (r: any) => Repost
  _migrateEvidence: (e: any) => EvidencePackage
  _recalcAllEvidence: (reposts: Repost[], evidenceList: EvidencePackage[]) => EvidencePackage[]
}

const STORAGE_KEY = 'gaozong_app_state_v1'
const FILTER_KEY = 'gaozong_tracking_filter_v1'

const DEFAULT_FILTER: AppState['trackingFilter'] = {
  articleId: 'all',
  statusFilter: 'all',
  timeRange: 'all'
}

export const useAppStore = create<AppState>((set, get) => ({
  articles: [],
  reposts: [],
  evidenceList: [],
  trackingFilter: DEFAULT_FILTER,

  initData: () => {
    const { _hydrate } = get()
    _hydrate()

    try {
      const storedFilter = Taro.getStorageSync(FILTER_KEY)
      if (storedFilter) {
        const parsed = JSON.parse(storedFilter)
        set({ trackingFilter: { ...DEFAULT_FILTER, ...parsed } })
      }
    } catch (e) {
      console.error('[Store] filter hydrate failed', e)
    }
  },

  setTrackingFilter: (filter) => {
    set((state) => ({
      trackingFilter: { ...state.trackingFilter, ...filter }
    }))
    try {
      Taro.setStorageSync(FILTER_KEY, JSON.stringify(get().trackingFilter))
    } catch (e) {
      console.error('[Store] filter persist failed', e)
    }
  },

  addArticle: (data) => {
    const now = new Date().toISOString()
    const newArticle: Article = {
      id: generateId(),
      title: data.title,
      url: data.url,
      author: data.author,
      sourceMedia: data.sourceMedia,
      publishTime: now,
      followCycle: data.followCycle,
      trackingStatus: 'tracking',
      repostCount: 0,
      problemCount: 0,
      createdAt: now
    }

    set((state) => ({
      articles: [newArticle, ...state.articles]
    }))

    get()._persist()
    return newArticle
  },

  updateRepostStatus: (repostId, status) => {
    const now = new Date().toISOString()
    set((state) => {
      const oldRepost = state.reposts.find((r) => r.id === repostId)
      const oldStatus = oldRepost?.status

      const newReposts = state.reposts.map((r) =>
        r.id === repostId ? { ...r, status, progressUpdatedAt: now } : r
      )

      let newArticles = state.articles

      if (oldRepost) {
        const oldIsProblem = oldStatus !== 'normal'
        const newIsProblem = status !== 'normal'
        if (oldIsProblem !== newIsProblem) {
          const delta = newIsProblem ? 1 : -1
          newArticles = state.articles.map((a) =>
            a.id === oldRepost.articleId
              ? { ...a, problemCount: Math.max(0, a.problemCount + delta) }
              : a
          )
        }
      }

      const newEvidenceList = state.evidenceList.map((e) => {
        if (e.repostIds.includes(repostId)) {
          const evidenceReposts = newReposts.filter((r) => e.repostIds.includes(r.id))
          const problemTypesSet = new Set<RepostStatus>()
          evidenceReposts.forEach((r) => {
            if (r.status !== 'normal') {
              problemTypesSet.add(r.status)
            }
          })
          return {
            ...e,
            problemTypes: Array.from(problemTypesSet),
            lastUpdatedAt: now
          }
        }
        return e
      })

      return {
        reposts: newReposts,
        articles: newArticles,
        evidenceList: newEvidenceList
      }
    })

    get()._persist()
  },

  updateRepostProgress: (repostId, progress) => {
    const now = new Date().toISOString()
    set((state) => {
      const newReposts = state.reposts.map((r) =>
        r.id === repostId
          ? { ...r, progress, progressUpdatedAt: now }
          : r
      )

      const repost = newReposts.find((r) => r.id === repostId)
      const newEvidenceList = state.evidenceList.map((e) => {
        if (repost && e.repostIds.includes(repostId)) {
          return { ...e, lastUpdatedAt: now }
        }
        return e
      })

      return {
        reposts: newReposts,
        evidenceList: newEvidenceList
      }
    })

    get()._persist()
  },

  updateRepostHandlingNotes: (repostId, notes) => {
    const now = new Date().toISOString()
    set((state) => {
      const newReposts = state.reposts.map((r) =>
        r.id === repostId
          ? { ...r, handlingNotes: notes, progressUpdatedAt: now }
          : r
      )

      const repost = newReposts.find((r) => r.id === repostId)
      const newEvidenceList = state.evidenceList.map((e) => {
        if (repost && e.repostIds.includes(repostId)) {
          return { ...e, lastUpdatedAt: now }
        }
        return e
      })

      return {
        reposts: newReposts,
        evidenceList: newEvidenceList
      }
    })

    get()._persist()
  },

  addRepostToEvidence: (repostId) => {
    const state = get()
    const repost = state.reposts.find((r) => r.id === repostId)
    const now = new Date().toISOString()

    if (!repost) {
      return { evidenceId: '', isNew: false }
    }

    const existingEvidence = state.evidenceList.find(
      (e) => e.articleId === repost.articleId
    )

    if (existingEvidence) {
      if (existingEvidence.repostIds.includes(repostId)) {
        return { evidenceId: existingEvidence.id, isNew: false }
      }

      const newRepostIds = [...existingEvidence.repostIds, repostId]
      const evidenceReposts = state.reposts.filter((r) => newRepostIds.includes(r.id))
      const problemTypesSet = new Set<RepostStatus>()
      evidenceReposts.forEach((r) => {
        if (r.status !== 'normal') {
          problemTypesSet.add(r.status)
        }
      })

      const updatedEvidence: EvidencePackage = {
        ...existingEvidence,
        repostIds: newRepostIds,
        repostCount: existingEvidence.repostCount + 1,
        problemTypes: Array.from(problemTypesSet),
        lastUpdatedAt: now
      }

      set((s) => ({
        evidenceList: s.evidenceList.map((e) =>
          e.id === existingEvidence.id ? updatedEvidence : e
        ),
        reposts: s.reposts.map((r) =>
          r.id === repostId
            ? { ...r, progress: r.progress || 'pending' as ProgressStatus, progressUpdatedAt: now }
            : r
        )
      }))

      get()._persist()
      return { evidenceId: existingEvidence.id, isNew: false }
    }

    const newEvidence: EvidencePackage = {
      id: generateId(),
      title: `${repost.articleTitle} - 侵权证据包`,
      articleId: repost.articleId,
      articleTitle: repost.articleTitle,
      repostIds: [repostId],
      repostCount: 1,
      problemTypes: repost.status !== 'normal' ? [repost.status] : [],
      createdAt: now,
      lastUpdatedAt: now,
      description: `针对稿件「${repost.articleTitle}」的转载问题证据包`
    }

    set((s) => ({
      evidenceList: [newEvidence, ...s.evidenceList],
      reposts: s.reposts.map((r) =>
        r.id === repostId
          ? { ...r, progress: 'pending' as ProgressStatus, progressUpdatedAt: now }
          : r
      )
    }))

    get()._persist()
    return { evidenceId: newEvidence.id, isNew: true }
  },

  getArticleById: (id) => {
    return get().articles.find((a) => a.id === id)
  },

  getRepostById: (id) => {
    return get().reposts.find((r) => r.id === id)
  },

  getEvidenceById: (id) => {
    return get().evidenceList.find((e) => e.id === id)
  },

  getRepostsByArticleId: (articleId) => {
    return get()
      .reposts.filter((r) => r.articleId === articleId)
      .sort(
        (a, b) =>
          new Date(b.foundTime).getTime() - new Date(a.foundTime).getTime()
      )
  },

  getRepostsByIds: (ids) => {
    return get().reposts.filter((r) => ids.includes(r.id))
  },

  _persist: () => {
    const state = get()
    try {
      Taro.setStorageSync(
        STORAGE_KEY,
        JSON.stringify({
          articles: state.articles,
          reposts: state.reposts,
          evidenceList: state.evidenceList
        })
      )
    } catch (e) {
      console.error('[Store] persist failed', e)
    }
  },

  _migrate: (data) => {
    if (!data) return data
    const { _migrateRepost, _migrateEvidence } = get()

    return {
      articles: data.articles || [],
      reposts: (data.reposts || []).map((r: any) => _migrateRepost(r)),
      evidenceList: (data.evidenceList || []).map((e: any) => _migrateEvidence(e))
    }
  },

  _migrateRepost: (r) => {
    return {
      ...r,
      progress: r.progress || 'pending',
      handlingNotes: r.handlingNotes || '',
      progressUpdatedAt: r.progressUpdatedAt || r.foundTime
    }
  },

  _migrateEvidence: (e) => {
    return {
      ...e,
      lastUpdatedAt: e.lastUpdatedAt || e.createdAt,
      problemTypes: e.problemTypes || []
    }
  },

  _recalcAllEvidence: (reposts: Repost[], evidenceList: EvidencePackage[]): EvidencePackage[] => {
    return evidenceList.map((e) => {
      const evidenceReposts = reposts.filter((r) => e.repostIds.includes(r.id))
      const problemTypesSet = new Set<RepostStatus>()
      evidenceReposts.forEach((r) => {
        if (r.status !== 'normal') {
          problemTypesSet.add(r.status)
        }
      })
      return {
        ...e,
        problemTypes: Array.from(problemTypesSet)
      }
    })
  },

  _hydrate: () => {
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const migrated = get()._migrate(parsed)
        const reposts = migrated.reposts || []
        const evidenceWithCorrectTypes = get()._recalcAllEvidence(
          reposts,
          migrated.evidenceList || []
        )
        set({
          articles: migrated.articles || [],
          reposts,
          evidenceList: evidenceWithCorrectTypes
        })
        console.log(
          '[Store] hydrated + migrated + recalculated evidence.problemTypes from storage'
        )
        get()._persist()
        return
      }
    } catch (e) {
      console.error('[Store] hydrate failed, using default data', e)
    }

    const defaultReposts = mockReposts.map((r) => ({
      ...r,
      progress: 'pending' as ProgressStatus,
      handlingNotes: '',
      progressUpdatedAt: r.foundTime
    }))

    const defaultEvidenceWithCorrectTypes = get()._recalcAllEvidence(
      defaultReposts,
      mockEvidence
    )

    set({
      articles: [...mockArticles],
      reposts: defaultReposts,
      evidenceList: defaultEvidenceWithCorrectTypes
    })
    get()._persist()
    console.log('[Store] initialized with mock data + defaults + recalculated types')
  }
}))
