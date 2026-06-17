import crypto from 'crypto'
import { Note, NoteComplianceLog } from '@models/index'
import { Op } from 'sequelize'

const SENSITIVE_WORDS = [
  '色情', '赌博', '违法', '虚假宣传', '诈骗', '毒品', '暴力', '恐怖',
  '反动', '分裂', '邪教', '迷信', '淫秽', '嫖娼', '卖淫', '赌博网站',
  '彩票', '时时彩', '六合彩', '刷单', '套现', '传销', '直销',
  '代开发票', '证件办理', '枪支', '弹药', '管制刀具', '爆炸物'
]

const ALLOWED_DOMAINS = [
  'xiaohongshu.com',
  'www.xiaohongshu.com',
  's.xiaohongshu.com',
  'pages.xiaohongshu.com'
]

export const noteComplianceService = {
  async checkContentCompliance(data: {
    title: string
    content: string
    coverImage?: string
    videoUrl?: string
    externalLinks?: string[]
    tagIds?: number[]
    noteType?: number
  }) {
    const violations: Array<{ type: string; field: string; message: string; level: number }> = []
    const { title, content, coverImage, videoUrl, externalLinks = [], tagIds = [], noteType = 1 } = data

    const wordCount = content.length
    const tagCount = tagIds.length
    const hasExternalLinks = externalLinks.length > 0

    if (title.length < 5) {
      violations.push({ type: 'word_count', field: 'title', message: '标题不能少于5个字符', level: 2 })
    }
    if (title.length > 50) {
      violations.push({ type: 'word_count', field: 'title', message: '标题不能超过50个字符', level: 2 })
    }
    if (content.length < 20) {
      violations.push({ type: 'word_count', field: 'content', message: '内容不能少于20个字符', level: 2 })
    }
    if (content.length > 5000) {
      violations.push({ type: 'word_count', field: 'content', message: '内容不能超过5000个字符', level: 2 })
    }

    if (tagCount > 10) {
      violations.push({ type: 'tag_count', field: 'tagIds', message: '标签数量不能超过10个', level: 1 })
    }

    if (!coverImage || coverImage.trim() === '') {
      violations.push({ type: 'material', field: 'coverImage', message: '封面图片不能为空', level: 2 })
    }

    if (noteType === 2) {
      if (!videoUrl || videoUrl.trim() === '') {
        violations.push({ type: 'material', field: 'videoUrl', message: '视频笔记必须提供视频地址', level: 2 })
      } else if (!/^https?:\/\//i.test(videoUrl)) {
        violations.push({ type: 'material', field: 'videoUrl', message: '视频地址格式不正确', level: 2 })
      }
    }

    for (const link of externalLinks) {
      try {
        const url = new URL(link)
        const isAllowed = ALLOWED_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))
        if (!isAllowed) {
          violations.push({ type: 'external_link', field: 'externalLinks', message: `外部链接不被允许：${link}`, level: 3 })
        }
      } catch {
        violations.push({ type: 'external_link', field: 'externalLinks', message: `链接格式不正确：${link}`, level: 2 })
      }
    }

    const combinedText = title + ' ' + content
    for (const word of SENSITIVE_WORDS) {
      if (combinedText.includes(word)) {
        violations.push({ type: 'sensitive_word', field: 'content', message: `包含违规关键词：${word}`, level: 3 })
      }
    }

    const passed = violations.length === 0

    return {
      passed,
      violations,
      wordCount,
      tagCount,
      hasExternalLinks
    }
  },

  generateFingerprint(title: string, content: string) {
    const normalized = (title + content).toLowerCase().replace(/[\s\n\r\t\p{P}]/gu, '')
    return crypto.createHash('md5').update(normalized).digest('hex')
  },

  async checkSimilarity(
    noteId: number | null,
    authorId: number,
    fingerprint: string,
    title: string,
    content: string
  ) {
    const whereClause: any = {
      authorId,
      status: { [Op.in]: [1, 2, 5] }
    }
    if (noteId) {
      whereClause.id = { [Op.ne]: noteId }
    }

    const existingNotes = await Note.findAll({
      where: whereClause,
      attributes: ['id', 'title', 'content', 'fingerprint', 'contentFingerprint']
    })

    const similarNotes: Array<{ id: number; title: string; similarity: number; diff: string }> = []
    let isDuplicate = false

    for (const note of existingNotes) {
      const noteFingerprint = (note as any).fingerprint || (note as any).contentFingerprint || ''
      if (noteFingerprint === fingerprint) {
        isDuplicate = true
        similarNotes.push({
          id: note.id,
          title: note.title,
          similarity: 100,
          diff: '内容完全相同'
        })
        continue
      }

      const similarity = this.calculateSimilarity(title + content, note.title + note.content)
      if (similarity > 80) {
        similarNotes.push({
          id: note.id,
          title: note.title,
          similarity: Math.round(similarity * 100) / 100,
          diff: this.generateDiffSummary(title + content, note.title + note.content)
        })
      }
    }

    if (similarNotes.length > 0) {
      isDuplicate = true
    }

    return { isDuplicate, similarNotes }
  },

  calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0
    const longer = str1.length >= str2.length ? str1 : str2
    const shorter = str1.length >= str2.length ? str2 : str1
    if (longer.length === 0) return 1.0

    const costs: number[] = []
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[longer.length] = lastValue
    }

    return (longer.length - costs[longer.length]) / longer.length * 100
  },

  generateDiffSummary(str1: string, str2: string): string {
    if (str1.length > str2.length) {
      return `新增内容约${str1.length - str2.length}字`
    } else if (str1.length < str2.length) {
      return `减少内容约${str2.length - str1.length}字`
    }
    return '内容长度相近但表述不同'
  },

  async checkScheduleConflict(authorId: number, scheduleTime: Date, windowMinutes: number = 30) {
    const windowMs = windowMinutes * 60 * 1000
    const startTime = new Date(scheduleTime.getTime() - windowMs)
    const endTime = new Date(scheduleTime.getTime() + windowMs)

    const conflictingNotes = await Note.findAll({
      where: {
        authorId,
        status: 5,
        scheduleTime: { [Op.between]: [startTime, endTime] }
      },
      attributes: ['id', 'title', 'scheduleTime']
    })

    return {
      hasConflict: conflictingNotes.length > 0,
      conflictingNotes: conflictingNotes.map((n: any) => ({
        id: n.id,
        title: n.title,
        scheduleTime: n.scheduleTime
      }))
    }
  },

  async logComplianceCheck(data: {
    noteId?: number
    authorId: number
    authorName: string
    checkType: string
    passed: boolean
    violations?: any[]
    fingerprint?: string
    wordCount?: number
    tagCount?: number
    hasExternalLinks?: boolean
    checkDetail?: string
  }) {
    const log = await NoteComplianceLog.create({
      noteId: data.noteId || 0,
      authorId: data.authorId,
      authorName: data.authorName,
      checkType: data.checkType,
      passed: data.passed ? 1 : 0,
      violations: data.violations ? JSON.stringify(data.violations) : '',
      fingerprint: data.fingerprint || '',
      wordCount: data.wordCount || 0,
      tagCount: data.tagCount || 0,
      hasExternalLinks: data.hasExternalLinks ? 1 : 0,
      checkDetail: data.checkDetail || ''
    } as any)
    return { id: log.id }
  }
}
