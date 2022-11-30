const logger = require('../../config/logger');
const userService = require('../service/userServices');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var uuid = require('uuid');

const userLogin = (req,res,next)=>{
  logger.trace("inside userLogin controller");
  var userData = req.body;
  userService.userLogin(userData, res).then(data=>{
    logger.debug("data found",data);
    let payload = {
      "email" : data.email,
      "userId":data._id,
    }
    data.token =  jwt.sign(payload,'my_secret_key',{ expiresIn: 60*60*24*30 });
    delete data.password;
    res.json({"success":true, "data":data});
  }).catch(err=>{
	  logger.trace(err.message);
    return res.status(200).json({"success":false,"message":err.message});
  });
}

const addUser = async (req,res,next)=>{
  logger.trace("inside addUser controller");
  let userData = req.body;
  const salt = await bcrypt.genSaltSync(10);
  const hashPassword = await bcrypt.hashSync(userData.password, salt);
  userData.password = hashPassword;
  logger.debug(userData);
  userService.addUser(userData).then(data=>{
    let payload = {
      "email" : data.email,
      "userId":data._id,
    }
	logger.trace('After Adding');
    data.token =  jwt.sign(payload,'my_secret_key',{ expiresIn: 60*60*24*30 });
    delete data.password;
    return res.json({"success":true,"data":data});
  }).catch(err=>{
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	//return res.status(200).json({"success":false,"message":err.message});
  });
}

const validatePassCode = (req,res,next)=>{
  logger.trace("inside validate passcode controller");
  userService.validatePassCode(req.query.resPassCode, req.query.passcode, req.query.apiKey).then(data=>{
      res.status(200).json({"success":true, "data":data});
  }).catch(err=>{
      logger.fatal(err);
      return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  });
}



module.exports = {
  userLogin,
  addUser,
  validatePassCode
};