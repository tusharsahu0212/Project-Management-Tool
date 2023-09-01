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

const taskSchema = new mongoose.Schema({

    taskTitle: String,
    taskDescription: String,
    taskSolution: String,
    assignedTo: String,    // userId here
    assignedBy: String,    // userId here
    project: String
});

const projectSchema = new mongoose.Schema({

    projectName: String,
    projectDescription: String,
    projectMembers: {
        type: [String],  // userId's
        default: []
    },
    projectTasks: {
        type: [taskSchema],
        default: []
    }

});


const userSchema = new mongoose.Schema({

    userId: String,
    userPassword: String,
    Name: String,
    tasksAssigned: {
        type: [taskSchema],
        default: []
    },
    tasksPosted: {
        type: [taskSchema],
        default: []
    },
    joinedProjects: {
        type: [projectSchema],
        default: []
    }

});

const Project = new mongoose.model('Project', projectSchema);
const Task = new mongoose.model('Task', taskSchema);
const User = new mongoose.model('User', userSchema);


//Home
app.get('/', (req, res) => {

    res.render('Home');
});


// User


//signUp

app.get('/signUp', (req, res) => {

    res.render('signUp');
});

app.post('/signUp', (req, res) => {

    User.findOne({ userId: req.body.userId }).then((data, err) => {

        if (data) {
            return res.render('login')
        } else {
            const newUser = new User({

                userId: req.body.userId,
                userPassword: req.body.userPassword,
                Name: req.body.userName

            });

            newUser.save();

            userIdSession = req.body.userId;
            userPasswordSession = req.body.userPassword;

            res.render('JoinedProjects', { myProjects: [] })
        }
    });

});




//login
app.post('/login', (req, res) => {

    User.findOne({ userId: req.body.userId, userPassword: req.body.userPassword }).then((data, err) => {

        if (data) {
            userIdSession = req.body.userId;
            userPasswordSession = req.body.userPassword;

            res.render('JoinedProjects', { myProjects: data.joinedProjects })
        } else {
            res.redirect('/signup');
        }
    });
});

app.get('/login', (req, res) => {

    res.render('login');
});

// logout

app.get('/logout', (req, res) => {

    userIdSession = null;
    userPasswordSession = null;
    res.redirect('/');
});

//projects

app.get('/allProjects', (req, res) => {


    Project.find().then((data, err) => {

        if (!err) {

            if (userIdSession) {

                res.render('AllProjects', { allProjects: data, user: userIdSession });
            } else {
                res.render('AllProjects', { allProjects: data, user: null });

            }
        }
        console.log(err);
    });
});

app.get('/joinedProjects', (req, res) => {

    if (userIdSession && userPasswordSession) {
        User.findOne({ userId: userIdSession }).then((data, err) => {

            if (!err) {
                return res.render('JoinedProjects', { myProjects: data.joinedProjects })
            }

            console.log(err);
        });
    } else {

        return res.redirect('/login');
    }

});

app.get('/joinTheProject', (req, res) => {

    if (userIdSession && userPasswordSession) {
        User.findOne({ userId: userIdSession }).then((user, err) => {

            if (!err) {

                Project.findOne({ _id: req.query.projectId }).then((project, err) => {
                    let previousMembers = project.projectMembers;
                    previousMembers.push(userIdSession);

                    Project.updateOne({ _id: req.query.projectId }, { projectMembers: previousMembers }).then((project, err) => {
                        if (err) {
                            console.log(err);
                        }
                    });

                    let previousProjects = user.joinedProjects;
                    // console.log("pre",previousProjects);
                    previousProjects.push(project);

                    User.updateOne({ userId: userIdSession }, { joinedProjects: previousProjects }).then((data, err) => {

                        if (err) {
                            console.log("err", err);
                        } else {
                            // console.log("data",user);
                        }

                    });
                });

                res.redirect('joinedProjects');
            }

            console.log(err);
        });
    } else {

        return res.redirect('/login');
    }

});

app.get('/projectRoom', (req, res) => {

    Project.findOne({ _id: req.query.projectId }).then((project, err) => {

        if (!err) {

            res.render('projectRoom', { projectData: project, user: userIdSession });

        } else {
            console.log(err);
        }
    });
});

app.get('/projectInfo', (req, res) => {

    Project.findOne({ _id: req.query.projectId }).then((project, err) => {

        if (!err) {

            res.render('projectInfo', { projectData: project });

        } else {
            console.log(err);
        }
    });
});

app.get('/projectMembers', (req, res) => {

    Project.findOne({ _id: req.query.projectId }).then((project, err) => {

        if (!err) {

            res.render('projectMembers', { projectData: project, user: userIdSession });

        } else {
            console.log(err);
        }
    });
});

app.get('/projectTasks', (req, res) => {


    Project.findOne({ _id: req.query.projectId }).then((project, err) => {

        if (project) {

            res.render('projectTasks', { projectData: project });

        } else {
            console.log(err);
        }
    });
});


app.get('/createProject', (req, res) => {

    if (userIdSession == null && userPasswordSession == null) {
        res.redirect('/login');
    }

    res.render('CreateProject');
});

app.post('/createProject', (req, res) => {



    const newProject = new Project({

        projectName: req.body.projectName,
        projectDescription: req.body.projectDescription,
        projectMembers: [userIdSession]

    });

    newProject.save();

    console.log(newProject);
    joinedNewProject = [newProject];


    User.findOne({ userId: userIdSession, userPassword: userPasswordSession }).then((data, err) => {

        if (err) {
            console.log("err", err);
        } else {
            // console.log("data",data);
            let previousProjects = data.joinedProjects;
            // console.log("pre",previousProjects);
            previousProjects.push(newProject);

            User.updateOne({ userId: userIdSession, userPassword: userPasswordSession }, { joinedProjects: previousProjects }).then((data, err) => {

                if (err) {
                    console.log("err", err);
                } else {
                    // console.log("data",data);
                }

            });

        }

    });



    res.redirect('/joinedProjects');

});

//Task 

app.get('/createTask', (req, res) => {
    // console.log(req.query)

    res.render('CreateTask', { taskToBeAssigned: req.query.memberId, projectName: req.query.projectName, projectId:req.query.projectId });
});

app.post('/assignTask', (req, res) => {

    // console.log(req.body)
    const newTask = new Task({

        taskTitle: req.body.taskTitle,
        taskDescription: req.body.taskDescription,
        taskSolution: null,
        assignedTo: req.body.taskToBeAssigned,
        assignedBy: userIdSession,
        project: req.body.projectName
    });

    newTask.save();

    Project.findOne({ _id: req.body.projectId }).then((project, err) => {
        if (!err) {
            // console.log(project);

            previousTasks = project.projectTasks;
            previousTasks.push(newTask);

            Project.updateOne({ _id: req.body.projectId }, { projectTasks: previousTasks }).then((data, err) => {

                if (err) {
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }

    });

    // update taskPosted of task sender
    User.findOne({ userId: userIdSession }).then((user, err) => {

        if(!err){
        previousTaskPosted = user.tasksPosted;
        previousTaskPosted.push(newTask);

        User.updateOne({ userId: userIdSession },{tasksPosted:previousTaskPosted}).then((user,err)=>{

            if(err){
                console.log(err);
            }
        });


        }else{
            console.log(err);
        }
    });

    //update tasksAssigned to task receiver
    User.findOne({ userId: req.body.taskToBeAssigned }).then((user, err) => {

        if(!err){
        previousTaskToBeAssigned = user.tasksAssigned;
        previousTaskToBeAssigned.push(newTask);

        User.updateOne({ userId: req.body.taskToBeAssigned },{tasksAssigned:previousTaskToBeAssigned}).then((user,err)=>{

            if(err){
                console.log(err);
            }
        });


        }else{
            console.log(err);
        }
    });

    res.redirect(`/projectTasks?projectId=${req.body.projectId}`);

});

app.get('/tasksAssignedByYou', (req, res) => {

    Project.findOne({ _id: req.query.projectId }).then((project, err) => {

        if (!err) {

            res.render('TasksAssignedByYou', { projectData: project, user: userIdSession });

        } else {
            console.log(err);
        }
    });
});

app.get('/tasksAssignedToYou', (req, res) => {

    Project.findOne({ _id: req.query.projectId }).then((project, err) => {

        if (!err) {

            res.render('TasksAssignedToYou', { projectData: project, user: userIdSession });

        } else {
            console.log(err);
        }
    });
});

app.get('/taskRoom', (req,res)=>{


    Project.findOne({_id: req.query.projectId}).then((project,err)=>{

        if(!err){

            Task.findOne({_id: req.query.taskId}).then((task,err)=>{
    
                if(!err){
        
                    if(req.query.submitFlag == 'true'){
        
                        res.render('TaskRoom',{task: task,projectData: project,submitFlag: true});
                    }else{
                        res.render('TaskRoom',{task: task,projectData: project,submitFlag: false});
        
                    }
        
                }else{
                    console.log(err);
                }
            });
        }else{
            console.log(err);
        }
    });

});

app.post('/taskSolution', (req,res)=>{
Project.findOne({_id: req.body.projectId}).then((data,err)=>{

    if(!err){
        Task.updateOne({_id: req.body.taskId},{taskSolution: req.body.taskSolution}).then((data,err)=>{

            if(err){
                console.log(err);
            }else{
                res.redirect(`taskRoom?taskId=${req.body.taskId}&projectId=${req.body.projectId}&submitFlag=${true}`);
            }
        });
    }else{
        console.log(err);

    }
});

});

app.listen(3000, () => {
    console.log("Server started on port 3000.");
});