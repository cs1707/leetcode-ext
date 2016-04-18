/**
 * Created by binarylu on 4/16/16.
 */

var problem_rows = {};
var subscriber = false;

$(function() {
    add_node_problem();
    $("#problemList tbody tr").each(function() {
        var $td = $(this).children("td:eq(2)");
        var problem = $td.children("a:first").html();
        var locked = $td.children("i").length === 0 ? 0 : 1;

        problem_rows[problem] = $(this).html();

        if (locked === 0) // skip if this problem is not a locked problem
            return true;

        if ($td.children("i").attr("class") === "fa fa-unlock")
            subscriber = true;

        $td.children("a").after(
            $("<a class='unlock_button' href='#problem_modal' data-problem='" + problem + "' data-toggle='modal' style='margin-left:5px;color:#8ace00'></a>").html(
                $td.children("i").removeClass().addClass("fa fa-unlock")
            )
        );
    });
    if (!subscriber) {
        add_node_company();
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
    $(".sidebar-module:eq(3)").children("ul:first").children(":gt(0)").each(function() {
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