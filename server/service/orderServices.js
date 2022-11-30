const logger = require('../../config/logger');
const models = require('../../models');
const mongoose = require('mongoose');
const moment = require('moment');

const getOrderNumber = (id) =>{
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get order number service");
            let lastOrder = await models.order.findOne(
                {restaurantId: id},
                {
                    orderNumber:1
                }
            ).limit(1).sort({$natural:-1});
            logger.debug(lastOrder);
            let uniqueLastDigit = "001";
            let currentDate = new Date();
            let currentMonth = currentDate.getMonth()+1;
			let date = currentDate.getDate();
			let currentTime = currentDate.getHours()+""+currentDate.getMinutes()+""+currentDate.getSeconds()+""+currentDate.getMilliseconds();
            currentMonth = (currentMonth > 9)?(currentMonth.toString()):("0"+(currentMonth.toString()));
			date = (date > 9)?(date.toString()):("0"+(date.toString()));
            let currentYear = currentDate.getFullYear().toString();
            let newUniqueOrderNo = currentYear+currentMonth+date+currentTime+uniqueLastDigit;
            if(lastOrder){
                let lastOrderNo = lastOrder.orderNumber;
                let lastMonth = lastOrderNo.slice(4,6);
                if(currentMonth == lastMonth){
                    uniqueLastDigit = ("000" + (parseInt(lastOrderNo.slice(-3))+1).toString()).slice(-3);
                }
                newUniqueOrderNo = currentYear+currentMonth+date+currentTime+uniqueLastDigit;
                logger.debug(currentDate,currentMonth,currentYear,currentTime,{uniqueLastDigit,lastMonth,newUniqueOrderNo})
            }
            resolve(newUniqueOrderNo);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const validateItems = (itemDetails) =>{
    return new Promise(async (resolve, reject) => {
        try {
            let itemIds = {};
            await itemDetails.forEach(item=>{
                itemIds[item._id] = 1;
            })
            logger.debug({itemIds});
            itemIds = Object.keys(itemIds);
            let foundItems = await models.item.find({ _id:itemIds});
            if(foundItems.length != itemIds.length){
                reject({ code:422, message: "invalid item found" });
            }
            resolve();
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}


const addOrder = (orderDetails,userDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add order service",{orderDetails,userDetails});
            var flag = 0;
            var owner = await models.owner.findOne(
                        {restaurantId: orderDetails.restaurantId},
                        {email: 1, _id: 0});
			
			if(orderDetails.deliveryType == 'DELIVERY') 
			{
				await models.user.findOneAndUpdate({email: userDetails.email}, 
				{$set: {address: orderDetails.address, contact: orderDetails.contact, postcode: orderDetails.postcode}},
				{ projection: {_id:0,__v:0,password:0}});
			}
			else
			{
				await models.user.findOneAndUpdate({email: userDetails.email}, 
				{$set: {contact: orderDetails.contact}},
				{ projection: {_id:0,__v:0,password:0}});
			}
			
            let allObj = await Promise.all([
                getOrderNumber(orderDetails.restaurantId),
                models.user.findOne({email:userDetails.email},{_id:0,__v:0,password:0}),
                validateItems(orderDetails.itemDetails),
                models.order.startSession()
            ]);
            logger.debug(allObj);
            orderDetails.orderNumber = allObj[0];
            orderDetails.userDetails = allObj[1];
			orderDetails.orderDateTime = moment().format('MM/DD/YYYY hh:mm:ss A');
            orderDetails.createdOn = new Date().toLocaleString('en-US', { timeZone: 'Europe/London' });
            var session = allObj[allObj.length - 1];
            await session.startTransaction();
            flag = 1;
            let order = await models.order.insertMany([orderDetails],{ session });
            await session.commitTransaction();
            // await session.abortTransaction();
			
            return resolve({msg: "Order added successfully...", owner: owner, orderId: order[0]._id});
        }
        catch (err) {
            logger.fatal(err);
            if(flag){
                await session.abortTransaction();
            }
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const getOrders = (condition = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get orders service");
            let orders = await models.order.aggregate([
                {$match:condition},
                {$sort:{_id:-1}}
            ]);
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getOrdersAnalysis = (condition = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get orders analysis service");
            let orders = await models.order.aggregate([
                {$match:condition},
                {
                    $group: { 
                        _id: {$dateToString: { format: "%Y-%m-%d", date: "$createdOn"} },
                        acceptedOrder: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$orderStatus", "ACCEPTED" ] }, 
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        declinedOrder: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$orderStatus", "DENIED" ] }, 
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        pendingOrder: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$orderStatus", "PENDING" ] }, 
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        orderRecieved:{$sum: 1},
                        onlineOrderAmount: {
                            $sum: {
                                "$cond": {
                                    "if": { $and : [ { "$eq": [ "$paymentMode", "online" ] },
                                            { "$eq": [ "$orderStatus", "ACCEPTED" ] },
                                        ] 
                                    },
                                    "then": {$sum: "$totalAmount"},
                                    "else": {}
                                }
                            }
                        },
                        cashOrderAmount: {
                            $sum: {
                                "$cond": {
                                    "if": { $and : [ { "$eq": [ "$paymentMode", "Barzahlung" ] }, //Switch to Barzahlung (GER) or Cash (UK)
                                            { "$eq": [ "$orderStatus", "ACCEPTED" ] },
                                        ]
                                    },
                                    "then": {$sum: "$totalAmount" },
                                    "else": {}
                                }
                            }
                        },
                        totalOrderAmount: { $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$orderStatus", "ACCEPTED" ] }, 
                                    "then": {$sum: "$totalAmount"},
                                    "else": {}
                                }
                            }
                        },
                    }
                },
            ]);
            defaultOrder = {
                "_id": 0,
                "acceptedOrder": 0,
                "declinedOrder": 0,
                "pendingOrder": 0,
                "orderRecieved": 0,
                "onlineOrderAmount": 0,
                "cashOrderAmount": 0,
                "totalOrderAmount": 0
            }
            orders = orders.length?orders:[defaultOrder];
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getOrderPerUser = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get orders per user service");
            let orders = await models.order.find(
                {
                    "userDetails.email":userEmail
                },
                {
                    __v:0
                }
            ).sort({"_id":-1});
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getOrder = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get order by id service");
            let order = await models.order.findOne(
                {_id},
                {
                    __v:0
                }
            );
            resolve(order);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateOrderStatus = (_id,orderStatus) =>{
    return new Promise(async (resolve, reject) => {
        logger.trace("inside update order status",{_id,orderStatus });
        try{
            let order = await models.order.findOneAndUpdate(
                {_id},
                {orderStatus},
                {returnOriginal: false}
            );
            resolve(order);
        }
        catch(err){
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

module.exports = {
    addOrder,
    getOrders,
    getOrder,
    getOrderPerUser,
    updateOrderStatus,
    getOrdersAnalysis
}