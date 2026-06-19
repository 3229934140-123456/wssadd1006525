import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useAppStore } from '@/store'
import { RepostStatusLabel, RepostStatus } from '@/types'
import StatusTag from '@/components/StatusTag'
import { formatDate, formatSimilarity } from '@/utils'
import styles from './index.module.scss'

const EvidenceDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id

  const getEvidenceById = useAppStore((state) => state.getEvidenceById)
  const getArticleById = useAppStore((state) => state.getArticleById)
  const getRepostsByIds = useAppStore((state) => state.getRepostsByIds)

  const evidence = useMemo(() => getEvidenceById(id || ''), [id, getEvidenceById])
  const article = useMemo(
    () => (evidence ? getArticleById(evidence.articleId) : undefined),
    [evidence, getArticleById]
  )
  const reposts = useMemo(
    () => (evidence ? getRepostsByIds(evidence.repostIds) : []),
    [evidence, getRepostsByIds]
  )

  const [showExport, setShowExport] = useState(false)

  const problemLabels = evidence?.problemTypes.map(t => RepostStatusLabel[t]) || []

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

  const handleCopyLink = (url: string) => {
    Taro.setClipboardData({
      data: url,
      success: () => {
        Taro.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  }

  const buildExportContent = () => {
    if (!evidence) return ''

    const lines: string[] = []
    lines.push(`证据包名称：${evidence.title}`)
    lines.push(`创建时间：${formatDate(evidence.createdAt)}`)
    lines.push(`证据包编号：${evidence.id}`)
    lines.push('')
    lines.push('===== 原文信息 =====')
    lines.push(`原文标题：${evidence.articleTitle}`)
    if (article) {
      lines.push(`原文作者：${article.author}`)
      lines.push(`来源媒体：${article.sourceMedia}`)
      lines.push(`原文链接：${article.url}`)
      lines.push(`发布时间：${formatDate(article.publishTime)}`)
    }
    lines.push('')
    lines.push(`问题类型：${problemLabels.join('、') || '无'}`)
    lines.push(`问题说明：${evidence.description || '无'}`)
    lines.push('')
    lines.push(`===== 涉及转载（共 ${reposts.length} 条）=====`)

    reposts.forEach((repost, idx) => {
      lines.push('')
      lines.push(`--- 转载 ${idx + 1} ---`)
      lines.push(`转载标题：${repost.title}`)
      lines.push(`来源站点：${repost.sourceSite}`)
      lines.push(`转载链接：${repost.url}`)
      lines.push(`发现时间：${formatDate(repost.foundTime)}`)
      lines.push(`正文相似度：${formatSimilarity(repost.similarity)}`)
      lines.push(`问题类型：${RepostStatusLabel[repost.status]}`)
      lines.push(`保留作者：${repost.hasAuthor ? '是' : '否'}`)
      lines.push(`保留来源：${repost.hasSourceMedia ? '是' : '否'}`)
    })

    return lines.join('\n')
  }

  const handleExport = () => {
    if (!evidence) return
    setShowExport(true)
  }

  const handleCopyExport = () => {
    const content = buildExportContent()
    Taro.setClipboardData({
      data: content,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
        setShowExport(false)
      }
    })
  }

  const handleShare = () => {
    const content = buildExportContent()
    Taro.setClipboardData({
      data: content,
      success: () => {
        Taro.showToast({ title: '内容已复制，可粘贴分享', icon: 'success' })
      }
    })
  }

  const handleAddRepost = () => {
    Taro.showToast({
      title: '请从转载详情页添加',
      icon: 'none'
    })
  }

  if (!evidence) {
    return (
      <View className={styles.page}>
        <Text>证据包不存在</Text>
      </View>
    )
  }

  const exportContent = buildExportContent()

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
          <Text className={styles.statNumPrimary}>{evidence.problemTypes.length}</Text>
          <Text className={styles.statLabel}>问题类型</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>原文材料</Text>
        <View className={styles.screenshotPlaceholder}>
          <Text className={styles.screenshotIcon}>🖼️</Text>
          <Text className={styles.screenshotText}>原文页面截图</Text>
          <Text className={styles.screenshotLabel}>系统自动抓取</Text>
        </View>
        <View className={styles.articleInfo}>
          <Text className={styles.articleText}>{evidence.articleTitle}</Text>
          <Text className={styles.articleLink} onClick={handleViewArticle}>查看 →</Text>
        </View>
        {article && (
          <View style={{ marginTop: '16rpx' }}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>原文作者</Text>
              <Text className={styles.infoValue}>{article.author}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>来源媒体</Text>
              <Text className={styles.infoValue}>{article.sourceMedia}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>原文链接</Text>
              <Text
                className={styles.linkValue}
                onClick={() => handleCopyLink(article.url)}
              >
                {article.url}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>发布时间</Text>
              <Text className={styles.infoValue}>{formatDate(article.publishTime)}</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>问题说明</Text>
        {problemLabels.length > 0 && (
          <View className={styles.problemTags}>
            {evidence.problemTypes.map((type) => (
              <Text
                key={type}
                className={classnames(
                  styles.problemTag,
                  (type === 'exaggerated' || type === 'rewritten') && styles.problemTagWarn
                )}
              >
                {RepostStatusLabel[type as RepostStatus]}
              </Text>
            ))}
          </View>
        )}
        <Text className={styles.description}>
          {evidence.description || '暂无详细说明。建议补充具体侵权行为描述，便于沟通和维权。'}
        </Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>涉及转载材料 ({evidence.repostCount})</Text>
        <View className={styles.repostsList}>
          {reposts.map((repost, idx) => (
            <View
              key={repost.id}
              className={styles.repostItem}
            >
              <View className={styles.repostHeader}>
                <Text className={styles.repostTitle} onClick={() => handleViewRepost(repost.id)}>
                  {idx + 1}. {repost.title}
                </Text>
                <StatusTag type="repost" value={repost.status} />
              </View>
              <View className={styles.screenshotPlaceholder} style={{ aspectRatio: '16 / 9', marginTop: '16rpx' }}>
                <Text className={styles.screenshotIcon}>📸</Text>
                <Text className={styles.screenshotText}>转载页面截图</Text>
              </View>
              <View className={styles.repostInfoBlock}>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>来源站点</Text>
                  <Text className={styles.repostInfoValue}>{repost.sourceSite}</Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>转载链接</Text>
                  <Text
                    className={styles.repostInfoLink}
                    onClick={() => handleCopyLink(repost.url)}
                  >
                    {repost.url}
                  </Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>发现时间</Text>
                  <Text className={styles.repostInfoValue}>{formatDate(repost.foundTime)}</Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>正文相似度</Text>
                  <Text className={styles.repostInfoValue}>{formatSimilarity(repost.similarity)}</Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>保留作者</Text>
                  <Text className={classnames(
                    styles.repostInfoValue,
                    !repost.hasAuthor && { color: '#f53f3f' }
                  )}>
                    {repost.hasAuthor ? '是' : '否'}
                  </Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>保留来源</Text>
                  <Text className={classnames(
                    styles.repostInfoValue,
                    !repost.hasSourceMedia && { color: '#f53f3f' }
                  )}>
                    {repost.hasSourceMedia ? '是' : '否'}
                  </Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>问题类型</Text>
                  <Text className={styles.repostInfoValue}>
                    {RepostStatusLabel[repost.status]}
                  </Text>
                </View>
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
          <Text className={styles.infoValue}>{problemLabels.join('、') || '无'}</Text>
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

      {showExport && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32rpx'
          }}
          onClick={() => setShowExport(false)}
        >
          <View
            className={styles.exportModal}
            onClick={(e) => e.stopPropagation && (e as any).stopPropagation()}
            style={{ width: '100%', maxWidth: '686rpx' }}
          >
            <Text className={styles.exportTitle}>证据包导出预览</Text>
            <View className={styles.exportContent}>
              <ScrollView scrollY style={{ maxHeight: '50vh' }}>
                {exportContent.split('\n').map((line, idx) => (
                  <Text
                    key={idx}
                    className={line.startsWith('=====') || line.startsWith('---') ? styles.exportSectionTitle : styles.exportText}
                    style={{
                      lineHeight: 1.8,
                      color: line.startsWith('=====') || line.startsWith('---') ? '#165dff' : '#4e5969',
                      fontWeight: line.startsWith('=====') || line.startsWith('---') ? '600' : '400'
                    }}
                  >
                    {line || ' '}
                  </Text>
                ))}
              </ScrollView>
            </View>
            <View style={{ display: 'flex', gap: '16rpx', marginTop: '24rpx' }}>
              <Button className={styles.btnSecondary} onClick={() => setShowExport(false)}>
                关闭
              </Button>
              <Button className={styles.btnPrimary} onClick={handleCopyExport}>
                复制全部
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default EvidenceDetailPage
