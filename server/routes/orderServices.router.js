const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/orderServices.controller');
const router = express.Router();
const checkToken = require('../middlewares/secureRoutes');

router.route('/addOrder').post(checkToken,controller.addOrder);
router.route('/getOrders').get(checkToken,controller.getOrders);
router.route('/getOrder/:id').get(checkToken,controller.getOrder);
router.route('/updateOrderStatus/:id').put(checkToken,controller.updateOrderStatus);
router.route('/currentOrder').get(checkToken,controller.getOrders);
router.route('/orderHistory').get(checkToken,controller.getOrderHistory);

module.exports = router;
