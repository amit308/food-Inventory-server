const express = require('express');
const validate = require('express-validation');
// const activityLogger = require('../middlewares/activityLogger')
const controller = require('../controllers/userServices.controller');
const {login} = require('../validations/userServices.validation');
const router = express.Router();
const checkToken = require('../middlewares/secureRoutes')


router.route('/login').post(validate(login),controller.userLogin);
router.route('/addUser').post(controller.addUser);
router.route('/validatePassCode').get(controller.validatePassCode);

module.exports = router;
