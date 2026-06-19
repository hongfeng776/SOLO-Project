const Router = require('koa-router');
const UserSegmentController = require('../controllers/UserSegmentController');
const { auth } = require('../middlewares/authMiddleware');

const router = new Router({ prefix: '' });

router.get('/stats', auth('userSegment:view'), UserSegmentController.getStats);

// ============ 规则管理 ============
router.get('/rules', auth('userSegment:view'), UserSegmentController.getRuleList);
router.get('/rules/:id', auth('userSegment:view'), UserSegmentController.getRuleDetail);
router.post('/rules', auth('userSegment:create'), UserSegmentController.createRule);
router.put('/rules/:id', auth('userSegment:update'), UserSegmentController.updateRule);
router.delete('/rules/:id', auth('userSegment:manage'), UserSegmentController.deleteRule);
router.patch('/rules/:id/status', auth('userSegment:update'), UserSegmentController.updateRuleStatus);
router.post('/rules/:id/run', auth('userSegment:manage'), UserSegmentController.runRuleCalc);
router.post('/rules/validate', auth('userSegment:create'), UserSegmentController.validateThresholds);

// ============ 用户分层标签 ============
router.get('/tags', auth('userSegment:view'), UserSegmentController.getTagList);

// ============ 层级调整 ============
router.post('/adjust', auth('userSegment:manage'), UserSegmentController.manualAdjust);

// ============ 策略管理 ============
router.get('/strategies', auth('userSegment:view'), UserSegmentController.getStrategyList);
router.post('/strategies', auth('userSegment:create'), UserSegmentController.createStrategy);
router.get('/strategies/:id/preview', auth('userSegment:view'), UserSegmentController.getStrategyMatchPreview);
router.patch('/strategies/:id/cancel', auth('userSegment:manage'), UserSegmentController.cancelStrategy);

// ============ 溯源与校验 ============
router.get('/trace/:userId', auth('userSegment:view'), UserSegmentController.traceSegment);
router.get('/trace', auth('userSegment:view'), UserSegmentController.traceSegment);
router.get('/validate/:ruleId', auth('userSegment:view'), UserSegmentController.validateMatch);
router.get('/validate', auth('userSegment:view'), UserSegmentController.validateMatch);
router.post('/benefit-fit', auth('userSegment:view'), UserSegmentController.checkBenefitFit);

module.exports = router;
