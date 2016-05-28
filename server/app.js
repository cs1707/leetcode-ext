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

app.use('/static', express.static('public'));
app.get('/', func_root);
app.get('/leetcode-ext', func_leetcode);
app.get('/leetcode-ext/all_problems', get_all_problems);
app.get('/leetcode-ext/companies', get_companies);
app.get('/leetcode-ext/problem/:title', get_problem);
app.get('/leetcode-ext/company/:company', get_company);
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
    collection.find({}, function(e, docs) {
        for (var i = 0; i < docs.length; ++i) {
            var p = docs[i].problem;
            var title = p.title;
            var companies = docs[i].companies;
            var tags = docs[i].tags;
            if (typeof(companies) == 'undefined' || !companies) companies = [];
            if (typeof(tags) == 'undefined' || !tags) tags = [];
            data[title] = {};
            data[title].companies = companies;
            data[title].tags = tags;
        }
        res.send(data);
    });
}

function get_companies(req, res) {
    var collection = db.get('problems');
    var data = {};
    collection.find({}, function(e, docs) {
        for (var i = 0; i < docs.length; ++i) {
            var title = docs[i].problem.title;
            var companies = docs[i].companies;
            if (typeof(companies) == 'undefined' || !companies) companies = [];
            for (var j = 0; j < companies.length; ++j) {
                if (typeof(data[companies[j]]) == 'undefined' || !data[companies[j]]) data[companies[j]] = [];
                data[companies[j]].push(title);
            }
        }
        res.jsonp(data);
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
            data.companies = doc.companies;
        } else {
            data.title = title;
            data.content = "";
            data.companies = [];
        }
        res.jsonp(data);
    });
}

function get_company(req, res) {
    var company = req.params.company;
    var collection = db.get('problems');
    var data = {};
    data.company = company;
    data.problems = [];
    collection.find({"companies": company}).on('success', function(docs) {
        for (var i = 0; i < docs.length; ++i) {
            data.problems.push(docs[i].problem.title);
        }
        res.jsonp(data);
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
    var similarities = data.similarities;

    if (data.contributor.version !== '1.1.0' && data.contributor.github !== 'crawler') {
        res.send({"res": "version is out of date"});
        return;
    }

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
            if (data.problem.content !== "" && (!docs[0].md5 || md5_string !== docs[0].md5)) {
                if (!(docs[0].companies && docs[0].companies.length !== 0 && (!companies || companies.length === 0))) {
                    new_info.problem = data.problem;
                    new_info.md5 = md5_string;
                }
            }
            if (locked && (!docs[0].locked || locked !== docs[0].locked)) {
                new_info.locked = locked;
            }
            if (category && (!docs[0].category || category !== docs[0].category)) {
                new_info.category = category;
            }
            if (companies && companies.length !== 0 && (!docs[0].companies || docs[0].companies.length === 0 || companies.sort().toString() !== docs[0].companies.sort().toString())) {
                new_info.companies = companies;
            }
            if (tags && tags.length !== 0 && (!docs[0].tags || docs[0].tags.length === 0 || tags.sort().toString() !== docs[0].tags.sort().toString())) {
                new_info.tags = tags;
            }
            if (similarities && similarities.length !== 0 && (!docs[0].similarities || docs[0].similarities.length === 0 || similarities.sort().toString() !== docs[0].similarities.sort().toString())) {
                new_info.similarities = similarities;
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
