export interface DashboardStats {
  totalUsers: number;
  todayActive: number;
  totalTasks: number;
  completionRate: string;
}

export interface TrendPoint {
  date: string;
  newUsers: number;
  activeUsers: number;
}

export interface RoleDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  stats: DashboardStats;
  trend: TrendPoint[];
  roles: RoleDistribution[];
}

const roleColors: Record<string, string> = {
  管理员: '#1677ff',
  标注员: '#52c41a',
  审核员: '#faad14',
  访客: '#722ed1',
};

function getRecent7Days(): string[] {
  const days: string[] = [];
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(weekDays[d.getDay()]);
  }
  return days;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildMockDashboardData(totalUsers: number): DashboardData {
  const safeTotal = Math.max(totalUsers, 1);
  const rand = seededRand(safeTotal + new Date().getDate() * 17);

  const todayActive = Math.floor(safeTotal * (0.25 + rand() * 0.25));
  const totalTasks = Math.floor(safeTotal * (8 + rand() * 8));
  const completionRate = Math.floor(60 + rand() * 35);

  const days = getRecent7Days();
  const trend: TrendPoint[] = days.map((d) => ({
    date: d,
    newUsers: Math.floor(5 + rand() * 25),
    activeUsers: Math.floor(20 + rand() * 50),
  }));

  const baseFactor = safeTotal / 4;
  const adminCount = Math.max(1, Math.round(baseFactor * (0.3 + rand() * 0.2)));
  const annotatorCount = Math.floor(baseFactor * (1.0 + rand() * 0.5));
  const reviewerCount = Math.floor(baseFactor * (0.7 + rand() * 0.4));
  const guestCount = Math.floor(baseFactor * (0.6 + rand() * 0.5));

  const roles: RoleDistribution[] = [
    { name: '管理员', value: adminCount, color: roleColors['管理员'] },
    { name: '标注员', value: annotatorCount, color: roleColors['标注员'] },
    { name: '审核员', value: reviewerCount, color: roleColors['审核员'] },
    { name: '访客', value: guestCount, color: roleColors['访客'] },
  ];

  return {
    stats: {
      totalUsers: safeTotal,
      todayActive,
      totalTasks,
      completionRate: `${completionRate}%`,
    },
    trend,
    roles,
  };
}

export default buildMockDashboardData;
