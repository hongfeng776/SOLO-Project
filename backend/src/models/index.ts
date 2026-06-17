import Company from './company.model';
import Job from './job.model';
import JobOperationLog from './job-operation-log.model';
import Resume from './resume.model';
import Interview from './interview.model';
import Onboard from './onboard.model';
import User from './user.model';
import Qualification from './qualification.model';
import QualificationAuditLog from './qualification-audit-log.model';
import CompanyChangeLog from './company-change-log.model';
import RecruitmentConfig from './recruitment-config.model';
import RecruitmentConfigLog from './recruitment-config-log.model';
import PermissionLog from './permission-log.model';
import LoginLog from './login-log.model';

Company.hasMany(Job, { foreignKey: 'companyId', as: 'jobs' });
Job.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(CompanyChangeLog, { foreignKey: 'companyId', as: 'changeLogs' });
CompanyChangeLog.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasOne(RecruitmentConfig, { foreignKey: 'companyId', as: 'recruitmentConfig' });
RecruitmentConfig.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

RecruitmentConfig.hasMany(RecruitmentConfigLog, { foreignKey: 'configId', as: 'configLogs' });
RecruitmentConfigLog.belongsTo(RecruitmentConfig, { foreignKey: 'configId', as: 'config' });

User.hasMany(PermissionLog, { foreignKey: 'userId', as: 'permissionLogs' });
PermissionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LoginLog, { foreignKey: 'userId', as: 'loginLogs' });
LoginLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Job.hasMany(Resume, { foreignKey: 'jobId', as: 'resumes' });
Resume.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Resume.hasMany(Interview, { foreignKey: 'resumeId', as: 'interviews' });
Interview.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
Interview.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Resume.hasOne(Onboard, { foreignKey: 'resumeId', as: 'onboard' });
Onboard.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
Onboard.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Qualification.hasMany(QualificationAuditLog, { foreignKey: 'qualificationId', as: 'auditLogs' });
QualificationAuditLog.belongsTo(Qualification, { foreignKey: 'qualificationId', as: 'qualification' });

Job.hasMany(JobOperationLog, { foreignKey: 'jobId', as: 'operationLogs' });
JobOperationLog.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

export { Company, Job, JobOperationLog, Resume, Interview, Onboard, User, Qualification, QualificationAuditLog, CompanyChangeLog, RecruitmentConfig, RecruitmentConfigLog, PermissionLog, LoginLog };
