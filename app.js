
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
var _=require("lodash");

// const PORT = process.env.PORT || 3007;
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect(process.env.ATLAS_URL,function(){
console.log("Connected");
});

const itemSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item",itemSchema); // creating a mongoose model for our list

const item1 = new Item({
  name:"Welcome to the version-2 of todolist!"
})
const item2 = new Item({
  name:"Hit the + button to add a new item."
})
const item3 = new Item({
  name:"<--Hit this to delete an item."
})
const defaultItems = [item1,item2,item3];


const listSchema = new mongoose.Schema({  // creating a collection for new lists
  name:String,
  itemss:[itemSchema]
});

const List = mongoose.model("List",listSchema); //creating a new collections for lists


app.get("/", function(req, res) {
  
  // const day = date.getDate();
  Item.find({},function(err,foundItems){   // find all the items in the collection 
    // console.log(foundItems);
    if(foundItems.length === 0){ 
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Succefully inserted the default items");
        }    /// adding default items to our list
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});  // display the found items
    }
  })  
});

app.get("/fullList", function(req, res){
  List.find({},function(err,foundLists){
    // console.log(foundLists)
    res.render("fullList",{
    newLists:foundLists
  });
});
});

app.get("/contact", function(req, res){
  res.render("contact");
});


app.get("/:custumName", function(req,res){
  const custumListName = _.capitalize(req.params.custumName); // giving name to the list entered
  
  List.findOne({name: custumListName},function(err,foundlist){ // find a list collection weather same list exists or not
    if(!err){
      if(!foundlist){
         // if doesn't exist then create a new list with that name 
        const list = new List({
          name: custumListName, // name of new list
          // itemss: defaultItems
        });
        list.save() // save that new list 
        res.redirect("/"+custumListName); //redirect the user to that newly saved list
      }
      else{
        // else redirect to that list
        res.render("list",{
          listTitle:foundlist.name, 
          newListItems: foundlist.itemss
        })
      }
    }
  })
})


app.post("/", function(req, res){
  
  const itemName = req.body.newItem;
  const listName = req.body.list;   // Adding new Items to our db

  const newItemdb = new Item({
    name:itemName
  });
 // we have have our root directory as today list but if we want to handle req to other lists 
  if(listName === "Today"){  // if listname is today then the item will be added to today 
          newItemdb.save();
          res.redirect("/");
      }
    
  
  else{

    List.findOne({name:listName},function(err,foundlist){ // else we will search the list that item has to added then add that
      if(!err){   
        if(foundlist){
          foundlist.itemss.push(newItemdb);
          foundlist.save();
          res.redirect("/"+listName);  // redirect to that list 
        }
      }
    });
  }
});

app.post("/new",function(req,res){
  const newList = req.body.newList;
  res.redirect("/"+newList);
})

app.post("/deleteList",function(req,res){
  const deletingList = req.body.deletingList;
  List.findByIdAndDelete(deletingList,function(err){
    if(!err){
      res.redirect("/fullList");
    }
  })
})

app.post("/delete",function(req,res){   // deleting that item that got clicked
  const checkedItemid =  req.body.check;  // item that got clicked
  const listName = req.body.listName;

  // console.log(req.body.check);

  if (listName === "Today"){  // if want ot delte  the item from today list 
    Item.findByIdAndRemove(checkedItemid, function(err){  // removing the item form collection
      if(!err){
        console.log("deleted");
        res.redirect("/");  // redirecting to root after checking to reflect changes
      }
    });  
  }

  else{                                    // pull that checked item array i.e that from that particular list
    List.findOneAndUpdate({name: listName},{$pull: {itemss: {_id: checkedItemid} }}, function(err, foundList){  
      if(!err){                          // delete the item from that particular list and recdirect to that list 
        console.log("Deleted by me");
        res.redirect("/" + listName);
      }
    });
  }
});



app.listen(3006, function() {
  console.log("Server started on port 3006");
});
