import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { mockReposts } from '@/data/reposts'
import { Repost, RepostStatus, RepostStatusLabel } from '@/types'
import StatusTag from '@/components/StatusTag'
import { formatDate, formatSimilarity } from '@/utils'
import styles from './index.module.scss'

const RepostDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id

  const repost = useMemo<Repost | undefined>(() => {
    return mockReposts.find(r => r.id === id)
  }, [id])

  const [status, setStatus] = useState<RepostStatus>(repost?.status || 'normal')

  const handleCopyUrl = () => {
    if (repost) {
      Taro.setClipboardData({
        data: repost.url,
        success: () => {
          Taro.showToast({ title: '链接已复制', icon: 'success' })
        }
      })
    }
  }

  const handleViewOriginal = () => {
    Taro.navigateTo({
      url: `/pages/article-detail/index?id=${repost?.articleId}`
    })
  }

  const handleAddToEvidence = () => {
    Taro.showModal({
      title: '加入证据包',
      content: '确认将此转载加入证据包？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已加入证据包', icon: 'success' })
        }
      }
    })
  }

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  const handleMarkStatus = (newStatus: RepostStatus) => {
    setStatus(newStatus)
    Taro.showToast({ title: '已更新状态', icon: 'success' })
  }

  const getSimilarityClass = () => {
    if (!repost) return ''
    if (repost.similarity >= 0.9) return 'Green'
    if (repost.similarity >= 0.7) return 'Yellow'
    return 'Red'
  }

  if (!repost) {
    return (
      <View className={styles.page}>
        <Text>转载不存在</Text>
      </View>
    )
  }

  const statusOptions: RepostStatus[] = ['normal', 'unsigned', 'exaggerated', 'rewritten']

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.statusRow}>
          <StatusTag type="repost" value={status} />
        </View>
        <Text className={styles.sourceSite}>{repost.sourceSite}</Text>
        <Text className={styles.title}>{repost.title}</Text>
        <Text className={styles.foundTime}>发现时间：{formatDate(repost.foundTime)}</Text>
      </View>

      <View className={styles.similarityCard}>
        <Text className={styles.similarityTitle}>正文相似度</Text>
        <View className={styles.similarityBar}>
          <View
            className={classnames(styles.similarityFill, styles[`fill${getSimilarityClass()}`])}
            style={{ width: `${repost.similarity * 100}%` }}
          />
        </View>
        <Text className={classnames(styles.similarityNum, styles[`num${getSimilarityClass()}`])}>
          {formatSimilarity(repost.similarity)}
        </Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>转载信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>转载链接</Text>
          <Text className={styles.linkValue} onClick={handleCopyUrl}>{repost.url}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>来源站点</Text>
          <Text className={styles.infoValue}>{repost.sourceSite}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>保留作者</Text>
          <Text className={classnames(
            styles.infoValue,
            repost.hasAuthor ? '' : styles.numRed
          )}>
            {repost.hasAuthor ? '是' : '否'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>保留原媒体</Text>
          <Text className={classnames(
            styles.infoValue,
            repost.hasSourceMedia ? '' : styles.numRed
          )}>
            {repost.hasSourceMedia ? '是' : '否'}
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>原文信息</Text>
        <View className={styles.originalInfo}>
          <Text className={styles.originalText}>{repost.articleTitle}</Text>
          <Text className={styles.originalLink} onClick={handleViewOriginal}>查看 →</Text>
        </View>
      </View>

      <View className={styles.statusSection}>
        <Text className={styles.sectionTitle}>标记状态</Text>
        <View className={styles.statusOptions}>
          {statusOptions.map(option => (
            <Button
              key={option}
              className={classnames(styles.statusOption, status === option && styles.active)}
              onClick={() => handleMarkStatus(option)}
            >
              {RepostStatusLabel[option]}
            </Button>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.actionRow}>
          <Button className={styles.btnSecondary} onClick={handleShare}>分享</Button>
          <Button className={styles.btnPrimary} onClick={handleAddToEvidence}>加入证据包</Button>
        </View>
      </View>
    </View>
  )
}

export default RepostDetailPage
