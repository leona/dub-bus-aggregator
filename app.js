var app = require('koa')();
var router = require('koa-router')();
var fs = require('fs');
var stops = [];

var model = require('./model')

model = new model((data) => {
    stops = JSON.stringify(data)

    fs.writeFile('stops.json', stops);
});

router.use(function() {
    this.response.set('Content-type', 'application/json');
})

router.get('/', function() {
    //this.body = python_script;
});

