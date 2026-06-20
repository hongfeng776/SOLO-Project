import { Router } from 'express';
import interviewController from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, interviewController.getList);
router.get('/stats', authMiddleware, interviewController.getStats);
router.get('/record-stats', authMiddleware, interviewController.getRecordStats);
router.get('/available-interviewers', authMiddleware, interviewController.getAvailableInterviewers);
router.get('/allocation-logs', authMiddleware, interviewController.getAllocationLogs);
router.get('/warning-list', authMiddleware, interviewController.getWarningList);
router.get('/warning-stats', authMiddleware, interviewController.getWarningStats);
router.get('/warning-logs', authMiddleware, interviewController.getWarningLogs);
router.get('/overdue-rate-stats', authMiddleware, interviewController.getOverdueRateStats);
router.get('/interviewer-workload/:interviewerId', authMiddleware, interviewController.getInterviewerWorkload);
router.get('/:id', authMiddleware, interviewController.getDetail);
router.get('/:id/logs', authMiddleware, interviewController.getOperationLogs);

router.post('/', authMiddleware, interviewController.create);
router.post('/validate-time-conflict', authMiddleware, interviewController.validateTimeConflict);
router.post('/:id/validate-record', authMiddleware, interviewController.validateInterviewRecord);
router.post('/batch-appoint', authMiddleware, interviewController.batchAppoint);
router.post('/batch-cancel-overdue', authMiddleware, interviewController.batchCancelOverdue);
router.post('/batch-sort', authMiddleware, interviewController.batchSort);
router.post('/batch-remove', authMiddleware, interviewController.batchRemove);
router.post('/batch-supplement-overdue', authMiddleware, interviewController.batchSupplementOverdue);
router.post('/batch-update-pending-results', authMiddleware, interviewController.batchUpdatePendingResults);
router.post('/interviewer-status', authMiddleware, interviewController.updateInterviewerStatus);
router.post('/batch-replace-interviewer', authMiddleware, interviewController.batchReplaceInterviewer);
router.post('/batch-schedule-optimize', authMiddleware, interviewController.batchScheduleOptimize);
router.post('/check-warnings', authMiddleware, interviewController.checkWarnings);
router.post('/batch-handle-overdue', authMiddleware, interviewController.batchHandleOverdue);
router.post('/batch-postpone-interviews', authMiddleware, interviewController.batchPostponeInterviews);
router.post('/sort-warning-list', authMiddleware, interviewController.sortWarningList);

router.put('/:id', authMiddleware, interviewController.update);
router.put('/:id/confirm-appointment', authMiddleware, interviewController.confirmAppointment);
router.put('/:id/confirm-interviewer', authMiddleware, interviewController.confirmByInterviewer);
router.put('/:id/complete', authMiddleware, interviewController.completeInterview);
router.put('/:id/cancel', authMiddleware, interviewController.cancelInterview);
router.put('/:id/allocate-interviewer', authMiddleware, interviewController.allocateInterviewer);
router.put('/:id/handle-overdue', authMiddleware, interviewController.handleOverdueInterview);
router.put('/:id/dismiss-warning', authMiddleware, interviewController.dismissWarning);
router.put('/:id/mark-false-alarm', authMiddleware, interviewController.markFalseAlarm);

router.delete('/:id', authMiddleware, interviewController.remove);

export default router;
