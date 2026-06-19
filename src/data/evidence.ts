import { EvidencePackage } from '@/types'

export const mockEvidence: EvidencePackage[] = [
  {
    id: 'e1',
    title: '新能源车企出海报道侵权证据包',
    articleId: 'a1',
    articleTitle: '深度调查：新能源车企出海的机遇与挑战',
    repostIds: ['r1', 'r2'],
    repostCount: 2,
    problemTypes: ['unsigned', 'exaggerated'],
    createdAt: '2025-06-20T09:00:00',
    description: '包含未署名转载和标题夸张的两篇转载文章证据'
  },
  {
    id: 'e2',
    title: 'AI医疗报道断章取义证据',
    articleId: 'a2',
    articleTitle: '专访：AI大模型落地医疗行业的三大难题',
    repostIds: ['r6'],
    repostCount: 1,
    problemTypes: ['exaggerated'],
    createdAt: '2025-06-19T15:00:00',
    description: '某科技媒体断章取义，夸大AI医疗效果'
  },
  {
    id: 'e3',
    title: '楼市报道被改写证据包',
    articleId: 'a3',
    articleTitle: '楼市新政出台：一线城市购房门槛再降低',
    repostIds: ['r10'],
    repostCount: 1,
    problemTypes: ['rewritten', 'unsigned'],
    createdAt: '2025-06-16T10:00:00',
    description: '房产自媒体严重改写原文并散布不实信息'
  }
]
