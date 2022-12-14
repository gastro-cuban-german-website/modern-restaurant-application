// Import models
const Item = require("../models/Item.model");


// ********* require fileUploader in order to use it ********
const fileUploader = require('../config/cloudinary.config');

// Import middleware
const isLoggedIn = require("../middleware/isLoggedIn");
const isAdmin = require("../middleware/isAdmin");

// Router
const router = require("express").Router();

// 👇 Handling routes 👇

// READ: List all items
router.get("/menu", (req, res, next) => {

    let {startersArr, mainsArr, desertsArr, beveragesArr} = [];    
    

    Item.find()
    .then( itemsFromDB => {

        startersArr = itemsFromDB.filter( (v) => {
            if( v.category == "starter"){
                return v;
            }
        })

        mainsArr = itemsFromDB.filter( (v) => {
            if( v.category == "main"){
                return v;
            }
        })

        desertsArr = itemsFromDB.filter( (v) => {
            if( v.category == "dessert"){
                return v;
            }
        })

        beveragesArr = itemsFromDB.filter( (v) => {
            if( v.category == "beverages"){
                return v;
            }
        })
        
        res.render("items/items-list", {startersArr, mainsArr, desertsArr, beveragesArr, user: req.session.user} );
    })
    .catch( err => {
        console.log("error getting items from DB", err);
        next(err);
    })
});

// READ: Item details
router.get("/menu/:itemId", (req, res, next) => {
    const id = req.params.itemId;

    Item.findById(id)
    .then( itemDetails => {
        res.render("items/item-details", {item: itemDetails, user: req.session.user});
    })
    .catch( err => {
        console.log("Read: Error getting item details from DB", err);
        next();
    })
});

// CREATE: Display form
router.get("/create", isLoggedIn, isAdmin, (req, res, next) => {
    res.render("items/item-create", {user: req.session.user});    
});

// CREATE: Process form
router.post("/create", isLoggedIn, isAdmin, fileUploader.single('image_url'), (req, res, next) => {
    
    
    

    const newItem = {
        title: req.body.title,
        price: req.body.price,
        category: req.body.category,
        description: req.body.description,
        image_url: req.file.path        
    }

    

    Item.create(newItem)
    .then( newItem => {
        res.redirect("/menu");
    })
    .catch()

     
});

// UPDATE: Display form
router.get("/menu/:itemId/edit", isLoggedIn, isAdmin, (req, res, next) => {
    Item.findById(req.params.itemId)
    .then( (itemDetails) => {
        res.render("items/item-edit", {item: itemDetails, user: req.session.user});

    })
    .catch( err => {
        console.log("Update: Error getting item details from DB...", err);
        next();
    })
})

// UPDATE: Process form
router.post("/menu/:itemId/edit", isLoggedIn, isAdmin, fileUploader.single('image_url'), (req, res, next) => {
   
    

    const itemId = req.params.itemId;
    
    const newDetails = {
        title: req.body.title,
        price: req.body.price,
        category: req.body.category,
        description: req.body.description,
        image_url: req.file?.path        
    }


    Item.findByIdAndUpdate(itemId, newDetails)
    .then(() => {
        res.redirect(`/menu/${itemId}`);
    })
    .catch(err => {
        console.log("Error updating item...", err);
        next(err);
    });
})

// DELETE
router.post("/menu/:itemId/delete", isLoggedIn, isAdmin, (req, res, next) => {
    Item.findByIdAndDelete(req.params.itemId)
      .then(() => {
        res.redirect("/menu");
      })
      .catch(err => {
        console.log("Error deleting item...", err);
        next(err);
      });
  
  });


  // Keep Me Alive
router.get('/keep-alive', (req, res, next) => {
  Item.find()
    .then(() => {
      res.status(200).json({ message: 'It worked' });
    })
    .catch(() => {
      res.status(500).json({ message: "It didn't work" });
    });
});



// Export router
module.exports = router;

