const logger = require('../../config/logger');
const restaurantService = require('../service/restaurantServices');
const { scheduleItems, deleteScheduledTasks } = require('../scheduler/itemsScheduler');
const { scheduleTasks, deleteTimeSlotScheduledTasks} = require('../scheduler/resStatusScheduler');
const fs = require("fs");
const moment = require('moment');
const menuService = require('../service/menuServices');

const addRestaurantProfile = (req,res,next)=>{
    logger.trace("inside add restaurant profile controller");
    let restaurantProfile = req.body;
    if(!req.payLoad.userType){
        return res.status(404).json({"success":false,"message": "page not found"})
    }
    restaurantProfile.ownerId = req.payLoad.userId;
    restaurantService.addRestaurantProfile(restaurantProfile).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getRestaurantProfile = (req,res,next)=>{
    logger.trace("inside get restaurant profile controller");
    restaurantService.getRestaurantProfile(req.params.id).then(data=>{
          
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateRestaurantStatus = (req,res,next)=>{
    let status = parseInt(req.params.status);
    logger.trace("inside update restaurant status controller",status);
    restaurantService.updateRestaurantStatus(req.payLoad.userId, status).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateRestaurantDiscount = (req,res,next)=>{
    let deliveryDiscount = parseInt(req.body.deliveryDiscount);
    let collectionDiscount = parseInt(req.body.collectionDiscount);

    let discount = {
        deliveryDiscount: deliveryDiscount,
        collectionDiscount: collectionDiscount
    }

    logger.trace("inside update restaurant discount controller",discount);
    restaurantService.updateRestaurantDiscount(req.payLoad.userId, discount).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateRestaurantPasscode = (req,res,next)=>{
    let passcode = req.body.passcode
    logger.trace("inside update restaurant passcode controller",passcode);
    restaurantService.updateRestaurantPasscode(passcode).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addRestaurantImage = (req,res,next)=>{
    logger.trace("inside update restaurant image controller",req.body.option);

    let option = req.body.option;
    let restaurantId = req.payLoad.restaurantId;
    if(!option){
        return res.status(err.code?err.code:404).json({"success":false,"message":"select an option ICON or COVER"});
    }

    restaurantService.addRestaurantImage(req).then(async (data)=>{
        
        let imageType = (option == "COVER") ? "COVER" : "ICON";
        const fileName = imageType + restaurantId;

        gridFs.files.findOne({filename: fileName},((error, file) => {
            // Fetch image from GridFS Storage
            if (file.contentType == 'image/jpeg' || file.contentType == 'image/png' || file.contentType == 'image/jpg') {
                const readStream = gridFs.createReadStream(file.filename);
                const bufs = [];

                readStream.on('data', (chunk) => {
                    bufs.push(chunk);
                })

                readStream.on('end', () => {
                    const fbuf = Buffer.concat(bufs);
                    const base64Img = fbuf.toString('base64');

                    imageResponse = {status: "OK", imageType: imageType, imageData: base64Img};
					io.sockets.in(req.payLoad.restaurantId).emit('onImageChange', imageResponse);
                });
              
            }
        }));
        
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

//Settings Menu (Flutter App)
const restaurantSetting = (req,res,next)=>{
    let restaurantDetails = req.body;
    logger.trace("inside update restaurant setting controller",restaurantDetails);
    restaurantService.restaurantSetting(req.payLoad.userId, restaurantDetails).then(async (data)=>{
		
        io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const downloadRestaurantImage = (req,res,next)=>{
    let option = req.query.option;
    let restaurantId = req.query.id;
    if(!option){
        return res.status(err.code?err.code:404).json({"success":false,"message":"select an option ICON or COVER"});
    }
    logger.trace("inside download restaurant image controller", req.query);
    restaurantService.downloadRestaurantImage(restaurantId, option).then(data=>{
        let imageType = (option == "COVER") ? "COVER" : "ICON";
        let imgFile;

        const fileName = imageType + restaurantId;
        gridFs.files.findOne({filename: fileName},((error, file) => {
            // If image not found in GridFS Storage use servers default
            if (error || !file) 
            {
                let tempFile = (imageType == "COVER") ? "cover.png" : "logo.png";
                imgFile = __dirname + "/../../server/images/"+ tempFile; 
                fs.readFile(imgFile, (err, data) => {
                    if(data) {
                        return res.status(200).download(imgFile);
                    }
                });
            }
            // Fetch image from GridFS Storage
            else if (file.contentType == 'image/jpeg' || file.contentType == 'image/png' || file.contentType == 'image/jpg') {
                const readStream = gridFs.createReadStream(file.filename);
                return readStream.pipe(res);
            } 
            else {
              res.json('File Not Found');
            }
        }));
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getRestaurantImage = (req,res,next)=>{
    let option = req.query.option;
    let restaurantId = req.query.id;
    if(!option){
        return res.status(err.code?err.code:404).json({"success":false,"message":"select an option ICON or COVER"});
    }

    logger.trace("inside get restaurant image controller", req.query);
    restaurantService.downloadRestaurantImage(restaurantId, option).then(async data=>{
        let imageType = (option == "COVER") ? "COVER" : "ICON";
        let imgFile;

        const fileName = imageType + restaurantId;
        gridFs.files.findOne({filename: fileName},((error, file) => {
            // If image not found in GridFS Storage use servers default
            if (error || !file) 
            {
                let tempFile = (imageType == "COVER") ? "cover.png" : "logo.png";
                imgFile = __dirname + "/../../server/images/"+ tempFile; 
                fs.readFile(imgFile, (err, data) => {
                    if(data) {
                        return res.json({status: "OK", imageData: data.toString('base64')});
                    }
                });
            }
            // Fetch image from GridFS Storage
            else if (file.contentType == 'image/jpeg' || file.contentType == 'image/png' || file.contentType == 'image/jpg') 
            {
                const readStream = gridFs.createReadStream(file.filename);
                const bufs = [];

                readStream.on('data', (chunk) => {
                    bufs.push(chunk);
                })

                readStream.on('end', () => {
                    const fbuf = Buffer.concat(bufs);
                    const base64Img = fbuf.toString('base64');
                    return res.json({status: "OK", imageData: base64Img});
                  });
              
            } 
            else {
              res.json('File Not Found');
            }
        }));
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

//COntrollers for items or categories Time Slots
const getTimeZones = (req, res) => {

    let id; 

    // Get restaurant Id from query for Frontend and Token for APK
    if(req.query.restId) {
        id = req.query.restId;
    }
    else {
        id = req.payLoad.restaurantId;
    }

    restaurantService.getTimeZones(id).then(data => {

        return res.json({success: true, timeZones: data});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(404).json({success: false, message: err.message});
    })
}

const addTimeZone = (req, res) => {
    logger.trace("inside add time zone controller");

    let zoneData = req.body;
    logger.trace('timeZone request data.......', zoneData);

    restaurantService.addTimeZone(zoneData).then(data => {

        logger.trace('...scheduling times for...', zoneData.zoneGroup);

        let openTime, closeTime, currTime, currDay;
    
        openTime = moment(zoneData.startTime, "HH:mm");
        closeTime = moment(zoneData.endTime, "HH:mm");
        currTime = moment();
        currDay = moment().format('dddd');

        //Time checking condition with Server Time
        if(currTime.isBetween(openTime, closeTime) && zoneData.days.includes(currDay)) {
        
            restaurantService.updateItemsStatus(zoneData, true).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));      
            })
        }
        else
        {
            restaurantService.updateItemsStatus(zoneData, false).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));      
            })
        }

        scheduleItems(zoneData, data[0]._id);

        return res.status(200).json({success: true, message: "Time Zone Created successfully..."});

    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })
}

const updateTimeZone = (req, res) => {
    logger.info("inside update time zone controller....");

    let zoneData = req.body;
    logger.info('timeZone request data....', zoneData);

    restaurantService.updateTimeZone(zoneData.id, zoneData).then(data => {
        logger.info(data);
        logger.info('Scheduling updated time zones....');

        let openTime, closeTime, currTime, currDay;
    
        openTime = moment(zoneData.startTime, "HH:mm");
        closeTime = moment(zoneData.endTime, "HH:mm");
        currTime = moment(moment().format("HH:mm"), "HH:mm");
        currDay = moment().format('dddd');

        //Time checking condition with Server Time
        if(currTime.isSame(openTime) && zoneData.days.includes(currDay)) {
        
            restaurantService.updateItemsStatus(zoneData, true).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));      
            })
        }
        else
        {
            restaurantService.updateItemsStatus(zoneData, false).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));      
            })
        }

        scheduleItems(zoneData, zoneData.id);

        return res.status(200).json({success: true, message: data});

    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })

}

const updateTimeZoneStatus = (req, res) => {
    logger.info("inside update status time zone controller....");

    let zoneData = req.body;
    logger.trace('timeZone request data.....', zoneData);

    restaurantService.updateTimeZoneStatus(zoneData.id, zoneData.isActive).then(data => {
         
        logger.info('...updating time zone status...');

        logger.info(data);

        let openTime, closeTime, currTime, currDay, zone = data.zone;
    
        openTime = moment(zone.startTime, "HH:mm");
        closeTime = moment(zone.endTime, "HH:mm");
        currTime = moment(moment().format("HH:mm"), "HH:mm");
        currDay = moment().format('dddd');

        //Time checking condition with Server Time
        if(currTime.isSame(openTime) && zone.days.includes(currDay)) {
            logger.info('Time is same...');
            restaurantService.updateItemsStatus(zone, true).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));      
            })
        }
        else
        {
            logger.info('Time is not same...');
            restaurantService.updateItemsStatus(zone, false).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));      
            })
        }

        if(zoneData.isActive == 'true') {
            scheduleItems(zone, zoneData.id);
        }
        else {
            deleteScheduledTasks(zone);
        }

        return res.status(200).json({success: true, message: data.msg});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })
    

}

const deleteTimeZone = (req, res) => {
    logger.info("inside delete time zone controller....");

    let zoneData = req.body;
    logger.trace('timeZone request data.....', zoneData);

    restaurantService.deleteTimeZone(zoneData, req.payLoad.restaurantId).then(data => {

        logger.info('....deleting schelued tasks...');
        
        deleteScheduledTasks(data.zone);

        return res.status(200).json({success: true, message: data.msg});
        
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })

}

//Controllers for Restuarant Opening and Closing Time Slots
const getTimeSlots = (req, res) => {
    
    let id = req.payLoad.restaurantId;

    restaurantService.getTimeSlots(id).then(data => {

        return res.json({success: true, timeSlots: data});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(404).json({success: false, message: err.message});
    })
}

const addTimeSlot = (req, res) => {
    
    let timeSlot = req.body;

    logger.info('inside add time slots controller...', timeSlot);

    restaurantService.addTimeSlot(timeSlot, req.payLoad.restaurantId).then(data => {

        let currTime, openTime, closeTime, currDay, isPrevSlotActive = false, existingSlots = data.existingSlots;
        let exOpenTime, exCloseTime;

        openTime = moment(timeSlot.openTime, "HH:mm");
        closeTime = moment(timeSlot.closeTime, "HH:mm");
        currTime = moment();
        currDay = moment().format('dddd');

        /* if(existingSlots)
        {
            logger.info('inside exitsing slots condition check...', existingSlots);

            for(i = 0; i < existingSlots.length; i++)
            {
                exOpenTime = moment(existingSlots[i].openTime, "HH:mm");
                exCloseTime = moment(existingSlots[i].closeTime, "HH:mm");

                if(moment().isBetween(exOpenTime, exCloseTime) && existingSlots[i].days.includes(currDay) && existingSlots[i].isActive) 
                {
                    isPrevSlotActive = true;
                    break;
                }
            }
        } */

        //Time checking condition with Server Time
        if((currTime.isBetween(openTime, closeTime) && timeSlot.days.includes(currDay))) {
            restaurantService.updateRestaurantStatus(req.payLoad.userId, true).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
            })

            // Extra check for Holidays
            if(timeSlot.holidayDates.includes(currDate)) 
			{
				restaurantService.updateRestaurantStatus(req.payLoad.userId, false).then(async (data) => {
                    io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
                });
			} 
        }
        else
        {
            restaurantService.updateRestaurantStatus(req.payLoad.userId, false).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
            })
        }

        scheduleTasks(data.slotId[0]._id, timeSlot);

        return res.status(200).json({success: true, message: "Time Slot Created successfully..."});

    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })

}

const updateTimeSlot = (req, res) => {

    let timeSlot = req.body;

    logger.info('inside update time slots controller...', timeSlot);

    restaurantService.updateTimeSlot(timeSlot.id, timeSlot).then(async data => {

        let currTime, openTime, closeTime, currDay, currDate, isPrevSlotActive = false, existingSlots = data;
        let exOpenTime, exCloseTime;

        openTime = moment(timeSlot.openTime, "HH:mm"); 
        closeTime = moment(timeSlot.closeTime, "HH:mm"); 
        currTime = moment(); 
        currDay = moment().format('dddd');
        currDate = moment().format('DD/MM/YYYY');
				
        /* if(existingSlots) // leave for now...
        {
            logger.info('inside exitsing slots condition check...', existingSlots);

            for(i = 0; i < existingSlots.length; i++)
            {
                exOpenTime = moment(existingSlots[i].openTime, "HH:mm");
                exCloseTime = moment(existingSlots[i].closeTime, "HH:mm");

                if(!exOpenTime.isSame(openTime) && !exCloseTime.isSame(closeTime))
                {
                    if(moment().isBetween(exOpenTime, exCloseTime) && existingSlots[i].days.includes(currDay)) 
                    {
                        isPrevSlotActive = true;
                        break;
                    }
                }
            }
        } */

        // Condition Check with server time 
        if(currTime.isBetween(openTime, closeTime) && timeSlot.days.includes(currDay)) 
        {
            restaurantService.updateRestaurantStatus(req.payLoad.userId, true).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
            });

            // Extra check for Holidays
            if(timeSlot.holidayDates.includes(currDate)) 
			{
				restaurantService.updateRestaurantStatus(req.payLoad.userId, false).then(async (data) => {
                    io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
                });
			} 

        }
        else
        {
            restaurantService.updateRestaurantStatus(req.payLoad.userId, false).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
            })
        }

        scheduleTasks(timeSlot.id, timeSlot);

        return res.status(200).json({success: true, message: "Time Slot updated successfully..."});

    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })

}

const updateTimeSlotStatus = (req, res) => {
    logger.info("inside update status time slot controller....");

    let timeSlot = req.body;
    logger.trace('time slot request data.....', timeSlot);

    restaurantService.updateTimeSlotStatus(timeSlot.id, timeSlot.isActive, req.payLoad.restaurantId).then(async (data) => {
        
        logger.info('...updating time slot status...');

        
        let currTime, openTime, closeTime, currDay, isPrevSlotActive = false, existingSlots = data.slots;
        let exOpenTime, exCloseTime; updatedSlot = data.updatedSlot;

        openTime = moment(updatedSlot.openTime, "HH:mm");
        closeTime = moment(updatedSlot.closeTime, "HH:mm");
        currTime = moment();
        currDay = moment().format('dddd');

        /* if(existingSlots)
        {
            logger.info('inside exitsing slots condition check...', existingSlots);

            for(i = 0; i < existingSlots.length; i++)
            {
                exOpenTime = moment(existingSlots[i].openTime, "HH:mm");
                exCloseTime = moment(existingSlots[i].closeTime, "HH:mm");

                if(!exOpenTime.isSame(openTime) && !exCloseTime.isSame(closeTime))
                {
                    if(moment().isBetween(exOpenTime, exCloseTime) && existingSlots[i].days.includes(currDay)) 
                    {
                        isPrevSlotActive = true;
                        break;
                    }
                }
            }
        } */

        //Time checking condition with Server Time
        if(timeSlot.isActive == 'true')
        {
            // If current time is Between previous Active Slots
            /* if(isPrevSlotActive)
            {
                restaurantService.updateRestaurantStatus(req.payLoad.userId, true).then(async (data) => {
                    io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
                });
            } */
            // If current time is Between current slot in which status needs to be updated
            if((currTime.isBetween(openTime, closeTime) && updatedSlot.days.includes(currDay))) 
            {    
                restaurantService.updateRestaurantStatus(req.payLoad.userId, true).then(async (data) => {
                    io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
                });
            }
            else
            {
                restaurantService.updateRestaurantStatus(req.payLoad.userId, false).then(async (data) => {
                    io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
                });
            }

            scheduleTasks(updatedSlot.id, updatedSlot);
        }
        else 
        {
            if((currTime.isBetween(openTime, closeTime) && updatedSlot.days.includes(currDay))) 
            {    
                //let times = isPrevSlotActive ? {openTime: exOpenTime.format("HH:mm"), closeTime: exCloseTime.format("HH:mm")} : updatedSlot;

                restaurantService.updateRestaurantStatus(req.payLoad.userId, false).then(async (data) => {
                    io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
                })
            }
            else {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));
            }

            deleteTimeSlotScheduledTasks(updatedSlot);
        }

        return res.status(200).json({success: true, message: data.msg});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })
}

const deleteTimeSlot = (req, res) => {
    logger.info("inside delete time slot controller....");

    let timeSlot = req.body;
    logger.trace('time slot request data.....', timeSlot);

    restaurantService.deleteTimeSlot(timeSlot.id, req.payLoad.restaurantId).then(data => {

        let currTime, openTime, closeTime, currDay, isPrevSlotActive = false, existingSlots = data.slots;
        let exOpenTime, exCloseTime; deletedSlot = data.deletedSlot;

        openTime = moment(deletedSlot.openTime, "HH:mm");
        closeTime = moment(deletedSlot.closeTime, "HH:mm");
        currTime = moment();
        currDay = moment().format('dddd');

        if(existingSlots)
        {
            logger.info('inside exitsing slots condition check...', existingSlots);

            for(i = 0; i < existingSlots.length; i++)
            {
                exOpenTime = moment(existingSlots[i].openTime, "HH:mm");
                exCloseTime = moment(existingSlots[i].closeTime, "HH:mm");

                if(moment().isBetween(exOpenTime, exCloseTime) && existingSlots[i].days.includes(currDay) && existingSlots[i].isActive) 
                {
                    isPrevSlotActive = true;
                    break;
                }
            }
        }
        
        if((currTime.isBetween(openTime, closeTime) && deletedSlot.days.includes(currDay)) || isPrevSlotActive) 
        {    
            let times = isPrevSlotActive ? {openTime: exOpenTime.format("HH:mm"), closeTime: exCloseTime.format("HH:mm")} : deletedSlot;

            restaurantService.updateRestaurantStatus(req.payLoad.userId, true, times).then(async (data) => {
                io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));      
            })
        }

        deleteTimeSlotScheduledTasks(deletedSlot);

        return res.status(200).json({success: true, message: data.msg});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })

}

const addRestDistance  = (req,res,next)=>{
    
    let distanceData = req.body;
    let restId = req.payLoad.restaurantId;

    logger.trace("inside update restaurant distance controller");
    restaurantService.addRestDistance(distanceData, restId).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateRestDistance = (req, res, next) => {
    let distanceData = req.body;
    let restId = req.payLoad.restaurantId;
    logger.trace("inside update restaurant distance controller....", distanceData);

    restaurantService.getRestDistance(restId).then(async (distDetails)=>{

        for(let i = 0; i < distDetails.length; i++) {
            if(distanceData.id == distDetails[i].id) {
                distDetails[i] = distanceData;
            }
        }

        restaurantService.updateRestDistance(distDetails, restId).then(async (data) => {
            io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));
            res.status(200).json({"success":true, "data":data});
        })
        .catch(err => {
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});    
        })
        
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteRestDistance = (req, res, next) => {
    let distanceData = req.body;
    let restId = req.payLoad.restaurantId;
    logger.trace("inside delete restaurant distance controller....", distanceData);

    restaurantService.getRestDistance(restId).then(async (distDetails)=>{

        for(let i = 0; i < distDetails.length; i++) {
            if(distanceData.id == distDetails[i].id) {
                distDetails.splice(i,1);
            }
        }

        restaurantService.updateRestDistance(distDetails, restId).then(async (data) => {
            io.sockets.in(req.payLoad.restaurantId).emit('refreshProfile', await restaurantService.getRestaurantProfile(req.payLoad.restaurantId));
            res.status(200).json({"success":true, "data":"Deleted successfully"});
        })
        .catch(err => {
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});    
        })
        
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}
    

module.exports = {
    addRestaurantProfile,
    getRestaurantProfile,
    updateRestaurantStatus,
    updateRestaurantDiscount,
    updateRestaurantPasscode,
    addRestaurantImage,
    downloadRestaurantImage,
	getRestaurantImage,
    restaurantSetting,
    getTimeZones,
    addTimeZone,
    updateTimeZone,
    updateTimeZoneStatus,
    deleteTimeZone,
    getTimeSlots,
    addTimeSlot,
    updateTimeSlot,
    updateTimeSlotStatus,
    deleteTimeSlot,
    addRestDistance,
    updateRestDistance,
    deleteRestDistance
}