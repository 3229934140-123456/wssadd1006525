import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useAppStore } from '@/store'
import { FollowCycleLabel, TrackingStatusLabel, RepostStatus, RepostStatusLabel } from '@/types'
import StatusTag from '@/components/StatusTag'
import RepostCard from '@/components/RepostCard'
import { formatDate, getRepostsInLast24h } from '@/utils'
import styles from './index.module.scss'

const ArticleDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id

  const storeArticles = useAppStore((state) => state.articles)
  const storeReposts = useAppStore((state) => state.reposts)
  const setTrackingFilter = useAppStore((state) => state.setTrackingFilter)

  const article = useMemo(
    () => storeArticles.find((a) => a.id === id),
    [storeArticles, id]
  )
  const reposts = useMemo(() => {
    if (!id) return []
    return storeReposts
      .filter((r) => r.articleId === id)
      .sort(
        (a, b) =>
          new Date(b.foundTime).getTime() - new Date(a.foundTime).getTime()
      )
  }, [storeReposts, id])

  const trend = useMemo(() => {
    const total = reposts.length
    const new24h = getRepostsInLast24h(reposts)
    const problems = reposts.filter((r) => r.status !== 'normal').length
    const problemRate = total > 0 ? Math.round((problems / total) * 100) : 0

    const problemBreakdown: Record<string, number> = {}
    reposts.forEach((r) => {
      if (r.status !== 'normal') {
        problemBreakdown[r.status] = (problemBreakdown[r.status] || 0) + 1
      }
    })

    return { total, new24h, problems, problemRate, problemBreakdown }
  }, [reposts])

  const [refreshing, setRefreshing] = useState(false)

  useDidShow(() => {
    console.log('[ArticleDetail] didShow, article id:', id)
  })

  const handleCopyUrl = () => {
    if (article) {
      Taro.setClipboardData({
        data: article.url,
        success: () => {
          Taro.showToast({ title: '链接已复制', icon: 'success' })
        }
      })
    }
  }

  const goTrackingWithFilter = (options?: { status?: RepostStatus }) => {
    if (!article) return
    setTrackingFilter({
      articleId: article.id,
      statusFilter: options?.status || 'all',
      timeRange: 'all'
    })
    Taro.switchTab({ url: '/pages/tracking/index' })
  }

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  const handleToggleTracking = () => {
    Taro.showToast({ title: '操作成功', icon: 'success' })
  }

  const onPullDownRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      Taro.stopPullDownRefresh()
    }, 800)
  }

  if (!article) {
    return (
      <View className={styles.page}>
        <Text>稿件不存在</Text>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.statusRow}>
          <StatusTag type="tracking" value={article.trackingStatus} />
        </View>
        <Text className={styles.title}>{article.title}</Text>
        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text>{article.sourceMedia}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text>{article.author}</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{article.repostCount}</Text>
          <Text className={styles.statLabel}>总转载</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumProblem}>{article.problemCount}</Text>
          <Text className={styles.statLabel}>问题转载</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{FollowCycleLabel[article.followCycle]}</Text>
          <Text className={styles.statLabel}>关注周期</Text>
        </View>
      </View>

      <ScrollView
        scrollY
        style={{ flex: 1 }}
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onPullDownRefresh}
      >
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>转载趋势</Text>
            <Text
              className={styles.viewAll}
              onClick={() => goTrackingWithFilter()}
            >
              全部转载 →
            </Text>
          </View>

          <View className={styles.trendGrid}>
            <View className={styles.trendItem}>
              <View className={styles.trendNumRow}>
                <Text className={styles.trendNumNew}>{trend.new24h}</Text>
                {trend.new24h > 0 && <View className={styles.upBadge}>NEW</View>}
              </View>
              <Text className={styles.trendLabel}>24小时内新增</Text>
            </View>

            <View className={styles.trendItem}>
              <View className={styles.trendNumRow}>
                <Text
                  className={classnames(
                    styles.trendNum,
                    trend.problemRate >= 30 && styles.trendNumProblem,
                    trend.problemRate > 0 && trend.problemRate < 30 && styles.trendNumWarning
                  )}
                >
                  {trend.problemRate}%
                </Text>
              </View>
              <Text className={styles.trendLabel}>问题转载占比</Text>
            </View>

            <View className={styles.trendItem}>
              <View className={styles.trendNumRow}>
                <ProgressMiniBar
                  rate={trend.problemRate}
                />
              </View>
              <Text className={styles.trendLabel}>
                {trend.problems > 0 ? `${trend.problems}/${trend.total}问题` : '暂无问题'}
              </Text>
            </View>
          </View>

          {trend.problems > 0 && (
            <View className={styles.problemBreakdown}>
              <Text className={styles.breakdownHint}>点问题类型跳转追踪页：</Text>
              <View className={styles.problemTagsRow}>
                {Object.entries(trend.problemBreakdown).map(([status, count]) => (
                  <View
                    key={status}
                    className={classnames(
                      styles.problemTag,
                      (status === 'exaggerated' || status === 'rewritten') && styles.problemTagWarn,
                      status === 'unsigned' && styles.problemTagCaution
                    )}
                    onClick={() => goTrackingWithFilter({ status: status as RepostStatus })}
                  >
                    <Text className={styles.problemTagLabel}>
                      {RepostStatusLabel[status as RepostStatus]}
                    </Text>
                    <Text className={styles.problemTagCount}>× {count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>稿件信息</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>原文链接</Text>
            <Text className={styles.linkValue} onClick={handleCopyUrl}>{article.url}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>发布时间</Text>
            <Text className={styles.infoValue}>{formatDate(article.publishTime)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>追踪状态</Text>
            <Text className={styles.infoValue}>{TrackingStatusLabel[article.trackingStatus]}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>添加时间</Text>
            <Text className={styles.infoValue}>{formatDate(article.createdAt)}</Text>
          </View>
        </View>

        <View className={styles.repostsSection}>
          <View className={styles.repostsHeader}>
            <Text className={styles.repostsTitle}>最新转载</Text>
            {reposts.length > 3 && (
              <Text className={styles.viewAll} onClick={() => goTrackingWithFilter()}>
                查看全部 →
              </Text>
            )}
          </View>
          {reposts.length > 0 ? (
            reposts.slice(0, 3).map((repost) => (
              <RepostCard key={repost.id} repost={repost} />
            ))
          ) : (
            <View className={styles.emptyTip}>
              <Text>暂无转载记录</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSecondary} onClick={handleShare}>分享</Button>
        <Button className={styles.btnPrimary} onClick={handleToggleTracking}>
          {article.trackingStatus === 'tracking' ? '暂停追踪' : '继续追踪'}
        </Button>
      </View>
    </View>
  )
}

const ProgressMiniBar: React.FC<{ rate: number }> = ({ rate }) => {
  return (
    <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx' }}>
      <View className={styles.miniBarOuter}>
        <View
          className={classnames(
            styles.miniBarFill,
            rate >= 30 ? styles.fillHigh : rate > 0 ? styles.fillMid : styles.fillLow
          )}
          style={{ width: `${Math.max(rate, 4)}%` }}
        />
      </View>
    </View>
  )
}

export default ArticleDetailPage
