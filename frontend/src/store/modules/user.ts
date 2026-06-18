import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loginApi, getUserInfoApi, verifyLoginApi, type ClientInfo, type LoginResult } from '@/api/auth';

export interface UserInfo {
  id: number;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  companyId?: number;
  department?: string;
  position?: string;
  onlineStatus?: string;
}

const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillText('fingerprint', 2, 2);
  }
  const canvasData = canvas.toDataURL();
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;

  const combined = `${canvasData}|${screenInfo}|${timezone}|${language}|${platform}|${userAgent}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16) + Date.now().toString(16);
};

export const collectClientInfo = (): ClientInfo => {
  return {
    userAgent: navigator.userAgent,
    browser: detectBrowser(),
    os: detectOS(),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    deviceFingerprint: generateDeviceFingerprint(),
    device: navigator.platform,
    networkType: (navigator as any).connection?.effectiveType || 'unknown',
    source: 'web',
    behaviorScore: Math.floor(Math.random() * 40) + 60,
  };
};

const detectBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Unknown';
};

const detectOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
};

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('');
    const userInfo = ref<UserInfo | null>(null);
    const pendingVerification = ref<{
      verificationToken: string;
      verifyType: string;
      anomalyReason?: string;
      riskLevel?: string;
    } | null>(null);

    const setToken = (newToken: string) => {
      token.value = newToken;
    };

    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info;
    };

    const resetUser = () => {
      token.value = '';
      userInfo.value = null;
      pendingVerification.value = null;
    };

    const login = async (username: string, password: string): Promise<LoginResult> => {
      const clientInfo = collectClientInfo();
      const res = await loginApi({ username, password, clientInfo });

      if (res.requireVerify && res.verificationToken) {
        pendingVerification.value = {
          verificationToken: res.verificationToken,
          verifyType: res.verifyType || 'sms',
          anomalyReason: res.anomalyReason,
          riskLevel: res.riskLevel,
        };
        return res;
      }

      if (res.token && res.user) {
        setToken(res.token);
        setUserInfo(res.user);
      }

      return res;
    };

    const verifyLogin = async (verifyCode: string): Promise<void> => {
      if (!pendingVerification.value) {
        throw new Error('没有待验证的登录请求');
      }

      const res = await verifyLoginApi({
        verificationToken: pendingVerification.value.verificationToken,
        verifyCode,
        verifyType: pendingVerification.value.verifyType,
      });

      setToken(res.token);
      setUserInfo(res.user);
      pendingVerification.value = null;
    };

    const cancelVerification = () => {
      pendingVerification.value = null;
    };

    const fetchUserInfo = async () => {
      const res = await getUserInfoApi();
      setUserInfo(res);
      return res;
    };

    return {
      token,
      userInfo,
      pendingVerification,
      setToken,
      setUserInfo,
      resetUser,
      login,
      verifyLogin,
      cancelVerification,
      fetchUserInfo,
    };
  },
  {
    persist: {
      key: 'youcai_user',
      paths: ['token', 'userInfo'],
    },
  }
);
