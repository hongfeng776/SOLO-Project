class ValidateUtil {
  isPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  isEmail(email: string): boolean {
    return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email);
  }

  isIdCard(idCard: string): boolean {
    return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
  }

  isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isIp(ip: string): boolean {
    return /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(ip);
  }

  isStrongPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  }

  isChinese(str: string): boolean {
    return /^[\u4e00-\u9fa5]+$/.test(str);
  }

  isEmpty(val: any): boolean {
    return val === null || val === undefined || val === '';
  }

  isNumber(val: any): boolean {
    return typeof val === 'number' && !isNaN(val);
  }

  isInteger(val: any): boolean {
    return Number.isInteger(val);
  }

  isPositive(val: any): boolean {
    return this.isNumber(val) && val > 0;
  }

  isLength(str: string, min: number, max?: number): boolean {
    const len = str.length;
    return len >= min && (max === undefined || len <= max);
  }
}

export const validateUtil = new ValidateUtil();
export default validateUtil;
