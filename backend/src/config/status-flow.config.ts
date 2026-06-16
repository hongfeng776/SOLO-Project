import { statusFlowEngine } from '../utils/status-flow';
import {
  ResumeStatus,
  JobStatus,
  InterviewResult,
  OnboardStatus,
} from './recruitment.enum';

export const registerStatusFlows = () => {
  statusFlowEngine.register({
    entityType: 'resume',
    initialStatus: ResumeStatus.NEW,
    finalStatuses: [ResumeStatus.HIRED, ResumeStatus.REJECTED],
    transitions: [
      {
        from: ResumeStatus.NEW,
        to: ResumeStatus.SCREENING,
        label: '初筛',
        action: 'start_screening',
        description: '简历进入初筛阶段',
      },
      {
        from: ResumeStatus.NEW,
        to: ResumeStatus.REJECTED,
        label: '淘汰',
        action: 'reject_new',
        description: '简历初筛淘汰',
      },
      {
        from: ResumeStatus.SCREENING,
        to: ResumeStatus.INTERVIEW,
        label: '安排面试',
        action: 'arrange_interview',
        description: '通过初筛，安排面试',
      },
      {
        from: ResumeStatus.SCREENING,
        to: ResumeStatus.REJECTED,
        label: '淘汰',
        action: 'reject_screening',
        description: '初筛不通过',
      },
      {
        from: ResumeStatus.INTERVIEW,
        to: ResumeStatus.OFFER,
        label: '发Offer',
        action: 'send_offer',
        description: '面试通过，发放Offer',
      },
      {
        from: ResumeStatus.INTERVIEW,
        to: ResumeStatus.REJECTED,
        label: '淘汰',
        action: 'reject_interview',
        description: '面试不通过',
      },
      {
        from: ResumeStatus.OFFER,
        to: ResumeStatus.HIRED,
        label: '确认入职',
        action: 'confirm_hire',
        description: '候选人确认入职',
      },
      {
        from: ResumeStatus.OFFER,
        to: ResumeStatus.REJECTED,
        label: '拒Offer',
        action: 'reject_offer',
        description: '候选人拒绝Offer',
      },
      {
        from: [ResumeStatus.NEW, ResumeStatus.SCREENING, ResumeStatus.INTERVIEW, ResumeStatus.OFFER],
        to: ResumeStatus.REJECTED,
        label: '淘汰',
        action: 'manual_reject',
        description: '手动淘汰',
      },
    ],
  });

  statusFlowEngine.register({
    entityType: 'job',
    initialStatus: JobStatus.DRAFT,
    finalStatuses: [JobStatus.CLOSED],
    transitions: [
      {
        from: JobStatus.DRAFT,
        to: JobStatus.PUBLISHED,
        label: '发布',
        action: 'publish',
        description: '发布岗位',
      },
      {
        from: JobStatus.PUBLISHED,
        to: JobStatus.PAUSED,
        label: '暂停',
        action: 'pause',
        description: '暂停招聘',
      },
      {
        from: JobStatus.PAUSED,
        to: JobStatus.PUBLISHED,
        label: '重新发布',
        action: 'republish',
        description: '重新发布岗位',
      },
      {
        from: [JobStatus.PUBLISHED, JobStatus.PAUSED, JobStatus.DRAFT],
        to: JobStatus.CLOSED,
        label: '关闭',
        action: 'close',
        description: '关闭岗位',
      },
      {
        from: JobStatus.CLOSED,
        to: JobStatus.DRAFT,
        label: '重启',
        action: 'reopen',
        description: '重新开启岗位',
      },
    ],
  });

  statusFlowEngine.register({
    entityType: 'onboard',
    initialStatus: OnboardStatus.PENDING,
    finalStatuses: [OnboardStatus.ONBOARDED, OnboardStatus.CANCELLED],
    transitions: [
      {
        from: OnboardStatus.PENDING,
        to: OnboardStatus.CONFIRMED,
        label: '确认入职',
        action: 'confirm',
        description: '候选人确认入职',
      },
      {
        from: OnboardStatus.PENDING,
        to: OnboardStatus.CANCELLED,
        label: '取消入职',
        action: 'cancel',
        description: '候选人取消入职',
      },
      {
        from: OnboardStatus.CONFIRMED,
        to: OnboardStatus.ONBOARDED,
        label: '已入职',
        action: 'mark_onboarded',
        description: '候选人已入职',
      },
      {
        from: OnboardStatus.CONFIRMED,
        to: OnboardStatus.CANCELLED,
        label: '取消入职',
        action: 'cancel_confirmed',
        description: '候选人取消入职',
      },
    ],
  });

  statusFlowEngine.register({
    entityType: 'interview',
    initialStatus: 'pending',
    finalStatuses: ['pass', 'fail', 'cancelled'],
    transitions: [
      {
        from: 'pending',
        to: 'ongoing',
        label: '面试中',
        action: 'start',
        description: '面试进行中',
      },
      {
        from: ['pending', 'ongoing'],
        to: 'pass',
        label: '通过',
        action: 'pass',
        description: '面试通过',
      },
      {
        from: ['pending', 'ongoing'],
        to: 'fail',
        label: '不通过',
        action: 'fail',
        description: '面试不通过',
      },
      {
        from: ['pending', 'ongoing'],
        to: 'cancelled',
        label: '取消',
        action: 'cancel',
        description: '取消面试',
      },
    ],
  });

  console.log('Status flow configurations registered successfully.');
};

export default registerStatusFlows;
