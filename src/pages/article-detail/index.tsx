import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { mockArticles } from '@/data/articles'
import { mockReposts } from '@/data/reposts'
import { Article, Repost, FollowCycleLabel, TrackingStatusLabel } from '@/types'
import StatusTag from '@/components/StatusTag'
import RepostCard from '@/components/RepostCard'
import { formatDate } from '@/utils'
import styles from './index.module.scss'

const ArticleDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id

  const article = useMemo<Article | undefined>(() => {
    return mockArticles.find(a => a.id === id)
  }, [id])

  const articleReposts = useMemo<Repost[]>(() => {
    return mockReposts
      .filter(r => r.articleId === id)
      .sort((a, b) => new Date(b.foundTime).getTime() - new Date(a.foundTime).getTime())
  }, [id])

  const [reposts] = useState<Repost[]>(articleReposts)

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

  const handleViewAllReposts = () => {
    Taro.switchTab({ url: '/pages/tracking/index' })
  }

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  const handleToggleTracking = () => {
    Taro.showToast({ title: '操作成功', icon: 'success' })
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
          <Text className={styles.viewAll} onClick={handleViewAllReposts}>查看全部 →</Text>
        </View>
        {reposts.slice(0, 3).map(repost => (
          <RepostCard key={repost.id} repost={repost} />
        ))}
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSecondary} onClick={handleShare}>分享</Button>
        <Button className={styles.btnPrimary} onClick={handleToggleTracking}>
          {article.trackingStatus === 'tracking' ? '暂停追踪' : '继续追踪'}
        </Button>
      </View>
    </View>
  )
}

export default ArticleDetailPage
