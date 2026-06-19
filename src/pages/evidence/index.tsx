import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { mockEvidence } from '@/data/evidence'
import { EvidencePackage } from '@/types'
import EvidenceCard from '@/components/EvidenceCard'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

const EvidencePage: React.FC = () => {
  const [evidenceList] = useState<EvidencePackage[]>(
    [...mockEvidence].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  )

  const stats = useMemo(() => {
    const totalReposts = evidenceList.reduce((sum, e) => sum + e.repostCount, 0)
    return { total: evidenceList.length, totalReposts }
  }, [evidenceList])

  const handleCreate = () => {
    Taro.showToast({
      title: '请从转载详情页创建',
      icon: 'none'
    })
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <Text className={styles.title}>证据包</Text>
          <Button className={styles.createBtn} onClick={handleCreate}>+ 新建</Button>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>证据包</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.totalReposts}</Text>
            <Text className={styles.statLabel}>涉及转载</Text>
          </View>
        </View>
      </View>

      <View className={styles.tipCard}>
        <Text className={styles.tipText}>
          证据包自动整理原文截图、转载链接、发现时间和问题说明，方便向编辑部、版权部门或对方媒体沟通。
        </Text>
      </View>

      <ScrollView scrollY className={styles.list}>
        {evidenceList.length > 0 ? (
          <>
            <Text className={styles.sectionTitle}>全部证据包</Text>
            {evidenceList.map(evidence => (
              <EvidenceCard key={evidence.id} evidence={evidence} />
            ))}
          </>
        ) : (
          <View className={styles.emptyWrap}>
            <EmptyState 
              title="暂无证据包" 
              description="在转载详情中点击「加入证据包」即可创建" 
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default EvidencePage
