const ProviderApplication =
require("../models/ProviderApplication");


const User =
require("../models/User");


const Category =
require("../models/Category");


const {
sendEmail
}=require("../services/emailService");



// CUSTOMER APPLY


exports.applyProvider = async(req,res)=>{


try{


const userId=req.user.id;


const user =
await User.findById(userId);



if(!user)
{
return res.status(404).json({
success:false,
message:"User not found"
});
}



// same email check

if(user.email !== req.body.email)
{

return res.status(400).json({

success:false,

message:
"Please use login email"

});

}



// category ab multi-select hai, isliye array expect karenge

const categoryIds =
Array.isArray(req.body.category)

?
req.body.category

:
[req.body.category];



if(categoryIds.length===0 || !categoryIds[0])
{

return res.status(400).json({

success:false,

message:
"Please select at least one category"

});

}



const application =
await ProviderApplication.create({

user:user._id,

name:req.body.name,

email:req.body.email,

phone:req.body.phone,

category:categoryIds,

interestReason:req.body.interestReason


});



// email — ye alag try/catch mein hai taake email fail hone par
// bhi application submission successful count ho

try{

await sendEmail(

user.email,

"Provider Application Submitted",

`

<h2>Hello ${user.name}</h2>

<p>Your application has been submitted.</p>

<p>Status:
<b>Pending</b>
</p>

`

);

}
catch(emailError){

console.error(
"Email sending failed:",
emailError.message
);

// email fail hui, lekin application create ho chuki hai
// isliye request ko fail nahi karenge

}



res.status(201).json({

success:true,

message:
"Application submitted",

data:application

});


}
catch(error)
{

res.status(500).json({

success:false,

message:error.message

});


}


};





// ADMIN GET ALL


exports.getApplications =
async(req,res)=>{


const applications =
await ProviderApplication.find()

.populate("user","name email")

.populate("category","name")

.sort("-createdAt");



res.json({

success:true,

data:applications

});


};





// ADMIN STATUS UPDATE


exports.updateStatus =
async(req,res)=>{


try{


const application =
await ProviderApplication.findById(
req.params.id
);



if(!application)
{
return res.status(404).json({

success:false,

message:"Application not found"

});
}



application.status=req.body.status;


await application.save();



let subject="";
let message="";



if(req.body.status==="approved")
{

subject="Provider Application Approved";

message=`

<h2>Congratulations ${application.name}</h2>

<p>Your service provider application has been
<b>approved</b>.</p>

<p>You can now start offering your services on the platform.</p>

`;

}

else if(
req.body.status==="rejected"
)
{

subject="Provider Application Rejected";

message=`

<h2>Hello ${application.name}</h2>

<p>We regret to inform you that your service provider
application has been <b>rejected</b>.</p>

<p>If you believe this is a mistake, please contact support.</p>

`;

}

else
{

subject="Provider Application Status Updated";

message=`

<h2>Hello ${application.name}</h2>

<p>Your application status has been updated to:
<b>${req.body.status}</b></p>

`;

}



// email — status change hui to applicant ko notify karo
// email fail hone par bhi status update fail nahi hona chahiye

try{

await sendEmail(

application.email,

subject,

message

);

}
catch(emailError){

console.error(
"Email sending failed:",
emailError.message
);

}



res.json({

success:true,

message:
"Status updated",

data:application

});


}
catch(error)
{

res.status(500).json({

success:false,

message:error.message

});

}


};





// ADMIN DELETE APPLICATION


exports.deleteApplication =
async(req,res)=>{


try{


const application =
await ProviderApplication.findById(
req.params.id
);



if(!application)
{
return res.status(404).json({

success:false,

message:"Application not found"

});
}



await application.deleteOne();



res.json({

success:true,

message:"Application deleted"

});


}
catch(error)
{

res.status(500).json({

success:false,

message:error.message

});

}


};