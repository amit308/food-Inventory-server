var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user = new Schema ({
    firstName: { type: String, required: [true,'firstName is required!!!']},
    lastName: { type: String, required: [true,'lastName is required!!!']},
    email: { 
        type: String,
        trim:true, 
        lowercase:true,
        required: [true,'email is required!!!'],
        index: { unique: true}
    },
    contact: { type: String},
    password:{ type: String, required: [true,'password is required!!!']},
    houseNumber: {type: String},
    street: {type: String},
    address:{ type: String},
    city:{ type: String},
    isDelete:{type:Boolean, default:false},
    postcode:{ type: String},
},
{
    timestamps: true
});

module.exports = mongoose.model('user', user);