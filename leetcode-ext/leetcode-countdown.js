/**
 * Created by binarylu on 3/24/16.
 */

$(function () {
    var reg = new RegExp('submissions');
    if (window.location.pathname.match(reg) !== null)
        return false;

    chrome.storage.sync.get({
        countdown: 'yes'
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        if (items.countdown !== "no") {
            // run code button
            document.getElementById("button0").onclick=function(){show_time_count(this);};
            // submit button
            document.getElementById("button1").onclick=function(){show_time_count(this);};
        }
    });
});

var wait_time = 10;
function show_time_count(obj) {
    var title = $(obj).html().replace(/ \(\d+\)/, "");
    if (wait_time === 0) {
        $("#button0, #button1").attr("disabled", false);
        $(obj).html(title);
        wait_time = 10;
    } else {
        $("#button0, #button1").attr("disabled", true);
        wait_time--;
        $(obj).html(title + " (" + wait_time + ")");
        setTimeout(function() {
            show_time_count(obj);
        }, 1000);
    }
}