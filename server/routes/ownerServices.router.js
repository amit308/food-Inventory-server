const express = require('express');
const validate = require('express-validation');
// const activityLogger = require('../middlewares/activityLogger')
const controller = require('../controllers/ownerServices.controller');
const {login,resetPassword,editProfile} = require('../validations/ownerServices.validation');
const router = express.Router();
const checkToken = require('../middlewares/secureRoutes');

router.route('/addOwner').post(controller.addOwner);
router.route('/login').post(validate(login),controller.ownerLogin);
router.route('/resetPassword').put(validate(resetPassword),controller.ownerResetPassword);
router.route('/editProfile').put(checkToken,validate(editProfile),controller.ownerEditProfile);
router.route('/uploadImage').post(controller.uploadImage);

module.exports = router;