import { ParseStatus, Education, Gender, CORE_PARSE_FIELDS, FALSE_RECRUITMENT_KEYWORDS } from '../constants/recruitment.enum';

export interface ParseResult {
  parseStatus: ParseStatus;
  parsedData: any;
  parsedFields: string[];
  failedFields: string[];
  abnormalFields: string[];
  errorMessage?: string;
  isBlankResume: boolean;
  isFakeResume: boolean;
  fakeCheckReason?: string;
  matchScore?: number;
  matchDetails?: any;
}

const EDUCATION_MAP: Record<string, Education> = {
  '高中': Education.HIGH_SCHOOL, '高中/中专': Education.HIGH_SCHOOL, '中专': Education.HIGH_SCHOOL, '职高': Education.HIGH_SCHOOL,
  '大专': Education.COLLEGE, '专科': Education.COLLEGE, '高职': Education.COLLEGE,
  '本科': Education.BACHELOR, '学士': Education.BACHELOR, '大学本科': Education.BACHELOR,
  '硕士': Education.MASTER, '研究生': Education.MASTER, '硕士研究生': Education.MASTER, 'MBA': Education.MASTER,
  '博士': Education.DOCTOR, '博士研究生': Education.DOCTOR, '博士后': Education.DOCTOR,
};

const GENDER_MAP: Record<string, Gender> = {
  '男': Gender.MALE, '先生': Gender.MALE,
  '女': Gender.FEMALE, '女士': Gender.FEMALE,
};

class ResumeParserService {
  private parserVersion = '1.0.0';

  getParserVersion() {
    return this.parserVersion;
  }

  async parseResume(content: string, fileName: string = '', jobRequirements?: any): Promise<ParseResult> {
    const startTime = Date.now();
    const result: ParseResult = {
      parseStatus: ParseStatus.PENDING,
      parsedData: {},
      parsedFields: [],
      failedFields: [],
      abnormalFields: [],
      isBlankResume: false,
      isFakeResume: false,
    };

    try {
      if (!content || content.trim().length < 20) {
        result.isBlankResume = true;
        result.parseStatus = ParseStatus.FAILED;
        result.errorMessage = '简历内容为空或内容过少';
        result.failedFields = [...CORE_PARSE_FIELDS];
        return result;
      }

      const fakeCheck = this.detectFakeResume(content);
      result.isFakeResume = fakeCheck.isFake;
      result.fakeCheckReason = fakeCheck.reason;

      const name = this.extractName(content, fileName);
      if (name) {
        result.parsedData.name = name;
        result.parsedFields.push('name');
      } else {
        result.failedFields.push('name');
        result.abnormalFields.push('name');
      }

      const phone = this.extractPhone(content);
      if (phone) {
        result.parsedData.phone = phone;
        result.parsedFields.push('phone');
      } else {
        result.failedFields.push('phone');
        result.abnormalFields.push('phone');
      }

      const email = this.extractEmail(content);
      if (email) {
        result.parsedData.email = email;
        result.parsedFields.push('email');
      }

      const gender = this.extractGender(content);
      if (gender) {
        result.parsedData.gender = gender;
        result.parsedFields.push('gender');
      }

      const age = this.extractAge(content);
      if (age) {
        result.parsedData.age = age;
        result.parsedFields.push('age');
      }

      const education = this.extractEducation(content);
      if (education) {
        result.parsedData.education = education;
        result.parsedFields.push('education');
      } else {
        result.failedFields.push('education');
      }

      const { school, major } = this.extractSchoolAndMajor(content);
      if (school) {
        result.parsedData.school = school;
        result.parsedFields.push('school');
      }
      if (major) {
        result.parsedData.major = major;
        result.parsedFields.push('major');
      }

      const experience = this.extractExperience(content);
      if (experience !== null && experience !== undefined) {
        result.parsedData.experience = experience;
        result.parsedFields.push('experience');
      } else {
        result.failedFields.push('experience');
      }

      const { currentCompany, currentPosition } = this.extractCurrentInfo(content);
      if (currentCompany) {
        result.parsedData.currentCompany = currentCompany;
        result.parsedFields.push('currentCompany');
      }
      if (currentPosition) {
        result.parsedData.currentPosition = currentPosition;
        result.parsedFields.push('currentPosition');
      } else {
        result.failedFields.push('currentPosition');
      }

      const expectedSalary = this.extractExpectedSalary(content);
      if (expectedSalary) {
        result.parsedData.expectedSalary = expectedSalary;
        result.parsedFields.push('expectedSalary');
      } else {
        result.failedFields.push('expectedSalary');
      }

      const city = this.extractCity(content);
      if (city) {
        result.parsedData.city = city;
        result.parsedFields.push('city');
      } else {
        result.failedFields.push('city');
      }

      const selfEvaluation = this.extractSelfEvaluation(content);
      if (selfEvaluation) {
        result.parsedData.selfEvaluation = selfEvaluation;
        result.parsedFields.push('selfEvaluation');
      }

      const coreFieldCount = CORE_PARSE_FIELDS.length;
      const successCoreCount = CORE_PARSE_FIELDS.filter((f) => result.parsedFields.includes(f)).length;
      const successRate = successCoreCount / coreFieldCount;

      if (successRate >= 0.9) {
        result.parseStatus = ParseStatus.SUCCESS;
      } else if (successRate >= 0.5) {
        result.parseStatus = ParseStatus.PARTIAL;
      } else {
        result.parseStatus = ParseStatus.FAILED;
        result.errorMessage = `核心字段解析成功率仅为${Math.round(successRate * 100)}%，低于50%阈值`;
      }

      if (result.isBlankResume) {
        result.parseStatus = ParseStatus.FAILED;
        result.errorMessage = result.errorMessage || '检测为空白简历';
      }

      if (result.isFakeResume) {
        result.parseStatus = ParseStatus.FAILED;
        result.errorMessage = result.errorMessage || result.fakeCheckReason;
      }

      if (jobRequirements) {
        const matchResult = this.calculateMatchScore(result.parsedData, jobRequirements);
        result.matchScore = matchResult.score;
        result.matchDetails = matchResult.details;
      }

      return result;
    } catch (error: any) {
      result.parseStatus = ParseStatus.FAILED;
      result.errorMessage = error.message || '解析过程发生异常';
      result.failedFields = [...CORE_PARSE_FIELDS];
      return result;
    }
  }

  detectFakeResume(content: string): { isFake: boolean; reason?: string } {
    const lowerContent = content.toLowerCase();
    const matchedKeywords: string[] = [];

    for (const keyword of FALSE_RECRUITMENT_KEYWORDS) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length >= 2) {
      return {
        isFake: true,
        reason: `检测到可疑关键词：${matchedKeywords.join('、')}`,
      };
    }

    const phoneRegex = /1[3-9]\d{9}/g;
    const phones = content.match(phoneRegex);
    if (phones && phones.length > 3) {
      return {
        isFake: true,
        reason: `检测到${phones.length}个不同手机号，疑似虚假简历`,
      };
    }

    return { isFake: false };
  }

  calculateMatchScore(resumeData: any, jobRequirements: any): { score: number; details: any } {
    let totalScore = 0;
    const details: any = {};
    let totalWeight = 0;

    const weights: Record<string, number> = {
      education: 25,
      experience: 25,
      city: 10,
      expectedSalary: 15,
      major: 15,
      currentPosition: 10,
    };

    if (jobRequirements.education && resumeData.education) {
      totalWeight += weights.education;
      const eduRank = [Education.HIGH_SCHOOL, Education.COLLEGE, Education.BACHELOR, Education.MASTER, Education.DOCTOR];
      const reqIdx = eduRank.indexOf(jobRequirements.education);
      const resIdx = eduRank.indexOf(resumeData.education);
      if (resIdx >= reqIdx) {
        totalScore += weights.education;
        details.education = { matched: true, score: weights.education };
      } else if (resIdx === reqIdx - 1) {
        totalScore += weights.education * 0.5;
        details.education = { matched: false, partial: true, score: weights.education * 0.5 };
      } else {
        details.education = { matched: false, score: 0 };
      }
    }

    if (jobRequirements.experience && resumeData.experience !== undefined) {
      totalWeight += weights.experience;
      const reqExp = this.parseExperienceToYears(jobRequirements.experience);
      if (reqExp !== null) {
        if (resumeData.experience >= reqExp) {
          totalScore += weights.experience;
          details.experience = { matched: true, score: weights.experience };
        } else if (resumeData.experience >= reqExp * 0.7) {
          totalScore += weights.experience * 0.6;
          details.experience = { matched: false, partial: true, score: weights.experience * 0.6 };
        } else {
          details.experience = { matched: false, score: 0 };
        }
      }
    }

    if (jobRequirements.city && resumeData.city) {
      totalWeight += weights.city;
      if (resumeData.city.includes(jobRequirements.city) || jobRequirements.city.includes(resumeData.city)) {
        totalScore += weights.city;
        details.city = { matched: true, score: weights.city };
      } else {
        details.city = { matched: false, score: 0 };
      }
    }

    if (jobRequirements.salaryMin && jobRequirements.salaryMax && resumeData.expectedSalary) {
      totalWeight += weights.expectedSalary;
      const salaryRange = this.parseSalaryRange(resumeData.expectedSalary);
      if (salaryRange) {
        const overlap = Math.max(0, Math.min(salaryRange.max, jobRequirements.salaryMax) - Math.max(salaryRange.min, jobRequirements.salaryMin));
        const total = salaryRange.max - salaryRange.min;
        if (overlap > 0 && total > 0) {
          const ratio = Math.min(1, overlap / total);
          totalScore += weights.expectedSalary * ratio;
          details.expectedSalary = { matched: ratio >= 0.5, partial: ratio < 1, score: weights.expectedSalary * ratio };
        } else {
          details.expectedSalary = { matched: false, score: 0 };
        }
      }
    }

    if (jobRequirements.requirements && resumeData.major) {
      totalWeight += weights.major;
      if (jobRequirements.requirements.includes(resumeData.major)) {
        totalScore += weights.major;
        details.major = { matched: true, score: weights.major };
      } else {
        details.major = { matched: false, score: 0 };
      }
    }

    const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
    return { score: finalScore, details };
  }

  private extractName(content: string, fileName: string): string | null {
    if (fileName) {
      const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[_\-\s\(\)\[\]（）【】\d]/g, '');
      if (baseName.length >= 2 && baseName.length <= 4 && /^[\u4e00-\u9fa5]+$/.test(baseName)) {
        return baseName;
      }
    }

    const patterns = [
      /(?:姓\s*名|名\s*字|Name)\s*[:：]\s*([\u4e00-\u9fa5a-zA-Z]{2,20})/i,
      /^([\u4e00-\u9fa5]{2,4})\s*$/m,
      /\b([\u4e00-\u9fa5]{2,4})\s*(?:男|女|先生|女士)/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }

    return null;
  }

  private extractPhone(content: string): string | null {
    const phoneRegex = /(?:(?:电话|手机|Tel|Phone|Mobile)\s*[:：]?\s*)?(1[3-9]\d{9})(?!\d)/i;
    const match = content.match(phoneRegex);
    if (match) return match[1];
    return null;
  }

  private extractEmail(content: string): string | null {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = content.match(emailRegex);
    if (match) return match[0];
    return null;
  }

  private extractGender(content: string): Gender | null {
    for (const [keyword, gender] of Object.entries(GENDER_MAP)) {
      const regex = new RegExp(`性\s*别\\s*[:：]?\\s*${keyword}`, 'i');
      if (regex.test(content)) return gender;
    }
    return null;
  }

  private extractAge(content: string): number | null {
    const patterns = [
      /年\s*龄\s*[:：]?\s*(\d{1,2})\s*岁?/,
      /(\d{1,2})\s*岁/,
      /出\s*生[:：]?\s*(19|20)\d{2}[\-\/年.]\s*\d{1,2}/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        if (pattern === patterns[2]) {
          const yearMatch = content.match(/(19|20)(\d{2})/);
          if (yearMatch) {
            const birthYear = parseInt(`19${yearMatch[2]}`);
            if (birthYear > 1950 && birthYear < 2010) {
              const age = new Date().getFullYear() - birthYear;
              if (age >= 16 && age <= 65) return age;
            }
          }
        } else {
          const age = parseInt(match[1]);
          if (age >= 16 && age <= 65) return age;
        }
      }
    }
    return null;
  }

  private extractEducation(content: string): Education | null {
    for (const [keyword, edu] of Object.entries(EDUCATION_MAP)) {
      if (content.includes(keyword)) return edu;
    }
    return null;
  }

  private extractSchoolAndMajor(content: string): { school?: string; major?: string } {
    const result: any = {};

    const schoolPatterns = [
      /(?:毕业院校|学校|School|University)\s*[:：]\s*([\u4e00-\u9fa5a-zA-Z\s·]{2,50})/i,
      /([\u4e00-\u9fa5]{2,10}(?:大学|学院|学校|University|Institute|College))/i,
    ];

    for (const pattern of schoolPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.school = match[1].trim();
        break;
      }
    }

    const majorPatterns = [
      /(?:专业|Major)\s*[:：]\s*([\u4e00-\u9fa5a-zA-Z\s·]{2,50})/i,
      /([\u4e00-\u9fa5]{2,10}(?:工程|管理|科学|技术|设计|文学|经济学|法学|医学|学))专业?/,
    ];

    for (const pattern of majorPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.major = match[1].trim();
        break;
      }
    }

    return result;
  }

  private extractExperience(content: string): number | null {
    const patterns = [
      /(?:工作经验|工作年限|经验|Experience)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*年?/i,
      /(\d+(?:\.\d+)?)\s*[\+~-]\s*(\d+(?:\.\d+)?)\s*年.*经验/,
      /(\d+(?:\.\d+)?)\s*年.*(?:经验|工作)/,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = content.match(patterns[i]);
      if (match) {
        if (i === 1) {
          return (parseFloat(match[1]) + parseFloat(match[2])) / 2;
        }
        const years = parseFloat(match[1]);
        if (years >= 0 && years <= 50) return years;
      }
    }
    return null;
  }

  private extractCurrentInfo(content: string): { currentCompany?: string; currentPosition?: string } {
    const result: any = {};

    const companyPatterns = [
      /(?:当前公司|现公司|所在公司|公司|Company)\s*[:：]\s*([\u4e00-\u9fa5a-zA-Z0-9\s（）()·\-]{2,50})/i,
    ];

    for (const pattern of companyPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.currentCompany = match[1].trim();
        break;
      }
    }

    const positionPatterns = [
      /(?:当前职位|现任职位|现职位|职位|Position)\s*[:：]\s*([\u4e00-\u9fa5a-zA-Z\s·\-]{2,50})/i,
    ];

    for (const pattern of positionPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.currentPosition = match[1].trim();
        break;
      }
    }

    return result;
  }

  private extractExpectedSalary(content: string): string | null {
    const patterns = [
      /(?:期望薪资|薪资要求|期望薪酬|Salary)\s*[:：]?\s*(\d+(?:\.\d+)?\s*[kKwW万]?\s*[-~到至]\s*\d+(?:\.\d+)?\s*[kKwW万]?)/i,
      /(?:期望薪资|薪资要求|期望薪酬|Salary)\s*[:：]?\s*(面\s*议)/i,
      /(\d+(?:\.\d+)?\s*[kKwW万]?\s*[-~到至]\s*\d+(?:\.\d+)?\s*[kKwW万]?)\s*(?:\/月|\/年)?.*(?:薪资|薪酬)/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }

  private extractCity(content: string): string | null {
    const patterns = [
      /(?:期望城市|工作地点|所在城市|城市|City|Location)\s*[:：]?\s*([\u4e00-\u9fa5]{2,10}(?:市|区|县)?)/i,
    ];

    const majorCities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '苏州', '天津', '郑州', '长沙', '青岛', '宁波', '厦门', '合肥', '福州', '济南'];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }

    for (const city of majorCities) {
      if (content.includes(city)) return city;
    }

    return null;
  }

  private extractSelfEvaluation(content: string): string | null {
    const patterns = [
      /(?:自我评价|个人简介|自我介绍|About\s*Me)\s*[:：]?\s*([\s\S]{20,500}?)(?:\n\s*(?:工作经历|教育背景|项目经验|技能|$))/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }

  private parseExperienceToYears(expStr: string): number | null {
    const match = expStr.match(/(\d+(?:\.\d+)?)/);
    if (match) return parseFloat(match[1]);
    return null;
  }

  private parseSalaryRange(salaryStr: string): { min: number; max: number } | null {
    const match = salaryStr.match(/(\d+(?:\.\d+)?)\s*[kKwW万]?\s*[-~到至]\s*(\d+(?:\.\d+)?)\s*[kKwW万]?/);
    if (match) {
      let min = parseFloat(match[1]);
      let max = parseFloat(match[2]);
      if (/万/i.test(salaryStr)) {
        min *= 10;
        max *= 10;
      }
      return { min, max };
    }
    return null;
  }
}

export default new ResumeParserService();
