/**
 * Created by binarylu on 3/15/16.
 */

var fs = require('fs');
var jsdom = require("jsdom");
var moment = require("moment");
var jquery = fs.readFileSync("./jquery.js", "utf-8");
var md5 = require("md5");
var https = require("https");

var leetcode_url = "https://leetcode.com";
var algorithm_url = leetcode_url + "/problemset/algorithms/";
var tags = {};
var problem_tags = {};

console.log("-----------------------------------------------------");
var t = moment().format('YYYY-MM-DD HH:mm:ss');
console.log("[" + t + "] Begin");

jsdom.env({
    url: algorithm_url,
    src: [jquery],
    done: function(err, window) {
        var $ = window.$;
        $(".sidebar-module:last a").each(function() {
            var tag = $(this).children("small").html();
            var link = leetcode_url + $(this).attr("href");
            tags[tag] = "";
            get_problem_tag(tag, link);
        });

        var len = $("#problemList tbody tr").length;
        $("#problemList tbody tr")
            .slice(0, len / 2)
            .sort(function () {
                return Math.random() * 10 > 5 ? 1 : -1;
            })
            .each(function () {
                var problem_title = $(this).children("td:eq(2)").children("a:first").html();
                var problem_url = leetcode_url + $(this).children("td:eq(2)").children("a:first").attr("href");
                var locked = $(this).children("td:eq(2)").children("i").length !== 0;
                var difficulty = $(this).children("td:eq(5)").html();
                if (typeof(problem_tags[problem_title]) == 'undefined' || !problem_tags[problem_title])
                    problem_tags[problem_title] = [];
                var tags = problem_tags[problem_title];

                var problem_detail = {
                    content: ""
                };
                if (!locked) {
                    problem_detail = get_problem(problem_url);
                }

                var problem = {};
                problem.title = problem_title;
                problem.url = problem_url;
                problem.content = Base64.encode(problem_detail.content);
                problem.difficulty = difficulty;
                problem.companies = [];
                problem.tags = tags;
                var contributor = {};
                contributor.github = "crawler";

                var data = {};
                data.problem = problem;
                data.md5 = md5(JSON.stringify(problem));
                data.locked = locked;
                data.category = "Algorithms";
                data.contributor = contributor;
                data.version = "crawler:0.1";
                data.create_time = new Date();

                upload(data);
            });
        fs.writeFile("./leetcode.json", JSON.stringify(problem_tags), function (err) {
            var t = moment().format('YYYY-MM-DD HH:mm:ss');
            if (err) {
                return console.error("[" + t + "]" + err);
            }
            console.log("[" + t + "] OK");
        });
        var t = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log("[" + t + "] Algorithms_1 Done");
    }
});

function get_problem_tag(tag, link) {
    const spawn = require('child_process').spawnSync;
    const child = spawn("./node_modules/phantomjs-prebuilt/bin/phantomjs", ["render_tag.js", link]);

    tags[tag] = JSON.parse(child.stdout);
    for (var i = 0; i < tags[tag].length; ++i) {
        var pro = tags[tag][i];
        if (typeof(problem_tags[pro]) == 'undefined' || !problem_tags[pro]) problem_tags[pro] = [];
        problem_tags[pro].push(tag);
    }
}

function get_problem(link) {
    const spawn = require('child_process').spawnSync;
    const child = spawn("./node_modules/phantomjs-prebuilt/bin/phantomjs", ["render_problem.js", link]);
    return JSON.parse(child.stdout);
}

function upload(data) {
    var post_options = {
        host: 'chrome-ext.luxiakun.com',
        port: '443',
        path: '/leetcode-ext/problem',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(data).length
        }
    };
    var post_req = https.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log(data.problem.title + ': ' + chunk);
        });
    });
    post_req.write(JSON.stringify(data));
    post_req.end();
}

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/

var Base64 = {

    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

};