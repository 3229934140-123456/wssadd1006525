import React, { useMemo } from 'react'
import { View, Text, Button, ScrollView, Picker } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { Repost, RepostStatus, RepostStatusLabel } from '@/types'
import { useAppStore } from '@/store'
import RepostCard from '@/components/RepostCard'
import EmptyState from '@/components/EmptyState'
import { isInTimeRange } from '@/utils'
import styles from './index.module.scss'

type FilterType = 'all' | 'unhandled' | RepostStatus

const STATUS_TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unsigned', label: '未署名' },
  { key: 'exaggerated', label: '标题夸张' },
  { key: 'rewritten', label: '内容被改写' },
  { key: 'normal', label: '正常转载' }
]

const TIME_RANGE_OPTIONS: { key: 'all' | 'today' | 'yesterday' | '7d'; label: string }[] = [
  { key: 'all', label: '全部时间' },
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: '7d', label: '近7天' }
]

const GROUP_LABELS: { [key: string]: string } = {
  today: '今天',
  yesterday: '昨天',
  earlier: '更早'
}

const TrackingPage: React.FC = () => {
  const router = useRouter()
  const storeReposts = useAppStore((state) => state.reposts)
  const articles = useAppStore((state) => state.articles)
  const trackingFilter = useAppStore((state) => state.trackingFilter)
  const setTrackingFilter = useAppStore((state) => state.setTrackingFilter)

  useDidShow(() => {
    console.log('[TrackingPage] didShow, reposts count:', storeReposts.length)
    console.log('[TrackingPage] filter state:', trackingFilter)

    const preselectStatus = router.params.status as RepostStatus | undefined
    const preselectArticle = router.params.articleId as string | undefined
    if (preselectStatus || preselectArticle) {
      const patch: Partial<typeof trackingFilter> = {}
      if (preselectStatus) patch.statusFilter = preselectStatus
      if (preselectArticle) patch.articleId = preselectArticle
      setTrackingFilter(patch)
    }
  })

  const sortedReposts = useMemo(() => {
    return [...storeReposts].sort(
      (a, b) => new Date(b.foundTime).getTime() - new Date(a.foundTime).getTime()
    )
  }, [storeReposts])

  const { statusFilter, articleId, timeRange } = trackingFilter

  const filteredReposts = useMemo(() => {
    let list = sortedReposts

    if (articleId !== 'all') {
      list = list.filter((r) => r.articleId === articleId)
    }

    if (timeRange !== 'all') {
      list = list.filter((r) => isInTimeRange(r.foundTime, timeRange))
    }

    if (statusFilter === 'unhandled') {
      list = list.filter((r) => r.status === 'normal')
    } else if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter)
    }

    return list
  }, [sortedReposts, statusFilter, articleId, timeRange])

  const stats = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const total = filteredReposts.length
    const todayNew = filteredReposts.filter((r) => new Date(r.foundTime).getTime() >= todayStart.getTime()).length
    const problems = filteredReposts.filter((r) => r.status !== 'normal').length
    const unsignedCount = filteredReposts.filter((r) => r.status === 'unsigned').length
    const exaggeratedCount = filteredReposts.filter((r) => r.status === 'exaggerated').length
    const rewrittenCount = filteredReposts.filter((r) => r.status === 'rewritten').length

    return { total, todayNew, problems, unsignedCount, exaggeratedCount, rewrittenCount }
  }, [filteredReposts])

  const groupedReposts = useMemo(() => {
    const groups: { [key: string]: Repost[] } = {
      today: [],
      yesterday: [],
      earlier: []
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    filteredReposts.forEach((repost) => {
      const repostDate = new Date(repost.foundTime)
      if (repostDate >= today) {
        groups.today.push(repost)
      } else if (repostDate >= yesterday) {
        groups.yesterday.push(repost)
      } else {
        groups.earlier.push(repost)
      }
    })

    return groups
  }, [filteredReposts])

  const onPullDownRefresh = () => {
    Taro.showToast({ title: '已更新', icon: 'success' })
  }

  const articlePickerRange = useMemo(() => {
    return ['全部稿件', ...articles.map((a) => a.title)]
  }, [articles])

  const timeRangePickerRange = TIME_RANGE_OPTIONS.map((o) => o.label)

  const currentArticleIdx = useMemo(() => {
    if (articleId === 'all') return 0
    const idx = articles.findIndex((a) => a.id === articleId)
    return idx >= 0 ? idx + 1 : 0
  }, [articleId, articles])

  const currentTimeIdx = useMemo(() => {
    return TIME_RANGE_OPTIONS.findIndex((o) => o.key === timeRange)
  }, [timeRange])

  const currentFilterDesc = useMemo(() => {
    const parts: string[] = []
    if (articleId !== 'all') {
      const a = articles.find((x) => x.id === articleId)
      parts.push(a ? `稿件：${a.title}` : '')
    }
    if (timeRange !== 'all') {
      const t = TIME_RANGE_OPTIONS.find((o) => o.key === timeRange)
      parts.push(t ? t.label : '')
    }
    if (statusFilter !== 'all') {
      const label =
        statusFilter === 'unhandled'
          ? '状态：正常转载'
          : RepostStatusLabel[statusFilter as RepostStatus]
      parts.push(`状态：${label}`)
    }
    return parts.length > 0 ? parts.join(' · ') : '无筛选'
  }, [articleId, timeRange, statusFilter, articles])

  const handleStatusChange = (key: FilterType) => {
    setTrackingFilter({ statusFilter: key })
  }

  const handleArticlePick = (e: { detail: { value: string | number } }) => {
    const idx = Number(e.detail.value)
    if (idx === 0) {
      setTrackingFilter({ articleId: 'all' })
    } else if (articles[idx - 1]) {
      setTrackingFilter({ articleId: articles[idx - 1].id })
    }
  }

  const handleTimePick = (e: { detail: { value: string | number } }) => {
    const idx = Number(e.detail.value)
    if (TIME_RANGE_OPTIONS[idx]) {
      setTrackingFilter({ timeRange: TIME_RANGE_OPTIONS[idx].key })
    }
  }

  const handleReset = () => {
    setTrackingFilter({
      articleId: 'all',
      statusFilter: 'all',
      timeRange: 'all'
    })
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <Text className={styles.title}>转载追踪</Text>
          {stats.todayNew > 0 && (
            <View className={styles.newBadge}>今日新增 {stats.todayNew}</View>
          )}
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>筛选结果</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumDanger}>{stats.problems}</Text>
            <Text className={styles.statLabel}>问题转载</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumWarning}>{stats.todayNew}</Text>
            <Text className={styles.statLabel}>今日新增</Text>
          </View>
        </View>

        <View className={styles.statsBreakdown}>
          {stats.unsignedCount > 0 && (
            <View className={styles.breakdownItem}>
              <Text className={styles.breakdownNumUnsigned}>{stats.unsignedCount}</Text>
              <Text className={styles.breakdownLabel}>未署名</Text>
            </View>
          )}
          {stats.exaggeratedCount > 0 && (
            <View className={styles.breakdownItem}>
              <Text className={styles.breakdownNumExag}>{stats.exaggeratedCount}</Text>
              <Text className={styles.breakdownLabel}>标题夸张</Text>
            </View>
          )}
          {stats.rewrittenCount > 0 && (
            <View className={styles.breakdownItem}>
              <Text className={styles.breakdownNumRew}>{stats.rewrittenCount}</Text>
              <Text className={styles.breakdownLabel}>内容改写</Text>
            </View>
          )}
          {stats.problems === 0 && stats.total > 0 && (
            <Text className={styles.breakdownAllGood}>当前筛选下暂无问题转载</Text>
          )}
        </View>
      </View>

      <View className={styles.filterPanel}>
        <View className={styles.pickerRow}>
          <View className={styles.pickerBlock}>
            <Text className={styles.pickerLabel}>按稿件</Text>
            <Picker
              mode="selector"
              range={articlePickerRange}
              value={currentArticleIdx}
              onChange={handleArticlePick}
            >
              <View className={styles.pickerBox}>
                <Text className={styles.pickerText}>
                  {articlePickerRange[currentArticleIdx] || '全部稿件'}
                </Text>
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.pickerBlock}>
            <Text className={styles.pickerLabel}>发现时间</Text>
            <Picker
              mode="selector"
              range={timeRangePickerRange}
              value={currentTimeIdx >= 0 ? currentTimeIdx : 0}
              onChange={handleTimePick}
            >
              <View className={styles.pickerBox}>
                <Text className={styles.pickerText}>
                  {TIME_RANGE_OPTIONS[currentTimeIdx >= 0 ? currentTimeIdx : 0]?.label}
                </Text>
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>
        </View>

        {(articleId !== 'all' || timeRange !== 'all' || statusFilter !== 'all') && (
          <View className={styles.filterSummaryRow}>
            <Text className={styles.filterSummary}>
              当前筛选：{currentFilterDesc}
            </Text>
            <Text className={styles.resetBtn} onClick={handleReset}>清除筛选</Text>
          </View>
        )}
      </View>

      <ScrollView scrollX className={styles.filterScroll}>
        {STATUS_TABS.map((tab) => {
          const countMap: Record<string, number> = {
            all: filteredReposts.length,
            unhandled: filteredReposts.filter((r) => r.status === 'normal').length,
            unsigned: stats.unsignedCount,
            exaggerated: stats.exaggeratedCount,
            rewritten: stats.rewrittenCount,
            normal: filteredReposts.filter((r) => r.status === 'normal').length
          }
          return (
            <Button
              key={tab.key}
              className={classnames(
                styles.filterTab,
                statusFilter === tab.key && styles.active
              )}
              onClick={() => handleStatusChange(tab.key)}
            >
              {tab.label}
              {countMap[tab.key] !== undefined && countMap[tab.key] > 0 && (
                <Text className={styles.tabCount}> {countMap[tab.key]}</Text>
              )}
            </Button>
          )
        })}
      </ScrollView>

      <ScrollView
        scrollY
        className={styles.list}
        refresherEnabled
        onRefresherRefresh={onPullDownRefresh}
      >
        {filteredReposts.length > 0 ? (
          <>
            {Object.entries(groupedReposts).map(([key, list]) => (
              list.length > 0 && (
                <View key={key} className={styles.timeGroup}>
                  <Text className={styles.timeGroupTitle}>
                    {GROUP_LABELS[key]}
                    <Text className={styles.timeGroupCount}> · {list.length}</Text>
                  </Text>
                  {list.map((repost) => (
                    <RepostCard key={repost.id} repost={repost} showArticleTitle />
                  ))}
                </View>
              )
            ))}
          </>
        ) : (
          <View className={styles.emptyWrap}>
            <EmptyState
              title={
                articleId === 'all' && statusFilter === 'all' && timeRange === 'all'
                  ? '暂无转载记录'
                  : '当前筛选下没有结果'
              }
              description={
                articleId === 'all' && statusFilter === 'all' && timeRange === 'all'
                  ? '系统会持续监控你的稿件转载情况'
                  : '请尝试调整筛选条件'
              }
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default TrackingPage
