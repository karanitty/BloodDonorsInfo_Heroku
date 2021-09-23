const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var app = new express();
const mongoose = require('mongoose');
const path = require('path');
// const bodyparser = require('body-parser');

mongoose.connect('mongodb+srv://userone:userone@fsd.vpxw6.mongodb.net/blooddonor?retryWrites=true&w=majority',
{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
})
.then((res)=>{
    console.log('MongoDB Connected');
},
err => {
    console.log('MongoDB not Connected');
});

// app.use(bodyparser.json());
// app.use(bodyparser.urlencoded({extended:false}));


app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.json());

//Model Declarations
const userData = require('./src/model/userData');
const donorData = require('./src/model/donorData');

// app.get('/',(req,res)=>{
//     res.send('backend successfull');
// });


//User SignUp begins here
app.post('/signup/user',async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    console.log(req.body);
    var newUser = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone
    }
    var item = userData(newUser);
    await item.save((err,doc)=>{
        if(!err){
            console.log("Success");
            res.send(doc);
        }
        else{
            if(err.code ==11000){
                console.log(err);
                res.status(422).send("Email address already exist");
            }
            else{
                console.log(err);
            }
        }
    });
});
//User SignUp ends here


//Admin & User Login Begins here
app.post('/login/admin',async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    console.log(req.body);
    var user = {
        name:req.body.name,
        password:req.body.password
    }

    if(user.name!='admin'){
        console.log('Failed at name verification');
        res.status(401).send('Invalid Username or Password');
    }
    else{
        if(user.password!='Admin@123'){
            console.log('Failed at password verification');
            res.status(401).send('Invalid Username or Password');
        }
        else{
            let payload = {subject:user.name+user.password};
            let token = jwt.sign(payload,'secretKey');
            let access = 'admin';
            console.log('Success');
            res.status(200).send({token,access});
        }
    }
});

// app.post('/login/user', async(req,res)=>{
//     res.header('Access-Control-Allow-Origin','*');
//     res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
//     console.log(req.body);
//     var user = {
//         email:req.body.email,
//         password:req.body.password
//     }

//     let userValidate = await userData.findOne({'email':user.email});
//     console.log(userValidate);

//     if(!userValidate){
//         console.log("Failed at email verification");
//         res.status(401).send("Invalid Email ID or Password");
//     }
//     else{
//         if(user.password != userValidate.password){
//             console.log('Failed at password verification');
//             res.status(401).send("Invalid Email ID or Password");
//         }
//         else{
//             let payload = {subject:userValidate.email+userValidate.password};
//             let token = jwt.sign(payload,'secretKey');
//             let access = userValidate.email;
//             console.log('Success');
//             res.status(200).send({token,access});
//         }
//     }
// });

app.post('/login/user', async(req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    console.log(req.body);
    var user = {
        email:req.body.email,
        password:req.body.password
    }

    let userValidate = await userData.findOne({'email':user.email});
    console.log(userValidate);

    if(!userValidate){
        console.log("Failed at email verification");
        res.status(401).send("Invalid Email ID or Password");
    }
    else{
        if(user.password != userValidate.password){
            console.log('Failed at password verification');
            res.status(401).send("Invalid Email ID or Password");
        }
        else{
            let payload = {subject:userValidate.email+userValidate.password};
            let token = jwt.sign(payload,'secretKey');
            let access = userValidate.email;
            console.log('Success');
            let donor = '';
            isDonor = await donorData.findOne({'email':userValidate.email});
            if(!isDonor){
                donor = 'no';
            }
            else{
                donor = 'yes';
            }
            res.status(200).send({token,access,donor});
        }
    }
});

//Admin & User Login ends here


//Token Verification
function verifyToken(req, res, next) {
    if(!req.headers.authorization) {
      return res.status(401).send('Unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1]
    if(token === 'null') {
      return res.status(401).send('Unauthorized request')    
    }
    let payload = jwt.verify(token, 'secretKey')
    if(!payload) {
      return res.status(401).send('Unauthorized request')    
    }
    req.userId = payload.subject;
    next();
}

//Donor Activities
//Getting Data from Database

app.get('/user/details/:email',verifyToken,async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    const email=req.params.email;
    console.log(email);
    await userData.findOne({'email':email})
    .then((user)=>{
        console.log(user);
        res.send(user);
    });
});

//Getting Donor Details from Database

app.get('/user/get_donors', verifyToken, async(req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    await donorData.find({'verified':true})
    .then(function(donors){
        console.log(donors);
        res.send(donors);
    });
});

app.get('/user/get_donor/:email',verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    email = req.params.email;
    console.log(email);
    await donorData.findOne({'email':email})
    .then((donor)=>{
        console.log(donor);
        res.send(donor);
    });
});

//Adding Donor to Database
app.post('/user/add_donor', verifyToken, (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var newdonor = {
        name:req.body.donor.name,
        email:req.body.donor.email,
        address:req.body.donor.address,
        district:req.body.donor.district,
        blood:req.body.donor.blood,
        phone:req.body.donor.phone,
        verified:false
    }
    console.log(newdonor);
    var item = new donorData(newdonor);
    item.save();
});

//Editing Donor Details
app.put('/user/edit_donor', verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var donor = {
        name:req.body.donor.name,
        email:req.body.donor.email,
        address:req.body.donor.address,
        district:req.body.donor.district,
        blood:req.body.donor.blood,
        phone:req.body.donor.phone,
        verified:true
    }
    console.log(donor);
    id = req.body.donor._id;
    await donorData.findByIdAndUpdate({'_id':id},
    {
        $set:{
            'address':donor.address,
            'district':donor.district,
            'blood':donor.blood
        }
    })
    .then(function(){
        res.send();
    });
});

//Deleting Donor Details
app.delete('/user/delete_donor/:email',verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    email = req.params.email;
    console.log(email);
    await donorData.findOneAndDelete({'email':email})
    .then(function(){
        console.log('Donor Deleted');
        res.send();
    });
});

//Checking Donor Status
// app.get('/user/not_donor/:email',(req,res)=>{
//     email = req.params.email;
//     console.log(email);
//     notDonor = donorData.findOne({'email':email});
//     if(!notDonor){
//         res.status(200).send(true);
//     }
//     else{
//         res.status(401).send(false);
//     }
// });

// app.get('/user/is_donor/:email',(req,res)=>{
//     email = req.params.email;
//     isDonor = donorData.findOne({'email':email,
//                                 'verified':true});
//     if(isDonor){
//         // res.status(200).send(true);
//         res.send(true);
//     }
//     else{
//         // res.status(401).send(false);
//         res.send(false);
//     }
// });

//Admin Activities
//Getting non-verified Donor Details from Database

app.get('/admin/get_donors_request', verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    await donorData.find({'verified':false})
    .then(function(donors){
        console.log(donors);
        res.send(donors);
    });
});

//Accepting Donor Request

app.put('/admin/accept_donors_request',verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    id=req.body._id;
    console.log(id);
    await donorData.findByIdAndUpdate({'_id':id},
    {
        $set:{
            'verified':true
        }
    })
    .then(function(){
        res.send();
    });
});

//Rejecting Donor Request

app.delete('/admin/reject_donors_request/:id',verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    id=req.params.id;
    console.log(id);
    await donorData.findByIdAndDelete({'_id':id})
    .then(function(){
        console.log('Donor Request Deleted');
        res.send();
    });
});

//Getting Donor Details from Database

app.get('/admin/get_donors',verifyToken, async(req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    await donorData.find({'verified':true})
    .then(function(donors){
        console.log(donors);
        res.send(donors);
    });
});

app.get('/admin/get_donor/:id',verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    id = req.params.id;
    console.log(id);
    donorData.findById({'_id':id})
    .then((donor)=>{
        console.log(donor);
        res.send(donor);
    });
});

//Editing Donor Details

app.put('/admin/edit_donor',verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var donor = {
        name:req.body.donor.name,
        email:req.body.donor.email,
        address:req.body.donor.address,
        district:req.body.donor.district,
        blood:req.body.donor.blood,
        phone:req.body.donor.phone,
        verified:true
    }
    console.log(donor);
    id = req.body.donor._id;
    await donorData.findByIdAndUpdate({'_id':id},
    {
        $set:{
            'address':donor.address,
            'district':donor.district,
            'blood':donor.blood
        }
    })
    .then(function(){
        res.send();
    });
});

//Deleting Donor Details
app.delete('/admin/delete_donor/:id',verifyToken, async (req,res)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var id = req.params.id;
    console.log(id);
    await donorData.findByIdAndDelete({'_id':id})
    .then(function(){
        console.log('Donor Deleted');
        res.send();
    });
});

app.use(express.static(path.join(__dirname,'FrontEnd')));
app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname,'FrontEnd/index.html'));
});

//Port Configuration

const port = process.env.PORT || 3000;

app.listen(port,()=>{
    console.log("Listening at port "+port);
});