import { Router } from 'express'
import * as noteController from '@controllers/note'
import * as tagController from '@controllers/tag'
import { authMiddleware } from '@middlewares/auth'
import { clearCacheMiddleware } from '@middlewares/cache'

const router = Router()

router.use(authMiddleware)

router.get('/notes', noteController.list)
router.get('/notes/hot', noteController.hotList)
router.get('/notes/stats', noteController.stats)
router.get('/notes/trend', noteController.trend)
router.get('/notes/:id', noteController.detail)
router.post('/notes', clearCacheMiddleware('/content/notes'), noteController.create)
router.put('/notes/:id', clearCacheMiddleware('/content/notes'), noteController.update)
router.post('/notes/:id/submit', clearCacheMiddleware('/content/notes'), noteController.submitForReview)
router.post('/notes/:id/audit', clearCacheMiddleware('/content/notes'), noteController.audit)
router.post('/notes/:id/view', noteController.view)
router.post('/notes/:id/like', noteController.like)
router.post('/notes/:id/share', noteController.share)
router.post('/notes/batch-audit', clearCacheMiddleware('/content/notes'), noteController.batchAudit)
router.post('/notes/batch-change-status', clearCacheMiddleware('/content/notes'), noteController.batchChangeStatus)
router.delete('/notes/:id', clearCacheMiddleware('/content/notes'), noteController.remove)

router.get('/tags', tagController.list)
router.get('/tags/all', tagController.all)
router.post('/tags', clearCacheMiddleware('/content/tags'), tagController.create)
router.put('/tags/:id', clearCacheMiddleware('/content/tags'), tagController.update)
router.delete('/tags/:id', clearCacheMiddleware('/content/tags'), tagController.remove)

export default router
