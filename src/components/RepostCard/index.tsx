import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { Repost } from '@/types'
import StatusTag from '@/components/StatusTag'
import { formatTime, formatSimilarity } from '@/utils'
import styles from './index.module.scss'

interface RepostCardProps {
  repost: Repost
  showArticleTitle?: boolean
  onClick?: () => void
}

const RepostCard: React.FC<RepostCardProps> = ({ repost, showArticleTitle = false, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({
        url: `/pages/repost-detail/index?id=${repost.id}`
      })
    }
  }

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.sourceSite}>{repost.sourceSite}</Text>
        <StatusTag type="repost" value={repost.status} />
      </View>
      
      {showArticleTitle && (
        <Text className={styles.articleTitle}>原文：{repost.articleTitle}</Text>
      )}
      
      <Text className={styles.title}>{repost.title}</Text>
      
      <View className={styles.infoRow}>
        <View className={styles.infoItem}>
          <Text className={classnames(styles.infoDot, repost.hasAuthor && styles.dotGreen)} />
          <Text className={styles.infoText}>{repost.hasAuthor ? '保留作者' : '未署名'}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={classnames(styles.infoDot, repost.hasSourceMedia && styles.dotGreen)} />
          <Text className={styles.infoText}>{repost.hasSourceMedia ? '保留来源' : '无来源'}</Text>
        </View>
      </View>
      
      <View className={styles.cardFooter}>
        <View className={styles.similarityBar}>
          <View 
            className={classnames(
              styles.similarityFill,
              repost.similarity >= 0.9 ? styles.fillGreen : repost.similarity >= 0.7 ? styles.fillYellow : styles.fillRed
            )}
            style={{ width: `${repost.similarity * 100}%` }}
          />
        </View>
        <Text className={styles.similarityText}>{formatSimilarity(repost.similarity)}</Text>
      </View>
      
      <Text className={styles.foundTime}>{formatTime(repost.foundTime)}发现</Text>
    </View>
  )
}

export default RepostCard
