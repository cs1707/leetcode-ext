var fs = require("fs");
var express = require('express');
var bodyParser = require('body-parser');
var md5 = require("md5");
var app = express();

var log4js = require('log4js');
log4js.configure({
    appenders: [
        {type: 'file', filename: 'logs/app.log', maxLogSize: 10485760, backups: 10, category: 'info'}
    ]
});
var logger = log4js.getLogger('info');

//var mongo = require('mongodb');
var db = require('monk')('localhost:27017/leetcode');

app.use(bodyParser.json({limit: '1mb'}));  //body-parser json format
// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false  }))
//app.use(bodyParser.urlencoded({            // this line must follow bodyParser.json
  //extended: true
//}));
// parse application/json
app.use(bodyParser.json());

app.get('/', func_root);
app.get('/leetcode-ext', func_leetcode);
app.get('/leetcode-ext/all_problems', get_all_problems);
app.get('/leetcode-ext/problem/:title', get_problem);
app.post('/leetcode-ext/problem', save_problem);

var server = app.listen(9199, "0.0.0.0", function() {
    var host = server.address().address;
    var port = server.address().port;
});

function func_root(req, res) {
    res.send("There is nothing here~");
}

function func_leetcode(req, res) {
    var data = fs.readFileSync("./leetcode.json", "utf-8");
    res.send(data);
    //res.jsonp(JSON.parse(data));
}

function get_all_problems(req, res) {
    var collection = db.get('problems');
    var data = {};
    collection.find({}, "problem", function(e, docs) {
        for (var i = 0; i < docs.length; ++i) {
            var p = docs[i].problem;
            var title = p.title;
            if (typeof(p.companies) == 'undefined' || !p.companies) p.companies = [];
            if (typeof(p.tags) == 'undefined' || !p.tags) p.tags = [];
            data[title] = {};
            data[title].companies = p.companies;
            data[title].tags = p.tags;
        }
        res.send(data);
    });
}

function get_problem(req, res) {
    var title = req.params.title;
    var collection = db.get('problems');
    var data = {};
    collection.findOne({"problem.title": title}).on('success', function(doc) {
        if (doc) {
            data.title = doc.problem.title;
            data.content = doc.problem.content;
        } else {
            data.title = title;
            data.content = "";
        }
        res.send(data);
    });
}

function save_problem(req, res) {
    var data = req.body;
    var title = data.problem.title;
    var md5_string = data.md5;
    var locked = data.locked;
    var category = data.category;
    var companies = data.companies;
    var tags = data.tags;

    if (md5(JSON.stringify(data.problem)) !== md5_string) {
        logger.info("wrong upload: " + title + " By: " + data.contributor.leetcode + "(" + data.contributor.github + ")");
        res.send("Failed to upload problem.");
        return;
    }

    var collection = db.get('problems');
    get_by_title(collection, title, function (docs) {
        if (docs.length === 0) {
            logger.info("add: " + title + " By: " + data.contributor.leetcode + "(" + data.contributor.github + ")");
            data.check_time = new Date();
            collection.insert(data, function(err) {
                if (err) {
                    console.log("insert error");
                    console.log(err);
                }
            });
            res.send({"res": "Add problem successfully."});
        } else {
            var new_info = {};
            if (!docs[0].md5 || (data.problem.content !== "" && md5_string !== docs[0].md5)) {
                new_info.problem = data.problem;
                new_info.md5 = md5_string;
            }
            if (!docs[0].locked || (locked && locked !== docs[0].locked)) {
                new_info.locked = locked;
            }
            if (!docs[0].category || (category && category !== docs[0].category)) {
                new_info.category = category;
            }
            if (!docs[0].companies || docs[0].companies.length === 0 || (companies && companies.length !== 0 && companies.sort().toString() !== docs[0].companies.sort().toString())) {
                new_info.companies = companies;
            }
            if (!docs[0].tags || docs[0].tags.length === 0 || (tags && tags.length !== 0 && tags.sort().toString() !== docs[0].tags.sort().toString())) {
                new_info.tags = tags;
            }
            var update = false;
            if (!isEmpty(new_info)) {
                new_info.contributor = data.contributor;
                logger.info("Update: " + title + " By: " + data.contributor.leetcode + "(" + data.contributor.github + ")");
                logger.info(JSON.stringify(new_info));
                update = true;
            }
            new_info.check_time = new Date();
            collection.update({"problem.title": title}, {$set: new_info});
            if (update)
                res.send({"res": "Update problem successfully."});
            else
                res.send({"res": "Problem exists."});
        }
    });
}

function isEmpty(obj) {
    for (var name in obj) {
        return false;
    }
    return true;
}

function get_by_title(collection, title, callback) {
    collection.find({"problem.title": title}, function(e, docs) {
        callback(docs);
    });
}

function remove_by_title(collection, title) {
    collection.remove({"problem.title": title}, function (err) {
        if (err) console.log(err);
    });
}
