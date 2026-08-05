const express=require("express");

const router=express.Router();


const {

applyProvider,

getApplications,

updateStatus,

deleteApplication


}=require("../controllers/providerApplicationController");


const {
protect,
isAdmin
}=require("../middleware/authMiddleware");



// customer

router.post(
"/apply",
protect,
applyProvider
);



// admin

router.get(
"/admin",
protect,
isAdmin,
getApplications
);


router.put(
"/admin/:id/status",
protect,
isAdmin,
updateStatus
);


router.delete(
"/admin/:id",
protect,
isAdmin,
deleteApplication
);



module.exports=router;