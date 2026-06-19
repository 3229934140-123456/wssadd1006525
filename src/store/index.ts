import { create } from 'zustand'
import Taro from '@tarojs/taro'
import {
  Article,
  Repost,
  EvidencePackage,
  RepostStatus,
  FollowCycle,
  TrackingStatus
} from '@/types'
import { mockArticles } from '@/data/articles'
import { mockReposts } from '@/data/reposts'
import { mockEvidence } from '@/data/evidence'
import { generateId } from '@/utils'

interface AppState {
  articles: Article[]
  reposts: Repost[]
  evidenceList: EvidencePackage[]

  initData: () => void

  addArticle: (data: {
    title: string
    url: string
    author: string
    sourceMedia: string
    followCycle: FollowCycle
  }) => Article

  updateRepostStatus: (repostId: string, status: RepostStatus) => void

  addRepostToEvidence: (repostId: string) => { evidenceId: string; isNew: boolean }

  getArticleById: (id: string) => Article | undefined
  getRepostById: (id: string) => Repost | undefined
  getEvidenceById: (id: string) => EvidencePackage | undefined
  getRepostsByArticleId: (articleId: string) => Repost[]
  getRepostsByIds: (ids: string[]) => Repost[]

  _persist: () => void
  _hydrate: () => void
}

const STORAGE_KEY = 'gaozong_app_state_v1'

export const useAppStore = create<AppState>((set, get) => ({
  articles: [],
  reposts: [],
  evidenceList: [],

  initData: () => {
    const { _hydrate } = get()
    _hydrate()
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
    set((state) => {
      const newReposts = state.reposts.map((r) =>
        r.id === repostId ? { ...r, status } : r
      )

      const repost = state.reposts.find((r) => r.id === repostId)
      let newArticles = state.articles

      if (repost) {
        const oldIsProblem = repost.status !== 'normal'
        const newIsProblem = status !== 'normal'
        if (oldIsProblem !== newIsProblem) {
          const delta = newIsProblem ? 1 : -1
          newArticles = state.articles.map((a) =>
            a.id === repost.articleId
              ? { ...a, problemCount: Math.max(0, a.problemCount + delta) }
              : a
          )
        }
      }

      const newEvidenceList = state.evidenceList.map((e) => {
        const updatedRepost = newReposts.find((r) => r.id === repostId)
        if (e.repostIds.includes(repostId) && updatedRepost) {
          const problemTypesSet = new Set(e.problemTypes)
          if (status !== 'normal') {
            problemTypesSet.add(status)
          } else {
            problemTypesSet.delete(status)
          }
          return {
            ...e,
            problemTypes: Array.from(problemTypesSet)
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

  addRepostToEvidence: (repostId) => {
    const state = get()
    const repost = state.reposts.find((r) => r.id === repostId)

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

      const newProblemTypes = new Set(existingEvidence.problemTypes)
      if (repost.status !== 'normal') {
        newProblemTypes.add(repost.status)
      }

      const updatedEvidence: EvidencePackage = {
        ...existingEvidence,
        repostIds: [...existingEvidence.repostIds, repostId],
        repostCount: existingEvidence.repostCount + 1,
        problemTypes: Array.from(newProblemTypes)
      }

      set((s) => ({
        evidenceList: s.evidenceList.map((e) =>
          e.id === existingEvidence.id ? updatedEvidence : e
        )
      }))

      get()._persist()
      return { evidenceId: existingEvidence.id, isNew: false }
    }

    const now = new Date().toISOString()
    const newEvidence: EvidencePackage = {
      id: generateId(),
      title: `${repost.articleTitle} - 侵权证据包`,
      articleId: repost.articleId,
      articleTitle: repost.articleTitle,
      repostIds: [repostId],
      repostCount: 1,
      problemTypes: repost.status !== 'normal' ? [repost.status] : [],
      createdAt: now,
      description: `针对稿件「${repost.articleTitle}」的转载问题证据包`
    }

    set((s) => ({
      evidenceList: [newEvidence, ...s.evidenceList]
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

  _hydrate: () => {
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        set({
          articles: parsed.articles || [],
          reposts: parsed.reposts || [],
          evidenceList: parsed.evidenceList || []
        })
        console.log('[Store] hydrated from storage')
        return
      }
    } catch (e) {
      console.error('[Store] hydrate failed, using default data', e)
    }

    set({
      articles: [...mockArticles],
      reposts: [...mockReposts],
      evidenceList: [...mockEvidence]
    })
    get()._persist()
    console.log('[Store] initialized with mock data')
  }
}))
