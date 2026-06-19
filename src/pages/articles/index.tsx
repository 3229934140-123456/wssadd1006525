import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { mockArticles } from '@/data/articles'
import { Article, TrackingStatus } from '@/types'
import ArticleCard from '@/components/ArticleCard'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

type FilterType = 'all' | TrackingStatus

const ArticlesPage: React.FC = () => {
  const [articles] = useState<Article[]>(mockArticles)
  const [filter, setFilter] = useState<FilterType>('all')
  const [refreshing, setRefreshing] = useState(false)

  const filteredArticles = useMemo(() => {
    if (filter === 'all') return articles
    return articles.filter(a => a.trackingStatus === filter)
  }, [articles, filter])

  const stats = useMemo(() => {
    const tracking = articles.filter(a => a.trackingStatus === 'tracking').length
    const problems = articles.reduce((sum, a) => sum + a.problemCount, 0)
    return { tracking, problems, total: articles.length }
  }, [articles])

  const handleAdd = () => {
    Taro.navigateTo({
      url: '/pages/add-article/index'
    })
  }

  const onPullDownRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      Taro.stopPullDownRefresh()
    }, 1000)
  }

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'tracking', label: '追踪中' },
    { key: 'expired', label: '已过期' }
  ]

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <Text className={styles.title}>我的稿件</Text>
          <Button className={styles.addBtn} onClick={handleAdd}>+ 添加稿件</Button>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>稿件总数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.tracking}</Text>
            <Text className={styles.statLabel}>追踪中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.problems}</Text>
            <Text className={styles.statLabel}>待处理问题</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterTabs}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            className={classnames(styles.filterTab, filter === tab.key && styles.active)}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </View>

      <ScrollView
        scrollY
        className={styles.list}
        onScrollToLower={() => {}}
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onPullDownRefresh}
      >
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <EmptyState title="暂无稿件" description="点击右上角添加你的第一篇稿件" />
        )}
      </ScrollView>
    </View>
  )
}

export default ArticlesPage
