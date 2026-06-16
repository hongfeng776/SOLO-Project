import { Note, Creator } from '@models/index'
import { zadd, zrevrange, zincrby } from '@utils/cache'

const CONTENT_RANK_LIMIT = 100
const CREATOR_RANK_LIMIT = 50

export const rankingService = {
  async getContentRanking(type: 'hot' | 'view' | 'like' | 'comment' | 'share', limit = 20) {
    const rankKey = `content:${type}`
    const members = await zrevrange(rankKey, 0, limit - 1)

    if (members.length === 0) {
      await this.recalculateContentRanking()
      const recalculated = await zrevrange(rankKey, 0, limit - 1)
      return recalculated.map((member, index) => ({
        id: parseInt(member, 10),
        rank: index + 1,
        score: 0
      }))
    }

    return members.map((member, index) => ({
      id: parseInt(member, 10),
      rank: index + 1,
      score: 0
    }))
  },

  async getCreatorRanking(type: 'fans' | 'income' | 'activity', limit = 20) {
    const rankKey = `creator:${type}`
    const members = await zrevrange(rankKey, 0, limit - 1)

    if (members.length === 0) {
      await this.recalculateCreatorRanking(type)
      const recalculated = await zrevrange(rankKey, 0, limit - 1)
      return recalculated.map((member, index) => ({
        id: parseInt(member, 10),
        rank: index + 1,
        score: 0
      }))
    }

    return members.map((member, index) => ({
      id: parseInt(member, 10),
      rank: index + 1,
      score: 0
    }))
  },

  async incrementContentScore(contentId: number, type: string, delta = 1) {
    const rankKey = `content:${type}`
    await zincrby(rankKey, delta, contentId.toString())
  },

  async updateContentRankingBatch(contents: Array<{ id: number; score: number }>) {
    for (const content of contents) {
      await zadd('content:hot', content.score, content.id.toString())
    }
  },

  async recalculateContentRanking() {
    const notes = await Note.findAll({
      where: { status: 2 },
      attributes: ['id', 'viewCount', 'likeCount', 'commentCount', 'shareCount'],
      limit: CONTENT_RANK_LIMIT
    })

    for (const note of notes) {
      const viewCount = note.viewCount || 0
      const likeCount = note.likeCount || 0
      const commentCount = note.commentCount || 0
      const shareCount = note.shareCount || 0

      const hotScore = viewCount * 0.4 + likeCount * 2 + commentCount * 3 + shareCount * 5

      await zadd('content:hot', hotScore, note.id.toString())
      await zadd('content:view', viewCount, note.id.toString())
      await zadd('content:like', likeCount, note.id.toString())
      await zadd('content:comment', commentCount, note.id.toString())
      await zadd('content:share', shareCount, note.id.toString())
    }

    return true
  },

  async recalculateCreatorRanking(type: 'fans' | 'income' | 'activity' = 'fans') {
    const creators = await Creator.findAll({
      attributes: ['id', 'followers', 'likes'],
      limit: CREATOR_RANK_LIMIT,
      order: [['followers', 'DESC']]
    })

    for (const creator of creators) {
      const followers = creator.followers || 0
      const likes = creator.likes || 0

      if (type === 'fans') {
        await zadd('creator:fans', followers, creator.id.toString())
      } else if (type === 'activity') {
        const activityScore = followers * 0.6 + likes * 0.4
        await zadd('creator:activity', activityScore, creator.id.toString())
      }
    }

    return true
  }
}
