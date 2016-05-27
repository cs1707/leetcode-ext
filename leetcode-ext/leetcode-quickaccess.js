/**
 * Created by petrosliu on 5/27/16.
 */

$(function() {
    var path = window.location.pathname;
    if (path.match(new RegExp('problemset')) === null && path.match(new RegExp('tag')) === null && path !== "/submissions/")
        return false;

    $("#problemList tbody tr").each(function() {
        var $td = $(this).children("td:eq(2)");
        var problem = $td.children("a:first").html();
        add_quick_access($td, problem);
    });
    $("#result_testcases tbody tr").each(function() {
        var $td = $(this).children("td:eq(1)");
        var problem = $td.children("a:first").html();
        add_quick_access($td, problem);
    });
    $("#question_list tbody tr").each(function() {
        var $td = $(this).children("td:eq(2)");
        var problem = $td.children("a:first").html();
        add_quick_access($td, problem);
    });
});

function add_quick_access(td, problem) {
    problem = problem.toLowerCase().replace(/[^a-z0-9-\s]/g, '').replace(/\s-\s/g, '-').replace(/\s/g, "-");
    td.append(
        $("<span class='pull-right'></span>")
    );
    td.children("span:last").append(
        $("<a href='https://leetcode.com/problems/" + problem + "/submissions/'></a>").html(
            $("<i class='fa fa-fw fa-bar-chart' aria-hidden='true'></i>")
        )
    );
    td.children("span:last").append(
        $("<a href='https://leetcode.com/discuss/questions/oj/" + problem + "/'></a>").html(
            $("<i class='fa fa-fw fa-comments' aria-hidden='true'></i>")
        )
    );
}