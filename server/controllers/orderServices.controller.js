const logger = require('../../config/logger');
const orderService = require('../service/orderServices');
const models = require('../../models');
const mongoose = require('mongoose');
const { sendConfirmationEmail } = require('../helpers/mailer');

const addOrder = (req,res,next)=>{
    let orderDetails = req.body;
    let userDetails = req.payLoad;
    logger.trace("inside add order controller",orderDetails);
	
    orderService.addOrder(orderDetails,userDetails).then(data=>{
        		
        return res.status(200).json({"success":true, "data": data.msg, "ownerId": data.owner, "orderId": data.orderId});	
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getOrders = (req,res,next)=>{
    logger.trace("inside get orders controller");
    let condition = {};
	condition.restaurantId = req.payLoad.restaurantId;
    condition.createdOn = {
        $gte: new Date(new Date(req.query.date?req.query.date:Date.now()).setUTCHours(0, 0, 0, 0)), 
        $lt: new Date(new Date(req.query.date?req.query.date:Date.now()).setUTCHours(23, 59, 59, 999))
    }
    condition.orderStatus = {$in:['PENDING','ACCEPTED', 'DENIED']};
    
    if(req.query.orderStatus){
        condition.orderStatus=req.query.orderStatus.toUpperCase();
        /*if(condition.orderStatus == "DENIED" && !req.query.date){
            delete condition.createdOn;
        }*/
    }
    if(!req.payLoad.userType){
        orderService.getOrderPerUser(req.payLoad.email).then(data=>{
            return res.status(200).json({"success":true, "data":data});
        }).catch(err=>{
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    else{
        orderService.getOrders(condition).then(async data=>{
            delete condition.orderStatus;
            let summaryData = await orderService.getOrdersAnalysis(condition);
            res.status(200).json({"success":true, "data":data,"summaryData":summaryData[0]});
        }).catch(err=>{
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
}


const getOrder = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get order by id controller",{id});
    orderService.getOrder(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getOrderHistory = (req,res,next)=>{
    logger.trace("inside get order history controller");
    let condition = {};
    let startDate = new Date(new Date(req.query.startDate?req.query.date:Date.now()).setUTCHours(23, 59, 59, 999));
    let endDate = new Date(new Date(req.query.endDate?req.query.date:Date.now()).setUTCHours(0, 0, 0, 000));
    endDate = endDate.setDate(endDate.getDate() - 30);
    condition.createdOn = {
        $lt: startDate,
        $gte: new Date(endDate),
    }
    orderService.getOrdersAnalysis(condition).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateOrderStatus = (req,res,next)=>{
    let id = req.params.id;
    let orderStatus = req.body.orderStatus;
    
    if(req.payLoad.userType){
        orderService.updateOrderStatus(id,orderStatus).then(async (data)=>{

            io.sockets.in(id).emit('refreshOrder', await orderService.getOrder(id));
            //sendConfirmationEmail(data);
            res.status(200).json({"success":true, "data":data});
        }).catch(err=>{
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    else{
        return res.status(401).json({"success":false,"message":"only updated by admin user"});

    }
    
}

module.exports = {
    addOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    getOrderHistory
}