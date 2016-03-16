/**
 * Created by binarylu on 3/15/16.
 */

var fs = require('fs');
var jsdom = require("jsdom");
var moment = require("moment");
var jquery = fs.readFileSync("./jquery.js", "utf-8");

var url = "https://leetcode.com";
var alg = url + "/problemset/algorithms/";
var tags = {};
var problems = {};
var amount = 0;

jsdom.env({
    url: alg,
    src: [jquery],
    done: function(err, window) {
        var $ = window.$;
        amount = $(".sidebar-module:last a").length;
        $(".sidebar-module:last a").each(function() {
            var tag = $(this).children("small").html();
            var link = url + $(this).attr("href");
            tags[tag] = "";
            getProblems(tag, link);
        });
    }
});

function getProblems(tag, link) {
    const spawn = require('child_process').spawn;
    const child = spawn("./node_modules/phantomjs/bin/phantomjs", ["render.js", link]);
    child.stdout.on('data', function (data) {
        tags[tag] += data;
    });
    child.on('close', function() {
        tags[tag] = JSON.parse(tags[tag]);
        amount -= 1;
        for (var i = 0; i < tags[tag].length; ++i) {
            var pro = tags[tag][i];
            if (typeof(problems[pro]) == 'undefined' || !problems[pro]) problems[pro] = [];
            problems[pro].push(tag);
        }
        if (0 == amount) {
            fs.writeFile("./leetcode.json", JSON.stringify(problems), function(err) {
                var t = moment().format('YYYY-MM-DD HH:mm:ss');
                if (err) {
                    return console.error("[" + t + "]" + err);
                }
                console.log("[" + t + "] OK");
            });
        }
    });
}
