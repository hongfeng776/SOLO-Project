import { AppError } from './app-error';
import { Resume, Job, Interview } from '../models';
import { ResumeStatus, JobStatus, InterviewResult } from '../constants/recruitment.enum';

export interface RiskCheckResult {
  passed: boolean;
  risks: RiskItem[];
}

export interface RiskItem {
  level: 'high' | 'medium' | 'low';
  code: string;
  message: string;
  suggestion: string;
}

export class RecruitmentRiskService {
  async checkResumeUpload(resumeData: any): Promise<RiskCheckResult> {
    const risks: RiskItem[] = [];

    if (!resumeData.phone || resumeData.phone.length < 11) {
      risks.push({
        level: 'high',
        code: 'R001',
        message: '手机号格式不正确',
        suggestion: '请填写正确的11位手机号',
      });
    }

    if (!resumeData.name || resumeData.name.length < 2) {
      risks.push({
        level: 'high',
        code: 'R002',
        message: '姓名不完整',
        suggestion: '请填写完整的候选人姓名',
      });
    }

    const existingResume = await Resume.findOne({
      where: { phone: resumeData.phone, jobId: resumeData.jobId },
    });
    if (existingResume) {
      risks.push({
        level: 'medium',
        code: 'R003',
        message: '该岗位下已存在相同手机号的简历',
        suggestion: '请确认是否重复投递',
      });
    }

    if (resumeData.age && (resumeData.age < 16 || resumeData.age > 65)) {
      risks.push({
        level: 'medium',
        code: 'R004',
        message: '年龄不在合理范围内',
        suggestion: '请确认年龄信息是否正确',
      });
    }

    return {
      passed: risks.filter((r) => r.level === 'high').length === 0,
      risks,
    };
  }

  async checkInterviewArrangement(interviewData: any): Promise<RiskCheckResult> {
    const risks: RiskItem[] = [];

    if (!interviewData.interviewTime) {
      risks.push({
        level: 'high',
        code: 'I001',
        message: '未设置面试时间',
        suggestion: '请设置面试时间',
      });
    }

    if (!interviewData.interviewer) {
      risks.push({
        level: 'medium',
        code: 'I002',
        message: '未指定面试官',
        suggestion: '请指定面试官',
      });
    }

    if (interviewData.interviewTime) {
      const interviewDate = new Date(interviewData.interviewTime);
      if (interviewDate < new Date()) {
        risks.push({
          level: 'high',
          code: 'I003',
          message: '面试时间不能早于当前时间',
          suggestion: '请选择未来的时间',
        });
      }
    }

    if (interviewData.resumeId && interviewData.interviewTime) {
      const overlapping = await Interview.findOne({
        where: {
          resumeId: interviewData.resumeId,
          interviewTime: interviewData.interviewTime,
        },
      });
      if (overlapping && overlapping.id !== interviewData.id) {
        risks.push({
          level: 'medium',
          code: 'I004',
          message: '该候选人在同一时间已有面试安排',
          suggestion: '请调整面试时间',
        });
      }
    }

    return {
      passed: risks.filter((r) => r.level === 'high').length === 0,
      risks,
    };
  }

  async checkJobPublish(jobData: any): Promise<RiskCheckResult> {
    const risks: RiskItem[] = [];

    if (!jobData.title || jobData.title.length < 2) {
      risks.push({
        level: 'high',
        code: 'J001',
        message: '岗位名称不完整',
        suggestion: '请填写完整的岗位名称',
      });
    }

    if (!jobData.companyId) {
      risks.push({
        level: 'high',
        code: 'J002',
        message: '未关联企业',
        suggestion: '请选择所属企业',
      });
    }

    if (!jobData.description || jobData.description.length < 20) {
      risks.push({
        level: 'medium',
        code: 'J003',
        message: '岗位职责描述过短',
        suggestion: '建议完善岗位职责描述，吸引更多候选人',
      });
    }

    if (!jobData.requirements || jobData.requirements.length < 10) {
      risks.push({
        level: 'medium',
        code: 'J004',
        message: '任职要求描述过短',
        suggestion: '建议完善任职要求，提高筛选精准度',
      });
    }

    if (jobData.salaryMin && jobData.salaryMax && jobData.salaryMin >= jobData.salaryMax) {
      risks.push({
        level: 'high',
        code: 'J005',
        message: '薪资范围设置不合理',
        suggestion: '最高薪资应大于最低薪资',
      });
    }

    return {
      passed: risks.filter((r) => r.level === 'high').length === 0,
      risks,
    };
  }

  async checkHireProcess(resumeId: number): Promise<RiskCheckResult> {
    const risks: RiskItem[] = [];

    const resume = await Resume.findByPk(resumeId);
    if (!resume) {
      return {
        passed: false,
        risks: [
          {
            level: 'high',
            code: 'H001',
            message: '简历不存在',
            suggestion: '请检查简历ID',
          },
        ],
      };
    }

    const interviews = await Interview.count({ where: { resumeId } });
    if (interviews === 0 && resume.status !== ResumeStatus.REJECTED) {
      risks.push({
        level: 'medium',
        code: 'H002',
        message: '该简历暂无面试记录',
        suggestion: '建议先安排面试评估',
      });
    }

    const passInterviews = await Interview.count({
      where: { resumeId, result: InterviewResult.PASS },
    });
    if (passInterviews === 0 && resume.status === ResumeStatus.OFFER) {
      risks.push({
        level: 'high',
        code: 'H003',
        message: '未通过面试但已发Offer',
        suggestion: '请确认面试流程是否完整',
      });
    }

    return {
      passed: risks.filter((r) => r.level === 'high').length === 0,
      risks,
    };
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateIdCard(idCard: string): boolean {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  }
}

export default new RecruitmentRiskService();
