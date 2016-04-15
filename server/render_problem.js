var page = require('webpage').create();
var system = require('system');

var address = system.args[1];
page.open(address, function(status) {
    var content = page.evaluate(function() {
        var res = {};
        var cont = document.getElementsByClassName("question-content")[0].innerHTML;
        if (typeof(cont) === "undefined" || !cont) cont = "";
        res.content = cont;
        return res;
    });
    console.log(JSON.stringify(content));
    phantom.exit();
});
