const Router = require('koa-router');
const UserFeedbackController = require('../controllers/UserFeedbackController');
const { auth } = require('../middlewares/authMiddleware');

const router = new Router({ prefix: '' });

router.get('/stats', auth('userFeedback:view'), UserFeedbackController.getStats);

router.get('/list', auth('userFeedback:view'), UserFeedbackController.getList);
router.get('/detail/:id', auth('userFeedback:view'), UserFeedbackController.getDetail);
router.post('/create', auth('userFeedback:create'), UserFeedbackController.create);
router.post('/assign/:id', auth('userFeedback:handle'), UserFeedbackController.assign);
router.post('/start/:id', auth('userFeedback:handle'), UserFeedbackController.startProcessing);
router.post('/resolve/:id', auth('userFeedback:handle'), UserFeedbackController.resolve);
router.post('/reject/:id', auth('userFeedback:handle'), UserFeedbackController.reject);
router.post('/batch', auth('userFeedback:manage'), UserFeedbackController.batchAction);

router.get('/trace', auth('userFeedback:view'), UserFeedbackController.trace);
router.get('/validate/:id', auth('userFeedback:view'), UserFeedbackController.validate);
router.get('/check-duplicate', auth('userFeedback:view'), UserFeedbackController.checkDuplicate);
router.post('/upgrade-priority', auth('userFeedback:manage'), UserFeedbackController.upgradePriority);
router.post('/update-timeliness', auth('userFeedback:manage'), UserFeedbackController.updateTimeliness);

module.exports = router;
