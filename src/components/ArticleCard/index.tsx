import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Article, FollowCycleLabel } from '@/types'
import StatusTag from '@/components/StatusTag'
import { formatTime } from '@/utils'
import styles from './index.module.scss'

interface ArticleCardProps {
  article: Article
  onClick?: () => void
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({
        url: `/pages/article-detail/index?id=${article.id}`
      })
    }
  }

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <StatusTag type="tracking" value={article.trackingStatus} />
        <Text className={styles.cycleTag}>{FollowCycleLabel[article.followCycle]}</Text>
      </View>
      <Text className={styles.title}>{article.title}</Text>
      <View className={styles.meta}>
        <Text className={styles.metaText}>{article.sourceMedia} · {article.author}</Text>
      </View>
      <View className={styles.stats}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{article.repostCount}</Text>
          <Text className={styles.statLabel}>转载</Text>
        </View>
        <View className={styles.divider} />
        <View className={styles.statItem}>
          <Text className={styles.statNumProblem}>{article.problemCount}</Text>
          <Text className={styles.statLabel}>问题</Text>
        </View>
        <View className={styles.timeWrap}>
          <Text className={styles.timeText}>{formatTime(article.createdAt)}添加</Text>
        </View>
      </View>
    </View>
  )
}

export default ArticleCard
