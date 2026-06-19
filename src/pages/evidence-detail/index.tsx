import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView, Textarea, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useAppStore } from '@/store'
import {
  RepostStatusLabel,
  RepostStatus,
  ProgressStatus,
  ProgressStatusLabel
} from '@/types'
import StatusTag from '@/components/StatusTag'
import { formatDate, formatSimilarity, calcOverallProgress } from '@/utils'
import styles from './index.module.scss'

const PROGRESS_OPTIONS: ProgressStatus[] = [
  'pending',
  'verifying',
  'contacted',
  'resolved',
  'closed'
]

const EvidenceDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id

  const storeEvidenceList = useAppStore((state) => state.evidenceList)
  const storeArticles = useAppStore((state) => state.articles)
  const storeReposts = useAppStore((state) => state.reposts)
  const updateRepostProgress = useAppStore((state) => state.updateRepostProgress)
  const updateRepostHandlingNotes = useAppStore(
    (state) => state.updateRepostHandlingNotes
  )

  const evidence = useMemo(
    () => storeEvidenceList.find((e) => e.id === id),
    [storeEvidenceList, id]
  )
  const article = useMemo(
    () => (evidence ? storeArticles.find((a) => a.id === evidence.articleId) : undefined),
    [evidence, storeArticles]
  )
  const reposts = useMemo(
    () => (evidence ? storeReposts.filter((r) => evidence.repostIds.includes(r.id)) : []),
    [evidence, storeReposts]
  )

  const overall = useMemo(
    () =>
      calcOverallProgress(
        reposts.map((r) => r.progress || 'pending' as ProgressStatus)
      ),
    [reposts]
  )

  const [showExport, setShowExport] = useState(false)

  const problemLabels = evidence?.problemTypes.map((t) => RepostStatusLabel[t]) || []

  const dynamicProblemDescription = useMemo(() => {
    if (!evidence || evidence.problemTypes.length === 0) {
      return '当前所有转载均为正常转载，暂未发现需要维权的问题。'
    }
    const breakdown = evidence.problemTypes.map((type) => {
      const count = reposts.filter((r) => r.status === type).length
      return `${RepostStatusLabel[type]} × ${count}`
    })
    return `本证据包涉及 ${evidence.repostCount} 条转载，问题类型包括：${breakdown.join('、')}。已纳入维权追踪范围。`
  }, [evidence, reposts])

  const hasAnyProblem = problemLabels.length > 0

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

  const handleProgressChange = (repostId: string, pickerIdx: string | number) => {
    const idx = Number(pickerIdx)
    if (idx >= 0 && idx < PROGRESS_OPTIONS.length) {
      updateRepostProgress(repostId, PROGRESS_OPTIONS[idx])
      Taro.showToast({ title: '进度已更新', icon: 'success', duration: 1000 })
    }
  }

  const handleNotesChange = (repostId: string, value: string) => {
    updateRepostHandlingNotes(repostId, value)
  }

  const buildExportContent = () => {
    if (!evidence) return ''

    const lines: string[] = []
    lines.push(`证据包名称：${evidence.title}`)
    lines.push(`创建时间：${formatDate(evidence.createdAt)}`)
    lines.push(`最近更新：${formatDate(evidence.lastUpdatedAt)}`)
    lines.push(`证据包编号：${evidence.id}`)
    lines.push(`维权进度：${overall.progressText}`)
    lines.push('')
    lines.push('========================================')
    lines.push('【第一部分：原文材料】')
    lines.push('========================================')
    lines.push('[原文截图占位]')
    lines.push('  类型：原文章节完整页面截图')
    lines.push('  状态：系统自动抓取，待人工核验')
    lines.push('')
    lines.push(`原文标题：${evidence.articleTitle}`)
    if (article) {
      lines.push(`原文作者：${article.author}`)
      lines.push(`来源媒体：${article.sourceMedia}`)
      lines.push(`原文链接：${article.url}`)
      lines.push(`发布时间：${formatDate(article.publishTime)}`)
    }
    lines.push('')
    lines.push('========================================')
    lines.push('【第二部分：问题说明】')
    lines.push('========================================')
    lines.push(`问题类型：${problemLabels.join('、') || '无（当前所有转载均为正常转载）'}`)
    lines.push(`问题说明：${dynamicProblemDescription}`)
    lines.push('')
    lines.push('========================================')
    lines.push(`【第三部分：涉及转载材料（共 ${reposts.length} 条）】`)
    lines.push('========================================')

    reposts.forEach((repost, idx) => {
      lines.push('')
      lines.push(`───────────────────────────`)
      lines.push(`▌转载 ${idx + 1}：${repost.title}`)
      lines.push(`───────────────────────────`)
      lines.push('[转载页面截图占位]')
      lines.push(
        `  类型：转载${RepostStatusLabel[repost.status]}部分完整截图（首页/文章页/正文）`
      )
      lines.push('  状态：系统自动抓取，待人工核验')
      lines.push('')
      lines.push(`来源站点：${repost.sourceSite}`)
      lines.push(`转载链接：${repost.url}`)
      lines.push(`发现时间：${formatDate(repost.foundTime)}`)
      lines.push(`正文相似度：${formatSimilarity(repost.similarity)}`)
      lines.push(`问题类型：${RepostStatusLabel[repost.status]}`)
      lines.push(`保留作者：${repost.hasAuthor ? '是' : '否'}`)
      lines.push(`保留来源：${repost.hasSourceMedia ? '是' : '否'}`)
      lines.push(`维权进度：${ProgressStatusLabel[repost.progress || 'pending']}`)
      if (repost.progressUpdatedAt) {
        lines.push(`进度更新时间：${formatDate(repost.progressUpdatedAt)}`)
      }
      if (repost.handlingNotes) {
        lines.push(`处理备注：${repost.handlingNotes}`)
      }
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
          <Text>最近更新 {formatDate(evidence.lastUpdatedAt)}</Text>
        </View>
        <View className={styles.progressBarWrap}>
          <View className={styles.progressBar}>
            <View
              className={styles.progressBarFill}
              style={{
                width: `${overall.totalCount ? (overall.resolvedCount / overall.totalCount) * 100 : 0}%`
              }}
            />
          </View>
          <View className={styles.progressInfoRow}>
            <StatusTag type="progress" value={overall.overall} />
            <Text className={styles.progressRateText}>
              处理进度 {overall.resolvedCount}/{overall.totalCount}
              {overall.totalCount ? `（${Math.round((overall.resolvedCount / overall.totalCount) * 100)}%）` : ''}
            </Text>
          </View>
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
        <View className={styles.statItem}>
          <Text className={styles.statNumSuccess}>{overall.resolvedCount}</Text>
          <Text className={styles.statLabel}>已处理</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>原文材料</Text>
        <View className={styles.screenshotPlaceholder}>
          <Text className={styles.screenshotIcon}>🖼️</Text>
          <Text className={styles.screenshotText}>原文页面截图</Text>
          <Text className={styles.screenshotLabel}>系统自动抓取 · 待人工核验</Text>
        </View>
        <View className={styles.articleInfo}>
          <Text className={styles.articleText}>{evidence.articleTitle}</Text>
          <Text className={styles.articleLink} onClick={handleViewArticle}>查看 →</Text>
        </View>
        {article && (
          <View className={styles.articleMetaBlock}>
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
        {hasAnyProblem ? (
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
        ) : (
          <View className={styles.noProblemTip}>
            <Text className={styles.noProblemIcon}>✓</Text>
            <Text className={styles.noProblemText}>当前无问题转载</Text>
          </View>
        )}
        <Text className={styles.description}>
          {dynamicProblemDescription}
        </Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>涉及转载材料 ({evidence.repostCount})</Text>
        <View className={styles.repostsList}>
          {reposts.map((repost, idx) => (
            <View key={repost.id} className={styles.repostItem}>
              <View className={styles.repostHeader}>
                <Text
                  className={styles.repostTitle}
                  onClick={() => handleViewRepost(repost.id)}
                >
                  {idx + 1}. {repost.title}
                </Text>
                <StatusTag type="repost" value={repost.status} />
              </View>

              <View className={classnames(styles.screenshotPlaceholder, styles.screenshotWide)}>
                <Text className={styles.screenshotIcon}>📸</Text>
                <Text className={styles.screenshotText}>转载页面截图</Text>
                <Text className={styles.screenshotLabel}>
                  {RepostStatusLabel[repost.status]}部分完整截图
                </Text>
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
                  <Text className={styles.repostInfoValue}>
                    {formatDate(repost.foundTime)}
                  </Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>正文相似度</Text>
                  <Text className={styles.repostInfoValue}>
                    {formatSimilarity(repost.similarity)}
                  </Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>保留作者</Text>
                  <Text
                    className={classnames(
                      styles.repostInfoValue,
                      !repost.hasAuthor && styles.hasAuthorNo
                    )}
                  >
                    {repost.hasAuthor ? '是' : '否'}
                  </Text>
                </View>
                <View className={styles.repostInfoRow}>
                  <Text className={styles.repostInfoLabel}>保留来源</Text>
                  <Text
                    className={classnames(
                      styles.repostInfoValue,
                      !repost.hasSourceMedia && styles.hasAuthorNo
                    )}
                  >
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

              <View className={styles.repostProgressBlock}>
                <Text className={styles.blockTitle}>维权进度</Text>
                <Picker
                  mode="selector"
                  range={PROGRESS_OPTIONS.map((p) => ProgressStatusLabel[p])}
                  value={PROGRESS_OPTIONS.indexOf(repost.progress || 'pending')}
                  onChange={(e) => handleProgressChange(repost.id, e.detail.value)}
                >
                  <View className={styles.progressPicker}>
                    <View className={styles.progressPickerLeft}>
                      <StatusTag type="progress" value={repost.progress || 'pending'} />
                    </View>
                    <Text className={styles.progressPickerArrow}>▼ 切换</Text>
                  </View>
                </Picker>
                {repost.progressUpdatedAt && (
                  <Text className={styles.updatedAtText}>
                    更新时间：{formatDate(repost.progressUpdatedAt)}
                  </Text>
                )}

                <View className={styles.notesBlock}>
                  <Text className={styles.blockTitle}>处理备注</Text>
                  <Textarea
                    className={styles.notesTextarea}
                    placeholder="记录联系结果、对方反馈、约定下架时间等处理过程中的关键信息..."
                    value={repost.handlingNotes || ''}
                    maxlength={500}
                    onInput={(e) => handleNotesChange(repost.id, e.detail.value)}
                    onBlur={(e) => handleNotesChange(repost.id, e.detail.value)}
                    autoHeight
                    showConfirmBar
                  />
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
          <Text className={styles.infoLabel}>最近更新</Text>
          <Text className={styles.infoValue}>{formatDate(evidence.lastUpdatedAt)}</Text>
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
        <View className={styles.modalMask} onClick={() => setShowExport(false)}>
          <View
            className={styles.modalContent}
            onClick={(e) => {
              if (typeof e.stopPropagation === 'function') {
                e.stopPropagation()
              }
            }}
          >
            <Text className={styles.exportTitle}>证据包导出预览</Text>
            <View className={styles.exportContent}>
              <ScrollView scrollY style={{ maxHeight: '50vh' }}>
                {exportContent.split('\n').map((line, idx) => {
                  const isSection =
                    line.startsWith('====') ||
                    line.startsWith('────') ||
                    line.startsWith('▌')
                  const isScreenshot = line.startsWith('[')
                  return (
                    <Text
                      key={idx}
                      className={
                        isSection
                          ? styles.exportSectionTitle
                          : isScreenshot
                          ? styles.exportScreenshotText
                          : styles.exportText
                      }
                      style={{
                        lineHeight: 1.8,
                        color: isSection
                          ? '#165dff'
                          : isScreenshot
                          ? '#f77234'
                          : '#4e5969',
                        fontWeight: isSection ? '600' : isScreenshot ? '500' : '400'
                      }}
                    >
                      {line || ' '}
                    </Text>
                  )
                })}
              </ScrollView>
            </View>
            <View className={styles.modalActions}>
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
