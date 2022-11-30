const logger = require('../../config/logger');
const models = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const isUserExist = (data)=>{
  logger.debug("inside is user exist");
  return new Promise(async (resolve,reject)=>{
    let condition = {
      email:data.email,
    }
    let userData = await models.user.findOne({attributes:['email'],where:condition});
    if(userData){
      resolve(true);
    }
    else{
      resolve(false);
    }
  });
}

const userLogin = (userCreds, res)=>{
  logger.trace("inside user login",{userCreds});
  return new Promise(async (resolve,reject)=>{
    try{
      let condition = {
        email:userCreds.email,
      }
      let userData = await models.user.findOne(condition,{_id:0,__v:0});
	  logger.trace("Data");
      logger.debug(userData);
      userData = JSON.parse(JSON.stringify(userData));
      if(userData){
        // if(userData.isActive){
        if(userCreds.loginMode === 'social')
        {
          logger.trace("Social Found")
          resolve(userData)	
        }
			
        else if(userData && bcrypt.compareSync(userCreds.password, userData.password)){
          delete userData.password;
          resolve(userData);
        }
        else{
          reject(new Error("Invalid Password"));
        }
      }
      else{
		 if(userCreds.loginMode === 'social')
		 { 
			logger.trace("inside addUser controller");
			  let userData = userCreds;
			  const salt = await bcrypt.genSaltSync(10);
			  const hashPassword = await bcrypt.hashSync(userData.password, salt);
			  userData.password = hashPassword;
			  logger.debug(userData);
			  addUser(userData).then(data=>{
				let payload = {
				  "email" : data.email,
				  "userId":data._id,
				}
			
				data.token =  jwt.sign(payload,'my_secret_key',{ expiresIn: 60*60*24*30 });
				delete data.password;
				return res.json({"success":true,"data":data});
			  }).catch(err=>{
				  logger.trace(err);
				return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
			  });
		 }
			
        else {
			reject(new Error("Invalid Email ID"));
		} 
			
      }
    }
    catch(err){
      logger.fatal(err);
    }
  });
};

const addUser = (userData)=>{
  return new Promise(async (resolve,reject)=>{
    try{
	  userData = await models.user.create(
			userData
		  );
		  userData = JSON.parse(JSON.stringify(userData));
		  logger.debug("added successfully",{userData});
		  resolve(userData);		  
    }
    catch(err){
      logger.fatal(err);
      if(err.code == 11000){
        let key = Object.keys(err.keyValue);
        key = err.keyValue[key[0]];
        return reject(new Error({ code:422, message: `${key} already exists` }));
      }
      reject({ code:401, message: err.message });   
    }
  });
};

const validatePassCode = (resPasscode, placeId_or_passcode, apiKey) =>{
  logger.debug("inside validate passcode",placeId_or_passcode, resPasscode);
  return new Promise(async (resolve,reject)=>{
    try {
		
    // For UK
    /* let googleURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?destinations=' 
                    + placeId_or_passcode + '&origins=' + resPasscode + '&mode=driving&key=' + apiKey; */

    // For GERMAN
    let googleURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?destinations=place_id:' 
                    + placeId_or_passcode + '&origins=place_id:' + resPasscode + '&mode=driving&key=' + apiKey;

		axios.get(googleURL).then((response) => 
			{
				logger.trace(response.data);
				resolve(response.data);
			})
			.catch((err) => {
				logger.trace(err);
				reject(err);
			})
    }
    catch (err) {
      logger.fatal(err);
      reject({ code:401, message: err.message });
    }
  })
}


module.exports = {
  userLogin,
  addUser,
  validatePassCode
};