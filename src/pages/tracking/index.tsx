import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { mockReposts } from '@/data/reposts'
import { Repost, RepostStatus, RepostStatusLabel } from '@/types'
import RepostCard from '@/components/RepostCard'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

type FilterType = 'all' | 'unhandled' | RepostStatus

const TrackingPage: React.FC = () => {
  const [reposts, setReposts] = useState<Repost[]>(
    [...mockReposts].sort((a, b) => new Date(b.foundTime).getTime() - new Date(a.foundTime).getTime())
  )
  const [filter, setFilter] = useState<FilterType>('all')
  const [refreshing, setRefreshing] = useState(false)

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayNew = reposts.filter(r => new Date(r.foundTime) >= today).length
    const problems = reposts.filter(r => r.status !== 'normal').length
    return { total: reposts.length, todayNew, problems }
  }, [reposts])

  const filteredReposts = useMemo(() => {
    if (filter === 'all') return reposts
    if (filter === 'unhandled') {
      return reposts.filter(r => r.status === 'normal')
    }
    return reposts.filter(r => r.status === filter)
  }, [reposts, filter])

  const groupedReposts = useMemo(() => {
    const groups: { [key: string]: Repost[] } = {
      today: [],
      yesterday: [],
      earlier: []
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    filteredReposts.forEach(repost => {
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
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      Taro.stopPullDownRefresh()
      Taro.showToast({ title: '已更新', icon: 'success' })
    }, 1000)
  }

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unsigned', label: '未署名' },
    { key: 'exaggerated', label: '标题夸张' },
    { key: 'rewritten', label: '内容被改写' },
    { key: 'normal', label: '正常转载' }
  ]

  const groupLabels: { [key: string]: string } = {
    today: '今天',
    yesterday: '昨天',
    earlier: '更早'
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
            <Text className={styles.statLabel}>总转载</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumDanger}>{stats.problems}</Text>
            <Text className={styles.statLabel}>问题转载</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.todayNew}</Text>
            <Text className={styles.statLabel}>今日新增</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollX className={styles.filterScroll}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            className={classnames(styles.filterTab, filter === tab.key && styles.active)}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </ScrollView>

      <ScrollView
        scrollY
        className={styles.list}
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onPullDownRefresh}
      >
        {filteredReposts.length > 0 ? (
          <>
            {Object.entries(groupedReposts).map(([key, list]) => (
              list.length > 0 && (
                <View key={key} className={styles.timeGroup}>
                  <Text className={styles.timeGroupTitle}>{groupLabels[key]}</Text>
                  {list.map(repost => (
                    <RepostCard key={repost.id} repost={repost} showArticleTitle />
                  ))}
                </View>
              )
            ))}
          </>
        ) : (
          <View className={styles.emptyWrap}>
            <EmptyState title="暂无转载记录" description="系统会持续监控你的稿件转载情况" />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default TrackingPage
