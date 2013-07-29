var express = require('express');
var mongoose = require('mongoose'),Schema = mongoose.Schema

var app = express();

var mongo_uri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/test';
mongoose.connect(mongo_uri);

//Model
var bumpSchema = new Schema({
    fbid: String,
    date: {type: Date, default: Date.now, expires: 120},
    geo: {type: [Number], index: '2d'}
});
var Bump = mongoose.model('Bump', bumpSchema);

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.get('/', function(req, res){
  var bump = new Bump({fbid:req.query.fbid, geo:req.query.geo.split(',')});
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
      var results = docs.map(function(d){
        var obj = d.toObject();
        obj.timedelta = obj.date.getTime() - bump.date.getTime();
        delete obj['date'];
        delete obj['geo'];
        delete obj['_id'];
        delete obj['__v'];
        return obj;
      });
      res.json(results.sort(function(a,b){return b.timedelta - a.timedelta}));
    }
  );
});

app.listen(process.env.PORT, function() {
  console.log("Has started on " + process.env.PORT);
});