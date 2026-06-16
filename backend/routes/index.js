const express = require('express');
const { success } = require('../utils/result');
const auth = require('../middleware/auth');
const pagination = require('../middleware/pagination');

const authController = require('../controllers/AuthController');
const userController = require('../controllers/UserController');
const roleController = require('../controllers/RoleController');
const flightController = require('../controllers/FlightController');
const hotelController = require('../controllers/HotelController');
const carController = require('../controllers/CarController');
const ticketController = require('../controllers/TicketController');
const orderController = require('../controllers/OrderController');
const merchantController = require('../controllers/MerchantController');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(success({
    project: '智慧出行管理后台',
    version: '1.0.0',
    description: '后端API服务'
  }));
});

const registerCrudRoutes = (path, controller) => {
  router.get(`/${path}`, auth(), pagination, controller.list.bind(controller));
  router.get(`/${path}/:id`, auth(), controller.get.bind(controller));
  router.post(`/${path}`, auth(), controller.create.bind(controller));
  router.put(`/${path}/:id`, auth(), controller.update.bind(controller));
  router.delete(`/${path}/:id`, auth(), controller.remove.bind(controller));
  router.delete(`/${path}/batch`, auth(), controller.batchRemove.bind(controller));
};

router.post('/auth/login', authController.login);
router.get('/auth/userinfo', auth(), authController.getUserInfo);
router.post('/auth/logout', auth(), authController.logout);

registerCrudRoutes('users', userController);
registerCrudRoutes('roles', roleController);
registerCrudRoutes('flights', flightController);
registerCrudRoutes('hotels', hotelController);
registerCrudRoutes('cars', carController);
registerCrudRoutes('tickets', ticketController);
registerCrudRoutes('orders', orderController);
registerCrudRoutes('merchants', merchantController);

module.exports = router;
