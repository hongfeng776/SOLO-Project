import { Router } from 'express'
import * as dmController from '@controllers/direct-message'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/stats', dmController.getStats)
router.get('/sensitive-words', dmController.getSensitiveWords)
router.post('/check-compliance', dmController.checkCompliance)
router.post('/highlight', dmController.highlightContent)

router.get('/messages', dmController.listMessages)
router.get('/conversations', dmController.listConversations)
router.get('/messages/:id', dmController.getMessageDetail)
router.get('/messages/:id/trace', dmController.getMessageTrace)
router.get('/messages/:id/audit-logs', dmController.getAuditLogs)
router.get('/conversations/:id', dmController.getConversationDetail)
router.get('/conversations/:id/messages', dmController.getConversationMessages)
router.get('/conversations/:id/trace', dmController.getConversationTrace)
router.get('/conversations/:id/audit-logs', dmController.getConversationAuditLogs)

router.post('/send', dmController.sendMessage)
router.delete('/messages/:id', roleMiddleware('admin', 'risk_admin', 'editor'), dmController.removeMessage)
router.post('/batch-remove', roleMiddleware('admin', 'risk_admin'), dmController.batchRemoveMessages)

router.post('/punish', roleMiddleware('admin', 'risk_admin'), dmController.punishAccount)
router.post('/batch-ban', roleMiddleware('admin', 'risk_admin'), dmController.batchBanAccounts)
router.post('/restrict-conversation', roleMiddleware('admin', 'risk_admin'), dmController.restrictConversation)

export default router
