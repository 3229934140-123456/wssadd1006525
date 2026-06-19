import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import {
  RepostStatus,
  TrackingStatus,
  ProgressStatus,
  RepostStatusLabel,
  TrackingStatusLabel,
  ProgressStatusLabel
} from '@/types'
import styles from './index.module.scss'

type StatusType = 'repost' | 'tracking' | 'similarity' | 'progress'

interface StatusTagProps {
  type: StatusType
  value: RepostStatus | TrackingStatus | number | ProgressStatus
}

const StatusTag: React.FC<StatusTagProps> = ({ type, value }) => {
  const getClass = () => {
    if (type === 'repost') {
      const status = value as RepostStatus
      switch (status) {
        case 'normal':
          return styles.tagSuccess
        case 'unsigned':
          return styles.tagWarning
        case 'exaggerated':
          return styles.tagDanger
        case 'rewritten':
          return styles.tagDanger
        default:
          return styles.tagDefault
      }
    }
    if (type === 'tracking') {
      const status = value as TrackingStatus
      switch (status) {
        case 'tracking':
          return styles.tagPrimary
        case 'expired':
          return styles.tagDefault
        case 'paused':
          return styles.tagWarning
        default:
          return styles.tagDefault
      }
    }
    if (type === 'similarity') {
      const sim = value as number
      if (sim >= 0.9) return styles.tagSuccess
      if (sim >= 0.7) return styles.tagWarning
      return styles.tagDanger
    }
    if (type === 'progress') {
      const status = value as ProgressStatus
      switch (status) {
        case 'pending':
          return styles.tagDefault
        case 'verifying':
          return styles.tagWarning
        case 'contacted':
          return styles.tagPrimary
        case 'resolved':
          return styles.tagSuccess
        case 'closed':
          return styles.tagDefault
        default:
          return styles.tagDefault
      }
    }
    return styles.tagDefault
  }

  const getText = () => {
    if (type === 'repost') {
      return RepostStatusLabel[value as RepostStatus]
    }
    if (type === 'tracking') {
      return TrackingStatusLabel[value as TrackingStatus]
    }
    if (type === 'similarity') {
      return `相似度 ${Math.round((value as number) * 100)}%`
    }
    if (type === 'progress') {
      return ProgressStatusLabel[value as ProgressStatus]
    }
    return ''
  }

  return (
    <View className={classnames(styles.tag, getClass())}>
      <Text className={styles.tagText}>{getText()}</Text>
    </View>
  )
}

export default StatusTag
