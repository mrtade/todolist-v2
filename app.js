//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
// require mongoose
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// create new database
mongoose.connect("mongodb://localhost:27017/todolistDB",  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

// create the item schema which is like the structure of the documents
const itemsSchema = new mongoose.Schema ({
  name: String
});

// link the mongoose model (Item) to the schema. The Item model is always capital will serve as the collection
const Item = mongoose.model("Item", itemsSchema);

//Create new default documents in the collection
const item1 = new Item ({
  name: "Welcome to your todo list"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item"
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
  name: String,
  item: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, dbItems){

    if (dbItems === 0) {
        console.log("There are zero items in the items collection under todolistDB");

        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          }  else {
          // mongoose.connection.close(); //Close connection -- this isnt working the way i expected
          console.log("Successfully added default items to the todolistDB");
          }
        });

        res.redirect("/");

    } else {
      res.render("list", {listTitle: "Today", newListItems: dbItems});
    }

/* I DON'T KNOW WHY THIS CODE DIDN'T WORK, I WILL CHECK LATER */
    // if (err) {
    //   console.log(err);
    // } else if (dbItems.length === 0) {
    //   console.log("There are zero items in the items collection under todolistDB");
    //
    //   Item.insertMany(defaultItems, function(err){
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       mongoose.connection.close(); //Close connection
    //       console.log("Successfully added default items to the todolistDB");
    //     }
    //   });
    //
    //   res.redirect("/");
    //
    // } else {
    //
    //   mongoose.connection.close(); //Close connection
    //
    //   res.render("list", {listTitle: "Today", newListItems: dbItems});
    //
    // }

  });

});

app.get("/:customListName", function(req,res){
  const customListName = _.upperFirst(req.params.customListName);

  List.findOne({name: customListName}, function(err, results){

    if (!err) {

      if (!results) {
        console.log("Doesnt exist!");
        console.log(results);
        console.log(`== creating new ${customListName} document under lists ==`);

         const list = new List ({
           name: customListName,
           item: defaultItems
         });

         list.save();
         res.render("list", {listTitle: customListName, newListItems: list.item});

      } else if (results.name === customListName) {
        console.log("==requested list already exists, see below and will be updated as required==");
        console.log(`list - ${results.name} - already exists`);
        console.log(results);

        res.render("list", {listTitle: results.name, newListItems: results.item});
    }
  }
});
    // else if (customListName === results.name) {
    // console.log(`entry ${customListName} already exists`);

});

app.post("/delete", function(req, res){
  console.log("======delete function triggered=======");
  console.log(req.body.checkbox);

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listTitle;


  if (listName === "Today") {
    //Mongoose method to delete by _id
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err){
        console.log(err);
      } else {
        // mongoose.connection.close(); //Close connection  -- this isnt working the way i expected
        console.log(`Successfully deleted document with _id ${req.body.checkbox}`);
        res.redirect("/");

      }
    });

  } else {

    List.findOneAndUpdate({name: listName}, {$pull: {item: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect(`/${listName}`);
      }
    });

  }


  // You can also use below to delete

  // Item.deleteOne({_id: req.body.checkbox}, function(err){
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     mongoose.connection.close(); //Close connection
  //     console.log(`Successfully deleted document with _id ${req.body.checkbox}`);
  //   }
  // });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  console.log(req.body.list);

  const newItemDoc = new Item ({
    name: itemName
  });

  if (listName === "Today") {

    newItemDoc.save();
    res.redirect("/");

    } else {

      List.findOne({name: listName}, function(err, foundList){

        console.log(foundList.item);

        foundList.item.push(newItemDoc);
        foundList.save();
        res.redirect(`/${listName}`);
      });
    }

});


app.get("/about", function(req, res){
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
