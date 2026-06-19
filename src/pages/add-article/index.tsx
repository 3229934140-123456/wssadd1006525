import React, { useState } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { FollowCycle, FollowCycleLabel } from '@/types'
import { useAppStore } from '@/store'
import styles from './index.module.scss'

const AddArticlePage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('李明远')
  const [sourceMedia, setSourceMedia] = useState('财经时报')
  const [followCycle, setFollowCycle] = useState<FollowCycle>('3d')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const addArticle = useAppStore((state) => state.addArticle)

  const cycleOptions: FollowCycle[] = ['24h', '3d', '7d']

  const canSubmit = url.trim().length > 0 && title.trim().length > 0

  const handleFetchInfo = () => {
    if (!url.trim()) {
      Taro.showToast({ title: '请输入稿件链接', icon: 'none' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      if (!title.trim()) {
        setTitle('新媒体时代深度报道的传播路径研究')
      }
      setLoading(false)
      Taro.showToast({ title: '信息已获取', icon: 'success' })
    }, 1000)
  }

  const handleSubmit = () => {
    if (!url.trim()) {
      Taro.showToast({ title: '请输入稿件链接', icon: 'none' })
      return
    }
    if (!title.trim()) {
      Taro.showToast({ title: '请输入稿件标题', icon: 'none' })
      return
    }
    if (submitting) return

    Taro.showModal({
      title: '确认添加',
      content: `确认添加稿件「${title}」并开始${FollowCycleLabel[followCycle]}追踪？`,
      success: (res) => {
        if (res.confirm) {
          setSubmitting(true)
          Taro.showLoading({ title: '添加中...' })
          setTimeout(() => {
            addArticle({
              title: title.trim(),
              url: url.trim(),
              author: author.trim(),
              sourceMedia: sourceMedia.trim(),
              followCycle
            })
            Taro.hideLoading()
            setSubmitting(false)
            Taro.showToast({ title: '添加成功', icon: 'success' })
            setTimeout(() => {
              Taro.navigateBack()
            }, 800)
          }, 600)
        }
      }
    })
  }

  return (
    <View className={styles.page}>
      <View className={styles.form}>
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>稿件链接</Text>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>原文链接</Text>
            <Input
              className={styles.input}
              placeholder="请输入稿件原文链接"
              value={url}
              onInput={(e) => setUrl(e.detail.value)}
            />
          </View>
          <Button 
            className={classnames(styles.btnPrimary, !url.trim() && styles.disabled)}
            onClick={handleFetchInfo}
            disabled={!url.trim() || loading}
          >
            {loading ? '获取中...' : '自动获取稿件信息'}
          </Button>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>稿件信息</Text>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>稿件标题</Text>
            <Input
              className={styles.input}
              placeholder="请输入稿件标题"
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>作者</Text>
            <Input
              className={styles.input}
              placeholder="请输入作者姓名"
              value={author}
              onInput={(e) => setAuthor(e.detail.value)}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>来源媒体</Text>
            <Input
              className={styles.input}
              placeholder="请输入来源媒体名称"
              value={sourceMedia}
              onInput={(e) => setSourceMedia(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>关注周期</Text>
          <View className={styles.cycleOptions}>
            {cycleOptions.map(cycle => (
              <Button
                key={cycle}
                className={classnames(styles.cycleOption, followCycle === cycle && styles.active)}
                onClick={() => setFollowCycle(cycle)}
              >
                {FollowCycleLabel[cycle]}
              </Button>
            ))}
          </View>
          <Text className={styles.tip}>
            在关注周期内，系统会持续监控网络转载情况。周期结束后自动停止追踪。
          </Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.btnPrimary, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? '提交中...' : '添加稿件'}
        </Button>
      </View>
    </View>
  )
}

export default AddArticlePage
