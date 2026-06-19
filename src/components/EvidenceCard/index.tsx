import React, { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { EvidencePackage, RepostStatusLabel, ProgressStatus } from '@/types'
import { useAppStore } from '@/store'
import StatusTag from '@/components/StatusTag'
import { formatTime, calcOverallProgress } from '@/utils'
import styles from './index.module.scss'

interface EvidenceCardProps {
  evidence: EvidencePackage
  onClick?: () => void
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, onClick }) => {
  const storeReposts = useAppStore((state) => state.reposts)

  const reposts = useMemo(
    () => storeReposts.filter((r) => evidence.repostIds.includes(r.id)),
    [storeReposts, evidence.repostIds]
  )

  const overall = useMemo(
    () => calcOverallProgress(reposts.map((r) => r.progress || 'pending' as ProgressStatus)),
    [reposts]
  )

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({
        url: `/pages/evidence-detail/index?id=${evidence.id}`
      })
    }
  }

  const problemTags = evidence.problemTypes.map((type) => RepostStatusLabel[type]).join(' · ')

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.title}>{evidence.title}</Text>
        <StatusTag type="progress" value={overall.overall} />
      </View>

      <Text className={styles.articleTitle}>原文：{evidence.articleTitle}</Text>

      <View className={styles.progressLine}>
        <View className={styles.progressBar}>
          <View
            className={styles.progressBarFill}
            style={{
              width: `${overall.totalCount ? (overall.resolvedCount / overall.totalCount) * 100 : 0}%`
            }}
          />
        </View>
        <Text className={styles.progressText}>
          {overall.resolvedCount}/{overall.totalCount} 已处理
          {overall.totalCount ? ` · ${Math.round((overall.resolvedCount / overall.totalCount) * 100)}%` : ''}
        </Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{evidence.repostCount}</Text>
          <Text className={styles.statLabel}>条转载</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.problemTags}>{problemTags || '无问题标记'}</Text>
        </View>
      </View>

      <View className={styles.cardFooter}>
        <Text className={styles.createTime}>{formatTime(evidence.createdAt)}创建</Text>
        <Text className={styles.updateTime}>最近更新 {formatTime(evidence.lastUpdatedAt)}</Text>
      </View>
      <Text className={styles.arrow}>查看详情 →</Text>
    </View>
  )
}

export default EvidenceCard
