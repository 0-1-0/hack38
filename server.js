var connect = require('connect'),
  mongo = require('mongodb');
 
// Connect to a mongo database via URI
// With the MongoLab addon the MONGOLAB_URI config variable is added to your
// Heroku environment.  It can be accessed as process.env.MONGOLAB_URI
mongo.connect(process.env.MONGOLAB_URI, {}, function(error, db){
 
  // console.log will write to the heroku log which can be accessed via the 
  // command line as "heroku logs"
  db.addListener("error", function(error){
    console.log("Error connecting to MongoLab");
  });
  
  db.collection('requests', function(err, collection){
    var requestCollection = collection;
    connect(
      connect.favicon(),                    // Return generic favicon
      connect.query(),                      // populate req.query with query parameters
      connect.bodyParser(),                 // Get JSON data from body
      function(req, res, next){             // Handle the request
        res.setHeader("Content-Type", "application/json");
        if(req.query != null) {

          var doc = {
            t: new Date(),
            loc:  [parseInt(req.query.lon), parseInt(req.query.lat)],
            fbid: req.query.fbid
          };

          requestCollection.insert(doc, function(error, result){
            requestCollection.find({loc:{$near: doc.loc, $maxDistance: 1000000.0}}).toArray(
              function(err, fbfriends){
                res.write(JSON.stringify(fbfriends) + err);
              });  
          });
        }
        
        res.end();
      }
    ).listen(process.env.PORT || 8080);
    // the PORT variable will be assigned by Heroku
  });

});