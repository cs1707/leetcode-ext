var page = require('webpage').create();
var system = require('system');

var address = system.args[1];
page.open(address, function(status) {
    var content = page.evaluate(function() {
        var res = [];
        var questions = document.getElementById("question_list").children[1].getElementsByTagName("tr");
        for (var i = 0; i < questions.length; ++i) {
            res.push(questions[i].children[2].children[0].innerHTML);
        }
        return res;
    });
    console.log(JSON.stringify(content));
    phantom.exit();
});
