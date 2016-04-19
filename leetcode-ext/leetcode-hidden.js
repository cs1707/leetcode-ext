/**
 * Created by binarylu on 3/21/16.
 */

$(function(){
    var path = window.location.pathname;
    chrome.storage.sync.get({
        ac_difficulty: 'show',
        hide_locked: 0
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        if (path.match(new RegExp('^\/tag')) || path.match(new RegExp('^\/company'))) {
            tag_add_check();
            $("#hide_locked").prop("checked", items.hide_locked === 0 ? false : true);
            tag_hide_locked();
        }

        if (items.ac_difficulty == "hide") {
            if (path.match(new RegExp('^\/problemset'))) {
                page_problemset();
            } else if (path.match(new RegExp('^\/tag')) || path.match(new RegExp('^\/company'))) {
                $("#question_list thead a.btn-link").click(function() {
                    setTimeout(page_tag, 1000);
                    setTimeout(tag_hide_locked, 1000);
                });
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
});

function page_problemset() {
    var oncl = '$(this).parent().html($(this).parent().attr("ori_data"));return false;';

    $("#problemList tbody tr").each(function() {
        var $ac = $(this).children("td:eq(3)");
        $ac.attr("ori_data", $ac.html());
        $ac.html("<a href='#' onclick='" + oncl + "'>Show</a>");
        var $difficulty = $(this).children("td:eq(6)");
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

function tag_add_check() {
    var $check = '<div style="display:inline;margin-left:10px">' +
        '<input type="checkbox" id="hide_locked">&nbsp;' +
        '<label for="hide_locked">Hide locked problems</label>' +
        '</div>';
    $("label[for='tagCheck']").after($check);
    $("#hide_locked").click(tag_hide_locked);
}

function tag_hide_locked() {
    var hide_locked = $("#hide_locked").prop("checked") === true ? 1 : 0;
    chrome.storage.sync.set({
        hide_locked: hide_locked
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        $("#question_list tbody tr").each(function() {
            var locked = $(this).children("td:eq(2)").children("i").length === 0 ? 0 : 1;
            if (hide_locked === 1 && locked === 1) {
                $(this).hide();
                return true;
            }
            $(this).show();
        });
    });
}