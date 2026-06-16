import { Op } from 'sequelize';
import { Resume, Job } from '../models';
import { ResumeStatus, JobStatus } from '../constants/recruitment.enum';

export interface MatchScore {
  resumeId: number;
  jobId: number;
  totalScore: number;
  maxScore: number;
  details: {
    dimension: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
  level: 'excellent' | 'good' | 'average' | 'poor';
}

export interface MatchConfig {
  educationWeight: number;
  experienceWeight: number;
  skillWeight: number;
  cityWeight: number;
  salaryWeight: number;
}

const DEFAULT_CONFIG: MatchConfig = {
  educationWeight: 25,
  experienceWeight: 30,
  skillWeight: 20,
  cityWeight: 15,
  salaryWeight: 10,
};

const EDUCATION_SCORES: Record<string, number> = {
  high_school: 20,
  college: 40,
  bachelor: 70,
  master: 90,
  doctor: 100,
};

const EDUCATION_ORDER = ['high_school', 'college', 'bachelor', 'master', 'doctor'];

export class TalentMatchService {
  private config: MatchConfig;

  constructor(config?: Partial<MatchConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async calculateMatchScore(resumeId: number, jobId: number): Promise<MatchScore> {
    const resume = await Resume.findByPk(resumeId);
    const job = await Job.findByPk(jobId);

    if (!resume || !job) {
      throw new Error('简历或岗位不存在');
    }

    const details: MatchScore['details'] = [];
    let totalScore = 0;
    let maxScore = 0;

    const educationScore = this.calculateEducationScore(resume.education, job.education);
    details.push({
      dimension: '学历匹配',
      score: educationScore,
      maxScore: this.config.educationWeight,
      description: this.getEducationDescription(resume.education, job.education),
    });
    totalScore += educationScore;
    maxScore += this.config.educationWeight;

    const experienceScore = this.calculateExperienceScore(
      resume.experience,
      job.experience
    );
    details.push({
      dimension: '经验匹配',
      score: experienceScore,
      maxScore: this.config.experienceWeight,
      description: this.getExperienceDescription(resume.experience, job.experience),
    });
    totalScore += experienceScore;
    maxScore += this.config.experienceWeight;

    const skillScore = this.calculateSkillScore(
      resume.selfEvaluation || '',
      job.requirements || ''
    );
    details.push({
      dimension: '技能匹配',
      score: skillScore,
      maxScore: this.config.skillWeight,
      description: '基于简历内容与岗位要求的关键词匹配',
    });
    totalScore += skillScore;
    maxScore += this.config.skillWeight;

    const cityScore = this.calculateCityScore(resume.city, job.city);
    details.push({
      dimension: '城市匹配',
      score: cityScore,
      maxScore: this.config.cityWeight,
      description: cityScore > 0 ? '工作城市匹配' : '工作城市不匹配',
    });
    totalScore += cityScore;
    maxScore += this.config.cityWeight;

    const salaryScore = this.calculateSalaryScore(
      resume.expectedSalary,
      job.salaryMin,
      job.salaryMax
    );
    details.push({
      dimension: '薪资匹配',
      score: salaryScore,
      maxScore: this.config.salaryWeight,
      description: '薪资预期匹配度',
    });
    totalScore += salaryScore;
    maxScore += this.config.salaryWeight;

    const percentage = totalScore / maxScore;
    let level: MatchScore['level'];
    if (percentage >= 0.8) level = 'excellent';
    else if (percentage >= 0.6) level = 'good';
    else if (percentage >= 0.4) level = 'average';
    else level = 'poor';

    return {
      resumeId,
      jobId,
      totalScore: Math.round(totalScore * 100) / 100,
      maxScore: Math.round(maxScore * 100) / 100,
      details,
      level,
    };
  }

  private calculateEducationScore(resumeEducation?: string, jobEducation?: string): number {
    if (!jobEducation || !resumeEducation) return this.config.educationWeight * 0.5;

    const resumeIdx = EDUCATION_ORDER.indexOf(resumeEducation);
    const jobIdx = EDUCATION_ORDER.indexOf(jobEducation);

    if (resumeIdx === -1 || jobIdx === -1) return this.config.educationWeight * 0.5;

    if (resumeIdx >= jobIdx) {
      return this.config.educationWeight;
    }

    const gap = jobIdx - resumeIdx;
    const ratio = Math.max(0, 1 - gap * 0.3);
    return this.config.educationWeight * ratio;
  }

  private getEducationDescription(resumeEdu?: string, jobEdu?: string): string {
    if (!jobEdu) return '无学历要求';
    if (!resumeEdu) return '简历未填写学历';

    const resumeLabel = this.getEducationLabel(resumeEdu);
    const jobLabel = this.getEducationLabel(jobEdu);

    if (resumeEdu === jobEdu) return `学历刚好匹配（${jobLabel}）`;

    const resumeIdx = EDUCATION_ORDER.indexOf(resumeEdu);
    const jobIdx = EDUCATION_ORDER.indexOf(jobEdu);

    if (resumeIdx > jobIdx) return `学历高于要求（${resumeLabel} > ${jobLabel}）`;
    return `学历低于要求（${resumeLabel} < ${jobLabel}）`;
  }

  private getEducationLabel(edu: string): string {
    const labels: Record<string, string> = {
      high_school: '高中',
      college: '大专',
      bachelor: '本科',
      master: '硕士',
      doctor: '博士',
    };
    return labels[edu] || edu;
  }

  private calculateExperienceScore(resumeExp?: number, jobExp?: string): number {
    if (!jobExp || resumeExp === undefined) return this.config.experienceWeight * 0.5;

    const resumeYears = Number(resumeExp) || 0;
    const jobMinYears = this.parseExperience(jobExp);

    if (jobMinYears === 0) return this.config.experienceWeight;

    if (resumeYears >= jobMinYears) {
      const bonus = Math.min((resumeYears - jobMinYears) * 0.1, 0.3);
      return this.config.experienceWeight * Math.min(1 + bonus, 1.2);
    }

    const ratio = resumeYears / jobMinYears;
    return this.config.experienceWeight * Math.max(ratio * 0.7, 0.2);
  }

  private parseExperience(expStr: string): number {
    const match = expStr.match(/(\d+)/);
    if (!match) return 0;

    const num = parseInt(match[1]);
    if (expStr.includes('以上') || expStr.includes('-')) {
      return num;
    }
    return num;
  }

  private getExperienceDescription(resumeExp?: number, jobExp?: string): string {
    if (!jobExp) return '无经验要求';
    if (resumeExp === undefined) return '简历未填写经验';
    return `${resumeExp}年经验 vs 要求${jobExp}`;
  }

  private calculateSkillScore(resumeContent: string, jobRequirements: string): number {
    if (!jobRequirements) return this.config.skillWeight * 0.5;

    const keywords = this.extractKeywords(jobRequirements);
    if (keywords.length === 0) return this.config.skillWeight * 0.5;

    let matched = 0;
    const resumeLower = resumeContent.toLowerCase();

    for (const keyword of keywords) {
      if (resumeLower.includes(keyword.toLowerCase())) {
        matched++;
      }
    }

    const ratio = matched / keywords.length;
    return this.config.skillWeight * ratio;
  }

  private extractKeywords(text: string): string[] {
    const commonSkills = [
      'javascript', 'typescript', 'vue', 'react', 'angular', 'node', 'java', 'python',
      'mysql', 'sql', 'redis', 'mongodb', 'docker', 'kubernetes',
      '管理', '沟通', '协调', '分析', '策划', '运营', '设计',
      '英语', 'c++', 'c#', 'go', 'rust', 'php',
      'excel', 'word', 'ppt', '数据分析', '项目管理',
    ];

    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const skill of commonSkills) {
      if (lowerText.includes(skill.toLowerCase())) {
        found.push(skill);
      }
    }

    return found.slice(0, 10);
  }

  private calculateCityScore(resumeCity?: string, jobCity?: string): number {
    if (!jobCity || !resumeCity) return this.config.cityWeight * 0.5;
    return resumeCity.includes(jobCity) || jobCity.includes(resumeCity)
      ? this.config.cityWeight
      : 0;
  }

  private calculateSalaryScore(
    expectedSalary?: string,
    salaryMin?: number,
    salaryMax?: number
  ): number {
    if (!expectedSalary || !salaryMin) return this.config.salaryWeight * 0.5;

    const expected = this.parseSalary(expectedSalary);
    if (expected === 0) return this.config.salaryWeight * 0.5;

    const jobMin = Number(salaryMin) || 0;
    const jobMax = Number(salaryMax) || jobMin * 1.5;

    if (expected >= jobMin && expected <= jobMax) {
      return this.config.salaryWeight;
    }

    if (expected < jobMin) {
      const ratio = expected / jobMin;
      return this.config.salaryWeight * Math.min(ratio * 1.2, 1);
    }

    if (expected > jobMax) {
      const ratio = jobMax / expected;
      return this.config.salaryWeight * Math.max(ratio, 0.3);
    }

    return this.config.salaryWeight * 0.5;
  }

  private parseSalary(salaryStr: string): number {
    const match = salaryStr.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 0;
    return parseFloat(match[1]);
  }

  async getMatchedResumes(
    jobId: number,
    limit: number = 20,
    minScore: number = 40
  ): Promise<(MatchScore & { resume: any })[]> {
    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new Error('岗位不存在');
    }

    const resumes = await Resume.findAll({
      where: {
        status: { [Op.ne]: ResumeStatus.REJECTED },
      },
      limit: 100,
      order: [['id', 'DESC']],
    });

    const results: (MatchScore & { resume: any })[] = [];

    for (const resume of resumes) {
      const score = await this.calculateMatchScore(resume.id, jobId);
      const percentage = (score.totalScore / score.maxScore) * 100;

      if (percentage >= minScore) {
        results.push({
          ...score,
          resume: resume.toJSON(),
        });
      }
    }

    results.sort((a, b) => b.totalScore - a.totalScore);
    return results.slice(0, limit);
  }

  async getMatchedJobs(
    resumeId: number,
    limit: number = 20,
    minScore: number = 40
  ): Promise<(MatchScore & { job: any })[]> {
    const resume = await Resume.findByPk(resumeId);
    if (!resume) {
      throw new Error('简历不存在');
    }

    const jobs = await Job.findAll({
      where: {
        status: JobStatus.PUBLISHED,
      },
      limit: 100,
      order: [['id', 'DESC']],
    });

    const results: (MatchScore & { job: any })[] = [];

    for (const job of jobs) {
      const score = await this.calculateMatchScore(resumeId, job.id);
      const percentage = (score.totalScore / score.maxScore) * 100;

      if (percentage >= minScore) {
        results.push({
          ...score,
          job: job.toJSON(),
        });
      }
    }

    results.sort((a, b) => b.totalScore - a.totalScore);
    return results.slice(0, limit);
  }
}

export default new TalentMatchService();
