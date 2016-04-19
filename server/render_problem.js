var page = require('webpage').create();
var system = require('system');

var address = system.args[1];
page.open(address, function(status) {
    page.includeJs("https://ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min.js", function() {
        var content = page.evaluate(function() {
            var res = {};
            var $question = $(".question-content:first").clone();
            if ($question.children("div:first").find("a:first").html() === "Subscribe")
                $question.children("div:first").remove();

            res.content = $.trim($question.html());
            return res;
        });
        console.log(JSON.stringify(content));
        phantom.exit(); 
    });
});
