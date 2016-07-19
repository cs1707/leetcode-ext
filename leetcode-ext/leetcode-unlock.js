/**
 * Created by binarylu on 4/16/16.
 */

var problem_rows = {};
var subscriber = false;

$(function() {
    var path = window.location.pathname;
    if (path.match(new RegExp('submissions')) !== null)
        return false;

    if (path === "/problemset/algorithms/") {
        add_node_problem();
        $("#problemList tbody tr").each(function () {
            var $td = $(this).children("td:eq(2)");
            var problem = $td.children("a:first").html();
            var locked = $td.find(".fa-unlock,.fa-lock").length === 0 ? false : true;

            problem_rows[problem] = $(this).html();

            if (locked === false) // skip if this problem is not a locked problem
                return true;

            if ($td.children("i").attr("class") === "fa fa-unlock")
                subscriber = true;

            if (!subscriber) {
                $td.children("a:first").attr("href", "#problem_modal")
                    .attr("data-toggle", "modal")
                    .attr("data-problem", problem);
            }

            $td.children("a").after(
                $("<a class='unlock_button' href='#problem_modal' data-problem='" + problem + "' data-toggle='modal' style='margin-left:5px;color:#8ace00'></a>").html(
                    $td.children("i").removeClass().addClass("fa fa-unlock")
                )
            );
        });
        if (!subscriber) {
            add_node_company();
        }
    } else if (path.match(new RegExp('problems'))) {
        add_company_button();
    }
});

function add_node_problem() {
    $("body").append($('' +
        '<div class="modal fade" id="problem_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" id="problem_modal_title">Problem Content</h4>' +
        '</div>' +
        '<div class="modal-body" id="problem_modal_content">' +
        '</div>' +
        '<div class="modal-footer">' +
        '<span style="padding-left:10px;float:left">Provided by <a target="_blank" href="https://github.com/binarylu/leetcode-ext">LeetCode Extension</a></span>' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'));

    var base64_script = document.createElement("script");
    base64_script.src = "https://chrome-ext.luxiakun.com/static/webtoolkit.base64.js";
    document.body.appendChild(base64_script);

    var script = document.createElement("script");
    script.innerHTML = "$('#problem_modal').on('show.bs.modal', function(e) {" +
        "$('#company_modal').modal('hide');" +
        "var problem = $(e.relatedTarget).data('problem');" +
        "$(e.currentTarget).find('#problem_modal_title').html(problem);" +
        "$(e.currentTarget).find('#problem_modal_content').html('');" +
        "$.ajax({" +
            "url: 'https://chrome-ext.luxiakun.com/leetcode-ext/problem/' + problem," +
            "type: 'get'," +
            "dataType: 'jsonp'," +
            "jsonp: 'callback'," +
            //"jsonpCallback:'foo'," +
            "async: true," +
            "success: function(jsonData) {" +
                "if (typeof(jsonData)=='undefined' || !jsonData) jsonData = {};" +
                "var title = jsonData.title;" +
                "var content = jsonData.content;" +
                "if (title && title !== '') " +
                    "$(e.currentTarget).find('#problem_modal_title').html(title);" +
                "if (content && content !== '') " +
                    "$(e.currentTarget).find('#problem_modal_content').html(Base64.decode(content));" +
                "else " +
                    "$('#modal_content').html('(no content)');" +
            "}," +
            "error: function(err) {" +
                "$(e.currentTarget).find('#problem_modal_content').html('problem not found.');" +
            "}" +
        "});" +
    "});";
    document.body.appendChild(script);
}

function add_node_company() {
    $(".sidebar-module:eq(3) > div").children("ul:first").children(":gt(0)").each(function() {
        var company = $(this).children("small").html();
        $(this).attr("href", "#company_modal")
               .attr("data-toggle", "modal")
               .attr("data-company", company);
    });

    $("body").append($('' +
        '<div class="modal fade" id="company_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" id="company_modal_title">Company</h4>' +
        '</div>' +
        '<div class="modal-body" id="company_modal_content">' +
        '<table id="lxk_company_table" class="table table-striped table-centered">' +
        '<thead></thead>' +
        '<tbody></tbody>' +
        '</table>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<span style="padding-left:10px;float:left">Provided by <a target="_blank" href="https://github.com/binarylu/leetcode-ext">LeetCode Extension</a></span>' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'));
    
    $("#lxk_company_table thead").html($("#problemList thead").html());

    var script = document.createElement("script");
    script.innerHTML = "$('#company_modal').on('show.bs.modal', function(e) {" +
        "$('#problem_modal').modal('hide');" +
        "var company = $(e.relatedTarget).data('company');" +
        "$(e.currentTarget).find('#company_modal_title').html(company);" +
        "$.ajax({" +
            "url: 'https://chrome-ext.luxiakun.com/leetcode-ext/company/' + company," +
            "type: 'get'," +
            "dataType: 'jsonp'," +
            "jsonp: 'callback'," +
            //"jsonpCallback:'foo'," +
            "async: true," +
            "success: function(jsonData) {" +
                "if (typeof(jsonData)=='undefined' || !jsonData) jsonData = {};" +
                "var company = jsonData.company;" +
                "var problems = jsonData.problems;" +
                "if (company && company !== '') " +
                    "$(e.currentTarget).find('#company_modal_title').html(company);" +
                "if (problems && problems.length > 0) {" +
                    "var content = '';" +
                    "var hide_locked = $('#hide_locked').prop('checked') === true ? 1 : 0;" +
                    "$('#problemList tbody tr').each(function() {" +
                        "var $td = $(this).children('td:eq(2)');" +
                        "var problem = $td.children('a:first').html();" +
                        "if ((hide_locked === 1 && $(this).is(':hidden')) || $.inArray(problem, problems) === -1) return true;" +
                        "else {" +
                            "content += '<tr>' + $(this).html() + '</tr>'" +
                        "}" +
                    "});" +
                    "$('#lxk_company_table tbody').html(content);" +
                "} else " +
                    "$('#company_modal_content').html('(no content)');" +
            "}," +
            "error: function(err) {" +
                "$(e.currentTarget).find('#company_modal_content').html('problem not found.');" +
            "}" +
        "});" +
    "});";
    document.body.appendChild(script);
}

function add_company_button() {
    if ($("#company_tags").length === 0) {
        var problem = $(".question-title:first").children(":first").html().replace(/^\d+\. */, "");
        $.ajax({
            url: 'https://chrome-ext.luxiakun.com/leetcode-ext/problem/' + problem,
            type: 'get',
            dataType: 'json',
            async: true,
            success: function (jsonData) {
                if (typeof(jsonData) == 'undefined' || !jsonData) jsonData = {};
                var title = jsonData.title;
                var companies = jsonData.companies;
                if (!title || title != problem) return false;
                if (!companies || companies.length === 0) return false;

                var $node = $('<div>' +
                    '<div id="company_tags" class="btn btn-xs btn-warning">Show Company Tags</div>\n' +
                    '<span class="hidebutton"></span>' +
                    '</div>');
                if ($("#tags").length > 0) {
                    $("#tags").parent().before($node);
                } else if ($("#similar").length > 0) {
                    $("#similar").parent().before($node);
                } else {
                    $(".question-content:first").append($node);
                }
                $("#company_tags").click(function() {
                    $(this).next().fadeToggle();
                    if ($(this).html() === "Show Company Tags")
                        $(this).html("Hide Company Tags");
                    else
                        $(this).html("Show Company Tags");
                });

                var content = "";
                for (var i = 0; i < companies.length; ++i) {
                    var company = companies[i];
                    var path = '/company/' + company.toLocaleLowerCase().replace(/ /g, '-') + '/';
                    content += '<a class="btn btn-xs btn-primary" href="' + path + '">' + company + '</a>\n';
                }
                $("#company_tags").next().html(content)
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}