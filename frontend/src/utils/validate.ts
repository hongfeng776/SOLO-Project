class Validator {
  isPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  isEmail(email: string): boolean {
    return /^[\w.-]+@[\w-]+(\.[\w-]+)+$/.test(email);
  }

  isIdCard(id: string): boolean {
    if (!/^\d{17}[\dXx]$/.test(id)) return false;
    const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) sum += parseInt(id[i], 10) * factors[i];
    return id[17].toUpperCase() === checkCodes[sum % 11];
  }

  isUrl(url: string): boolean {
    return /^https?:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/.test(url);
  }

  isIp(ip: string): boolean {
    return /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(ip);
  }

  isStrongPassword(pwd: string): { valid: boolean; message: string } {
    if (pwd.length < 8) return { valid: false, message: '密码长度至少 8 位' };
    if (!/[a-z]/.test(pwd)) return { valid: false, message: '必须包含小写字母' };
    if (!/[A-Z]/.test(pwd)) return { valid: false, message: '必须包含大写字母' };
    if (!/\d/.test(pwd)) return { valid: false, message: '必须包含数字' };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return { valid: false, message: '必须包含特殊字符' };
    return { valid: true, message: '' };
  }

  isChinese(name: string): boolean {
    return /^[\u4e00-\u9fa5·]+$/.test(name);
  }

  isChineseMobile(phone: string): boolean {
    return this.isPhone(phone);
  }

  isPostalCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  }

  isLicensePlate(plate: string): boolean {
    return /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/.test(plate);
  }

  range(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  length(str: string, min: number, max: number): boolean {
    return str.length >= min && str.length <= max;
  }

  isNotEmpty(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  isNumber(val: any): boolean {
    return typeof val === 'number' && !isNaN(val) && isFinite(val);
  }

  isInteger(val: any): boolean {
    return this.isNumber(val) && Number.isInteger(val);
  }

  isPositiveInteger(val: any): boolean {
    return this.isInteger(val) && val > 0;
  }

  match(str: string, regex: RegExp): boolean {
    return regex.test(str);
  }
}

export const validate = new Validator();
export default validate;
