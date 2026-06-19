import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { mockEvidence } from '@/data/evidence'
import { mockReposts } from '@/data/reposts'
import { EvidencePackage, Repost, RepostStatusLabel } from '@/types'
import StatusTag from '@/components/StatusTag'
import { formatDate } from '@/utils'
import styles from './index.module.scss'

const EvidenceDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id

  const evidence = useMemo<EvidencePackage | undefined>(() => {
    return mockEvidence.find(e => e.id === id)
  }, [id])

  const reposts = useMemo<Repost[]>(() => {
    if (!evidence) return []
    return mockReposts.filter(r => evidence.repostIds.includes(r.id))
  }, [evidence])

  const handleViewArticle = () => {
    if (evidence) {
      Taro.navigateTo({
        url: `/pages/article-detail/index?id=${evidence.articleId}`
      })
    }
  }

  const handleViewRepost = (repostId: string) => {
    Taro.navigateTo({
      url: `/pages/repost-detail/index?id=${repostId}`
    })
  }

  const handleExport = () => {
    Taro.showLoading({ title: '生成中...' })
    setTimeout(() => {
      Taro.hideLoading()
      Taro.showToast({ title: '证据包已生成', icon: 'success' })
    }, 1500)
  }

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  const handleAddRepost = () => {
    Taro.showToast({ title: '请从转载详情页添加', icon: 'none' })
  }

  if (!evidence) {
    return (
      <View className={styles.page}>
        <Text>证据包不存在</Text>
      </View>
    )
  }

  const problemLabels = evidence.problemTypes.map(t => RepostStatusLabel[t]).join('、')

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>{evidence.title}</Text>
        <View className={styles.metaRow}>
          <Text>{evidence.repostCount} 条转载</Text>
          <Text>·</Text>
          <Text>{formatDate(evidence.createdAt)}</Text>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{evidence.repostCount}</Text>
          <Text className={styles.statLabel}>转载数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{evidence.problemTypes.length}</Text>
          <Text className={styles.statLabel}>问题类型</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>原文信息</Text>
        <View className={styles.articleInfo}>
          <Text className={styles.articleText}>{evidence.articleTitle}</Text>
          <Text className={styles.articleLink} onClick={handleViewArticle}>查看 →</Text>
        </View>
      </View>

      {evidence.description && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>问题说明</Text>
          <Text className={styles.description}>{evidence.description}</Text>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>涉及转载 ({evidence.repostCount})</Text>
        <View className={styles.repostsList}>
          {reposts.map(repost => (
            <View 
              key={repost.id} 
              className={styles.repostItem}
              onClick={() => handleViewRepost(repost.id)}
            >
              <Text className={styles.repostTitle}>{repost.title}</Text>
              <View className={styles.repostMeta}>
                <Text className={styles.repostSite}>{repost.sourceSite}</Text>
                <StatusTag type="repost" value={repost.status} />
              </View>
            </View>
          ))}
        </View>
        <Button className={styles.addRepostBtn} onClick={handleAddRepost}>
          + 添加转载
        </Button>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>证据包信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>问题类型</Text>
          <Text className={styles.infoValue}>{problemLabels}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>创建时间</Text>
          <Text className={styles.infoValue}>{formatDate(evidence.createdAt)}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>证据包ID</Text>
          <Text className={styles.infoValue}>{evidence.id}</Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSecondary} onClick={handleShare}>分享</Button>
        <Button className={styles.btnPrimary} onClick={handleExport}>导出证据包</Button>
      </View>
    </View>
  )
}

export default EvidenceDetailPage
