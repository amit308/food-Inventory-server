const logger = require('../../config/logger');
const ownerService = require('../service/ownerServices');
const restaurantService = require('../service/restaurantServices');
const jwt = require('jsonwebtoken');
const scheduleTasks = require('../scheduler/resStatusScheduler');
const moment = require('moment');

const addOwner = (req,res,next)=>{
  logger.trace("inside add owner profile controller");
  let ownerData = req.body;
  ownerService.addOwner(ownerData).then(data => {
    res.status(200).json({"success":true, "data":data});
  }).catch(err=>{
    logger.fatal(err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  });
}

const ownerLogin = (req,res,next)=>{
  logger.debug("inside ownerLogin controller");
  var ownerData = req.body;
  ownerService.ownerLogin(ownerData)
  .then(data=>{
    logger.debug("data found",data);
    let payload = {
      "email" : data.email,
      "userId": data._id,
      "userType": 1,
	    "restaurantId": data.restaurantId 
    }
    data.token =  jwt.sign(payload,'my_secret_key',{ expiresIn: 60*60*24*30 });
    // data.password = null;
    delete data.password;
    // models.users.update({sessionKey:data.token},{where:{email:data.email}});
    res.status(200).json({"success":true, "data":data});
  }).catch(err=>{
      logger.fatal(err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  });
}

const ownerResetPassword = (req,res,next)=>{
    logger.debug("inside owner reset password controller");
    var passwordBody = req.body;
    ownerService.ownerResetPassword(passwordBody)
    .then(data=>{
      res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
      return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

//Restaurant Details (Flutter App)
const ownerEditProfile = (req,res,next)=>{
  logger.debug("inside owner edit profile controller",req.payLoad);
  let restaurantProfile = req.body;

  ownerService.ownerEditProfile(req.payLoad.userId , req.body).then(async (data)=>{
    
    io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));
    res.status(200).json({"success":true, "data":data.restaurantProfile});
  }).catch(err=>{
    logger.fatal(err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  });
}

const uploadImage = (req, res, next) => {
	
	ownerService.uploadImage(req, res).then((data) => {
		
		res.json({status: data});
	})
	.catch(err => {
		
		res.json({status: err});
	})
}

module.exports = {
  addOwner,
  ownerLogin,
  ownerResetPassword,
  ownerEditProfile,
  uploadImage
}