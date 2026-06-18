export enum CachePrefix {
  HOT_CONTENT = 'hot:content:',
  RANK = 'rank:',
  COUNTER = 'counter:',
  USER = 'user:',
  GENERAL = 'cache:'
}

export enum CacheKey {
  NOTE_HOT_LIST = 'note:hot:list',
  NOTE_DETAIL = 'note:detail:',
  STATS_OVERVIEW = 'stats:overview',
  STATS_TREND = 'stats:trend:',
  CREATOR_LIST = 'creator:list',
  CREATOR_QUALIFICATION_LIST = 'creator:qualification:list'
}

export enum CacheTTL {
  DEFAULT = 3600,
  SHORT = 30,
  ONE_MINUTE = 60,
  MEDIUM = 120,
  FIVE_MINUTES = 300,
  ONE_HOUR = 3600,
  HOT_DATA = 3600
}

export const RANK_TYPES = {
  CONTENT: {
    HOT: 'hot',
    VIEW: 'view',
    LIKE: 'like',
    COMMENT: 'comment',
    SHARE: 'share'
  },
  CREATOR: {
    FANS: 'fans',
    INCOME: 'income',
    ACTIVITY: 'activity'
  }
} as const
