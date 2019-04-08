'use strict'
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const passportConf = require('./passport');
var mongoose = require('mongoose');

const cors = require('cors');

if (process.env.NODE_ENV == 'testing'){
   console.log("In test mode...");
   mongoose.connect("mongodb://testUser:testUser@cluster0-shard-00-00-twf8g.mongodb.net:27017," +
        "cluster0-shard-00-01-twf8g.mongodb.net:27017,cluster0-shard-00-02-twf8g.mongodb.net:27017/test-data?" +
        "ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true", { useNewUrlParser: true });
}else{
    console.log("In production mode...");
    mongoose.connect("mongodb://testUser:testUser@cluster0-shard-00-00-twf8g.mongodb.net:27017," +
        "cluster0-shard-00-01-twf8g.mongodb.net:27017,cluster0-shard-00-02-twf8g.mongodb.net:27017/testing?" +
        "ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true", { useNewUrlParser: true });
}


var app = express();


//middleware
//middlewares are run in sequence
app.use(morgan('dev'));//morgan logs the calls to the routes
app.use(bodyParser.json());//parsing the json object
app.use(cors()); // Cross-origin handler

//routes
app.use('/users', require('./routes/users'));
app.use('/activities', require('./routes/activities'));

//start the server 
var port = process.env.PORT || 8000;

var server = app.listen(port, function () {
    console.log("Express server is listening on port", port);
});

module.exports = server;