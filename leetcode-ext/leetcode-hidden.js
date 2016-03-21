/**
 * Created by binarylu on 3/21/16.
 */

(function(){
    var path = window.location.pathname;
    chrome.storage.sync.get({
        hide: true
    }, function(items) {
        if (items.hide) {
            if (path.match(new RegExp('^\/problemset'))) {
                page_problemset();
            } else if (path.match(new RegExp('^\/tag'))) {
                page_tag();
            } else if (path.match(new RegExp('^\/problems'))) {
                page_problem();
                $("#result-state").bind("DOMSubtreeModified", function() {
                    var state = $("#result-state").html().replace(/(^\s*)|(\s*$)/g, "").toLocaleLowerCase();
                    if (state == "accepted ") {
                        $("#total-submit-ac").show();
                    } else {
                        $("#total-submit-ac").hide();
                    }
                });
            }
        }
    });
})();

function page_problemset() {
    $("#problemList tbody td:nth-child(4)").html("(Hidden)");
    $("#problemList tbody td:nth-child(5)").html("(Hidden)");
}

function page_tag() {
    $("#question_list tbody td:nth-child(4)").html("(Hidden)");
    $("#question_list tbody td:nth-child(5)").html("(Hidden)");
}

function page_problem() {
    $("#result h4:first").after($("<h4 id='total-submit-ac'></h4>").html($(".total-submit,.total-ac")).hide());
}