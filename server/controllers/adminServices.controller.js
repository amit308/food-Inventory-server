const logger = require('../../config/logger');
const adminService = require('../service/adminServies');
const menuService = require('../service/menuServices');
const restaurantService = require('../service/restaurantServices')
const ownerService = require('../service/ownerServices')
const jwt = require('jsonwebtoken');

const addAdmin = (req, res) => {
		logger.info('Inside Add Admin Controller');
		
		let admin = req.body;
		
		adminService.addAdmin(admin).then(data => {
			res.json({success: true, msg: data});
		})
		.catch((err) => {
			logger.fatal(err);
			res.json({success: false, msg: err});
		})
}

const adminLogin = (req, res) => {
    logger.info('Inside Admin Login Controller')

    let admin = req.body;

    adminService.adminLogin(admin).then(adminData => {
		
        logger.info(adminData);
        
        let payLoad = {
            id: adminData._id,
            email: adminData.email,
        }

        let token = jwt.sign(payLoad, 'my_secret_key', { expiresIn: 60*60*24*30 });

        res.status(200).json({success: true, data: token});
    })
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	})
}

const addRestaurant = (req,res,next)=>{
    logger.trace("inside add restaurant profile controller");
    let restaurantProfile = req.body.restaurant;
   
    adminService.addRestaurant(restaurantProfile).then(restId=>{
		logger.info('After adding restuarnt....', restId);
		addOwner(req, res, restId);
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addOwner = (req,res,restId)=>{
  logger.trace("inside add owner profile controller");
  let ownerData = req.body.owner;
  
  adminService.addOwner(ownerData, restId).then(ownerId => {
		logger.info('After adding owner....', ownerId);
		updateRestaurantOwner(req, res, restId, ownerId);
    
  }).catch(err=>{
    logger.fatal(err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  });
}

const updateRestaurantOwner = (req, res, restaurant, owner) => {
	logger.trace("inside restaurant owner update controller restaurnat...", restaurant);
	logger.trace("inside restaurant owner update controller owner...", owner);
	
	adminService.updateRestaurantOwner(restaurant, owner).then(data => {
		res.status(200).json({"success":true, "message": data});
	}).catch(err => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	})
}

const getAllRestaurants = (req, res) => {
	
	adminService.getAllRestaurants().then(data => {
		
		res.status(200).json({success: true, restaurants: data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	})
	
}

const getOrderGraphs = (req, res) => {
	
	logger.info("Inside get order graphs controller", );
	
	adminService.getOrderGraphs(req.params.id).then(data => {
		
		res.status(200).json({success: true, graphData: data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
	
}

const getDaysGraphs = (req, res) => {
	
	logger.info("Inside get days graphs controller", );
	
	adminService.getDaysGraphs(req.params.id).then(data => {
		
		res.status(200).json({success: true, graphData: data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
	
}

const resetPassword =( req, res) => {
	logger.info('Inside reset password');

	let email = req.body.email;
	let pass = req.body.password;

	adminService.resetPassword(email, pass).then(data => {

		res.status (200).json({success: true, message: data});

	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestOwner = (req, res) => {
	logger.info("Inside get owners controller");
	adminService.getRestOwner(req.params.id).then(data => {

		res.status(200).json({success: true, owner: data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})

}

const getRestItems = (req, res) => {

	menuService.getItems(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestCategories = (req, res) => {
	menuService.getCategories(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestToppingGroup = (req, res) => {
	menuService.getToppingGroups(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestOption = (req, res) => {
	menuService.getOptions(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestTopping = (req, res) => {
	menuService.getToppings(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestItem = (req, res) => {

	let itemData = req.body;
	let restId = req.params.id;
	itemData.restaurantId = restId;

	menuService.addItem(itemData, restId).then(async data => {

		await menuService.updateSequenceCounter('items', req.payLoad.restaurantId, null);
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestItem = (req, res) => {
	let restId = req.params.id;
	let itemData = req.body;

	menuService.updateItem(restId, itemData).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestTopping = (req, res) => {

	let toppingData = req.body;
	let restId = req.params.id;
	toppingData.restaurantId = restId;

	menuService.addTopping([toppingData], restId).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestToppingGroup = (req, res) => {

	let toppingGroupData = req.body;
	let restId = req.params.id;
	toppingGroupData.restaurantId = restId;

	menuService.addToppingGroup(toppingGroupData, restId).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestOption = (req, res) => {

	let optionData = req.body;
	let restId = req.params.id;
	optionData.restaurantId = restId;

	menuService.addOption([optionData], restId).then( data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestCategory = (req, res) => {

	let categoryData = req.body;
	let restId = req.params.id;
	categoryData.restaurantId = restId;

	menuService.addCategory([categoryData], restId).then(async data => {

		await menuService.updateSequenceCounter('categories', restId, data.seq);
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestItem = (req, res) => {

	logger.info("Inside Rest Delete Category Controller" , req.params.id);
	menuService.deleteItem(req.params.id).then(async data => {

		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestCategory = (req, res) => {
	logger.info("Inside Rest Delete Category Controller" , req.params.id);
	menuService.deleteCategory(req.params.id).then(async data => {

		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestOption = (req, res) => {
	logger.info("Inside Rest Delete Option Controller" , req.params.id);
	menuService.deleteOption(req.params.id).then(async data => {

		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestTopping = (req, res) => {
	logger.info("Inside Rest Delete Topping Controller" , req.params.id);
	menuService.deleteTopping(req.params.id).then(async data => {

		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestToppingGroup = (req, res) => {
	logger.info("Inside Rest Delete Topping Group Controller" , req.params.id);
	menuService.deleteToppingGroup(req.params.id).then(async data => {

		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestCategory = (req, res) => {
	let restId = req.params.id;
	let categoryData = req.body;

	menuService.updateCategory(restId, categoryData).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestOption = (req, res) => {
	let restId = req.params.id;
	let optionData = req.body;

	menuService.updateOption(restId, optionData).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestTopping = (req, res) => {
	let restId = req.params.id;
	let toppingData = req.body;

	menuService.updateTopping(restId, toppingData).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestToppingGroup = (req, res) => {
	let restId = req.params.id;
	let toppingGroupData = req.body;

	menuService.updateToppingGroup(restId, toppingGroupData).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestAllergy = (req, res) => {

	let allergyData = req.body;
	let restId = req.params.id;
	allergyData.restaurantId = restId;

	menuService.addAllergy(allergyData).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestAllergy = (req, res) => {
	menuService.getAllergies(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestAllergy = (req, res) => {
	logger.info("Inside Rest Delete Allergy Controller" , req.params.id);
	menuService.deleteAllergy(req.params.id).then(async data => {

		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestAllergy = (req, res) => {
	let restId = req.params.id;
	let allergyData = req.body;

	menuService.updateTopping(restId, allergyData).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestAllergyGroup = (req, res) => {
	menuService.getAllergyGroups(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestAllergyGroup = (req, res) => {

	let allergyGroupData = req.body;
	let restId = req.params.id;
	allergyGroupData.restaurantId = restId;

	menuService.addAllergyGroup(allergyGroupData, restId).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestAllergyGroup = (req, res) => {
	logger.info("Inside Rest Delete Allergy Group Controller" , req.params.id);
	menuService.deleteAllergyGroup(req.params.id).then(async data => {

		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestAllergyGroup = (req, res) => {
	let restId = req.params.id;
	let allergyGroupData = req.body;

	menuService.updateAllergyGroup(restId, allergyGroupData).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const restSetting = (req, res) => {
	let restId = req.params.id;
	let settingDetails = req.body;

	restaurantService.restaurantSetting(restId, settingDetails).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const ownerEditProfile = (req, res) => {
	let restId = req.params.id;
	let restaurantDetails = req.body;

	ownerService.ownerEditProfile(restId, restaurantDetails).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestaurantDiscount = (req, res) => {
	let restId = req.params.id;
	let restaurantDiscount = req.body;

	restaurantService.updateRestaurantDiscount(restId, restaurantDiscount).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestaurantStatus = (req, res) => {
	let restId = req.params.id;
	let status = req.body.isOnline;

	restaurantService.updateRestaurantStatus(restId, status).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

module.exports = {
	addAdmin,
    adminLogin,
    addRestaurant,
	addOwner,
	updateRestaurantOwner,
	getAllRestaurants,
	getOrderGraphs,
	getDaysGraphs,
	resetPassword,
	getRestOwner,

	getRestItems,
	getRestCategories,
	getRestToppingGroup,
	getRestOption,
	getRestTopping,

	addRestItem,
	updateRestItem,
	addRestTopping,
	addRestToppingGroup,
	addRestOption,
	addRestCategory,

	deleteRestItem,
	deleteRestCategory,
	deleteRestOption,
	deleteRestTopping,
	deleteRestToppingGroup,

	updateRestCategory,
	updateRestOption,
	updateRestTopping,
	updateRestToppingGroup,

	addRestAllergy,
	getRestAllergy,
	deleteRestAllergy,
	updateRestAllergy,

	getRestAllergyGroup,
	addRestAllergyGroup,
	deleteRestAllergyGroup,
	updateRestAllergyGroup,

	restSetting,
	ownerEditProfile,
	updateRestaurantDiscount,
	updateRestaurantStatus
}