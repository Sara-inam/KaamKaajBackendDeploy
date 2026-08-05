const mongoose = require("mongoose");


const providerApplicationSchema = new mongoose.Schema(
{
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true
    },

    phone:{
        type:String,
        required:true
    },


    // category ab multi-select hai, isliye array of ObjectId
    category:{
        type:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Category"
            }
        ],
        required:true,
        validate:{
            validator:function(value){
                return Array.isArray(value) && value.length > 0;
            },
            message:"At least one category is required"
        }
    },


    interestReason:{
        type:String,
        required:true
    },


    status:{
        type:String,
        enum:[
            "pending",
            "approved",
            "rejected"
        ],
        default:"pending"
    }


},
{
    timestamps:true
}
);


module.exports = mongoose.model(
"ProviderApplication",
providerApplicationSchema
);