const express = require("express");
const mongoose = require('mongoose');
const ejs = require("ejs");
const bodyParser = require("body-parser");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/bharatInternProjectManagementDB');

}

let userIdSession = null;
let userPasswordSession = null;


const projectSchema = new mongoose.Schema({

    projectName: String,
    projectDescription: String,
    projectMembers: {
        type: [String],  // userId's
        default: []
    },
    projectTasks: {
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
        default: []
    }

});

const taskSchema = new mongoose.Schema({

    taskTitle: String,
    taskDescription: String,
    taskSolution: String,
    assignedTo: String,    // userId here
    assignedBy: String,    // userId here
    project: String
});

const userSchema = new mongoose.Schema({

    userId: String,
    userPassword: String,
    Name: String,
    tasksAssigned: {
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
        default: []
    },
    tasksPosted: {
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
        default: []
    },
    joinedProjects: {
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Project'}],
        default: []
    }

});


const Project = new mongoose.model('Project', projectSchema);
const Task = new mongoose.model('Task', taskSchema);
const User = new mongoose.model('User', userSchema);



app.get('/', (req,res)=>{

    res.render('Home');
});


// User

//signUp

app.get('/signUp', (req,res)=>{

    res.render('signUp');
});

app.post('/signUp', (req,res)=>{

    const newUser = new User({

        userId: req.body.userId,
        userPassword: req.body.userPassword,
        Name: req.body.userName

    });

    newUser.save();

    userIdSession = req.body.userId;
    userPasswordSession = req.body.userPassword;    

    res.render('JoinedProjects',{data:newUser})
});




//login
app.post('/login', (req,res)=>{

    User.findOne({userId:req.body.userId, userPassword:req.body.userPassword}).then((data,err)=>{

        if(data){
            userIdSession = req.body.userId;
            userPasswordSession = req.body.userPassword;  

            res.render('JoinedProjects',{myProjects: data.Project})
        }else{
            res.redirect('/signup');
        }
    });
});

app.get('/login', (req,res)=>{

    res.render('login');
});

// logout

app.get('/logout', (req,res)=>{

    userIdSession = null;
    userPasswordSession = null;
    res.redirect('/');
});

//projects

app.get('/allProjects', (req,res)=>{

    Project.find().then((data,err)=>{

        if(!err){
            res.render('AllProjects',{allProjects: data});
        }
        console.log(err);
    });
});

app.get('/joinedProjects', (req,res)=>{

    if(userIdSession && userPasswordSession){
        User.findOne({userId: userIdSession}).then((data,err)=>{

            if(!err){
                res.render('JoinedProjects',{myProjects: data.joinedProjects})
            }
    
            console.log(err);
        });
    }



    res.redirect('/login');

});

app.get('/createProject', (req,res)=>{

    res.render('CreateProject');
});

app.post('/createProject', (req,res)=>{

    if(userIdSession==null && userPasswordSession==null){
        res.redirect('/login');
    }

    const newProject = new Project({

        projectName: req.body.projectName,
        projectDescription: req.body.projectDescription,
        projectMembers: [userIdSession]

    });

    newProject.save();

    joinedNewProject = [newProject];

    Project.updateOne({ userId: userIdSession, userPassword: userPasswordSession }, { joinedProjects: joinedNewProject }).then((data, err) => {

        if (err) {
            console.log(err);
        }else{
            console.log(data);
        }

    });

    res.redirect('/joinedNewProject');

});



app.listen(3000, () => {
    console.log("Server started on port 3000.");
})