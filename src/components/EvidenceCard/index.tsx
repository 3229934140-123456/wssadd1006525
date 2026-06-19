import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { EvidencePackage, RepostStatusLabel } from '@/types'
import { formatTime } from '@/utils'
import styles from './index.module.scss'

interface EvidenceCardProps {
  evidence: EvidencePackage
  onClick?: () => void
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({
        url: `/pages/evidence-detail/index?id=${evidence.id}`
      })
    }
  }

  const problemTags = evidence.problemTypes.map(type => RepostStatusLabel[type]).join(' · ')

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.title}>{evidence.title}</Text>
      </View>
      
      <Text className={styles.articleTitle}>原文：{evidence.articleTitle}</Text>
      
      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{evidence.repostCount}</Text>
          <Text className={styles.statLabel}>条转载</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.problemTags}>{problemTags}</Text>
        </View>
      </View>
      
      <View className={styles.cardFooter}>
        <Text className={styles.createTime}>{formatTime(evidence.createdAt)}创建</Text>
        <Text className={styles.arrow}>查看详情 →</Text>
      </View>
    </View>
  )
}

export default EvidenceCard
