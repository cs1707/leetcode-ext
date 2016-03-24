/**
 * Created by binarylu on 3/15/16.
 */

var url = "https://chrome-ext.luxiakun.com/leetcode-ext";

(function() {
    chrome.storage.sync.get({
        progress: 'show'
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        if (items.progress !== "hide") {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function ()
            {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
                {
                    var jsonData = JSON.parse(xmlhttp.responseText);
                    enhanced_tag(jsonData);
                }
            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        }
    });
})();

function enhanced_tag(jsonData) {
    var taglist = {};
    var tr = document.getElementById("problemList").children[1].children;
    for (var i = 0; i < tr.length; ++i) {
        var problem = tr[i].children[2].children[0].innerHTML;
        var ac = tr[i].children[0].children[0].getAttribute("class");
        if (typeof(jsonData[problem]) == "undefined" || !jsonData[problem]) continue;
        for (var j = 0; j < jsonData[problem].length; ++j) {
            var tag = jsonData[problem][j];
            if (typeof(taglist[tag]) == 'undefined' || !taglist[tag]) taglist[tag] = 0;
            taglist[tag] += ac == "ac" ? 1 : 0;
        }
    }
    var Tag = document.getElementsByClassName("sidebar-module")[4].children[0].children;
    for (var i = 1; i < Tag.length; ++i) {
        var total = Tag[i].children[0].innerHTML;
        var tag = Tag[i].children[1].innerHTML;
        var ac = taglist[tag];
        var percent = Math.floor(ac / total * 100);

        var node = document.createElement("div");
        var style = "position:absolute;top:0;left:0;width:" + percent + "%;height:100%;background:green;opacity:0.15;";
        node.setAttribute("style", style);
        Tag[i].childNodes[1].innerHTML = ac + "/" + total;
        Tag[i].appendChild(node);
    }
}
