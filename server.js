var express = require('express');
var mongoose = require('mongoose'),Schema = mongoose.Schema

var app = express();

var mongo_uri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/test';
mongoose.connect(mongo_uri);

//Model
var bumpSchema = new Schema({
    fbid: String,
    name: String,
    date: {type: Date, default: Date.now, expires: 120},
    geo: {type: [Number], index: '2d'}
});
var Bump = mongoose.model('Bump', bumpSchema);

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});


app.get('/html5', function(req, res){
  res.sendfile('client/index.html');
});

app.get('/', function(req, res){
  var bump = new Bump({fbid:req.query.fbid, name:req.query.name, geo:req.query.geo.split(',')});
  if(req.query.timestamp){
    bump.date = Date(req.query.timestamp);
  };
  bump.save(function(err){
    if (err) throw err;
    console.log('bump saved');
  });

  Bump.find({geo: {$nearSphere: bump.geo, $maxDistance: 0.01} }, 
    function(err,docs){
      if(err) throw err;

      //convert MongoDB Query into an array of objects
      var results = docs.map(function(d){
        var obj = d.toObject();
        obj.timedelta = obj.date.getTime() - bump.date.getTime();
        delete obj['date'];
        delete obj['geo'];
        delete obj['_id'];
        delete obj['__v'];
        return obj;
      });

      //Sort results by timedelta to the saved bump
      results = results.sort(function(a,b){return b.timedelta - a.timedelta});
      //return only uniq id results
      var flags = {}, uniq_results = [];
      for (var i = 0; i < results.length; i++){
        if(flags[results[i].fbid]) continue;
        flags[results[i].fbid] = true;
        uniq_results.push(results[i]);
      }

      res.json(uniq_results);
    }
  );
});

app.listen(process.env.PORT, function() {
  console.log("Has started on " + process.env.PORT);
});