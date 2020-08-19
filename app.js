require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app=express();

app.set('view engine', 'ejs');
mongoose.set('useFindAndModify', false);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://'+process.env.USERNAME_MONGODB+':'+process.env.PASSWORD+'@cluster0.kc503.mongodb.net/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });

//Tasks for the default list
const tasksSchema= {name: String};
const Task= mongoose.model("Task", tasksSchema);
const task1= new Task({name: "Welcome to your to do list"});
const task2= new Task({name: "Pres + to add a new task"});
const task3= new Task({name: "<-- press this to delete a task"});
const defaultTasks= [task1, task2, task3];

//Tasks for the dinamyc lists
const listSchema= {
    name: String,
    tasks: [tasksSchema]
};
const List= mongoose.model("List",listSchema);

app.get("/",function(req,res){

    Task.find({},function (err,tasks) {
        if (tasks.length===0) {
            Task.insertMany([task1, task2, task3],function (err,tasks) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(tasks);
                }
            })
            res.redirect("/");            
        } else {
            res.render('list', {listTitle: "Today", newTasks: tasks});
        }      
    });    
});

app.get("/:newList",function (req,res) {
    const listTitle=_.capitalize(req.params.newList);
    List.findOne({name:listTitle}, function (err,foundList) {
        if (!err) {
            if (!foundList) {
                const newList= new List({
                    name: listTitle, 
                    tasks: defaultTasks
                });
                newList.save();
                res.redirect("/"+listTitle);
            } else {
                res.render('list', {listTitle: listTitle, newTasks: foundList.tasks})
           }
        }
        else{
            console.log(Error);
        }
    })  
})

app.post("/",function(req,res){
    const newTask = new Task({name: req.body.newTask})
    const listTitle=req.body.list; 
    if (listTitle==="Today") {
        newTask.save();
        res.redirect("/");
    } else {
        List.findOne({name: listTitle},function (err,foundList) {
            foundList.tasks.push(newTask);
            foundList.save();
            res.redirect("/"+listTitle)
        })
    } 
})

app.post("/delete",function (req,res) {
    const listTitle=req.body.listTitle;
    const deleteTask=req.body.checked;
    if (listTitle==="Today") {
        Task.deleteOne({_id:deleteTask},function (err) {
            if(!err){
                console.log("Task deleted");
                res.redirect("/");
            } else{
                console.log(err);
            }
        })
    } else {
        List.findOneAndUpdate(
            {name: listTitle},
            {$pull:{tasks:{_id:deleteTask}}},
            function (err,foundList) {
                if (!err) {
                    res.redirect("/"+listTitle);
                }
        });
    } 
})

app.listen(process.env.PORT || 3000,function(){
    console.log("Server running in port 3000");
})