/**
 * Created by binarylu on 3/21/16.
 */

(function(){
    var path = window.location.pathname;
    chrome.storage.sync.get({
        ac_difficulty: 'show'
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        if (items.ac_difficulty == "hide") {
            if (path.match(new RegExp('^\/problemset'))) {
                page_problemset();
            } else if (path.match(new RegExp('^\/tag'))) {
                page_tag();
            } else if (path.match(new RegExp('^\/problems'))) {
                page_problem();
                $("#result-state").bind("DOMSubtreeModified", function() {
                    var state = $("#result-state").html().replace(/(^\s*)|(\s*$)/g, "").toLocaleLowerCase();
                    if (state == "accepted") {
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
    var oncl = '$(this).parent().html($(this).parent().attr("ori_data"));return false;';

    $("#problemList tbody tr").each(function() {
        var $ac = $(this).children("td:eq(3)");
        $ac.attr("ori_data", $ac.html());
        $ac.html("<a href='#' onclick='" + oncl + "'>Show</a>");
        var $difficulty = $(this).children("td:eq(4)");
        $difficulty.attr("ori_data", $difficulty.html());
        $difficulty.html("<a href='#' onclick='" + oncl + "'>Show</a>");
    });
}

function page_tag() {
    var oncl = '$(this).parent().html($(this).parent().attr("ori_data"));return false;';

    $("#question_list tbody tr").each(function() {
        var $ac = $(this).children("td:eq(3)");
        $ac.attr("ori_data", $ac.html());
        $ac.html("<a href='#' onclick='" + oncl + "'>Show</a>");
        var $difficulty = $(this).children("td:eq(4)");
        $difficulty.attr("ori_data", $difficulty.html());
        $difficulty.html("<a href='#' onclick='" + oncl + "'>Show</a>");
    });
}

function page_problem() {
    $("#result h4:first").after($("<h4 id='total-submit-ac'></h4>").html($(".total-submit,.total-ac")).hide());
}