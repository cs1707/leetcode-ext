/**
 * Created by binarylu on 4/16/16.
 */

$(function() {
    add_node();
    $("#problemList tbody tr").each(function() {
        var $td = $(this).children("td:eq(2)");
        var problem = $td.children("a:first").html();
        var locked = $td.children("i").length == 0 ? 0 : 1;
        if (locked === 0)
            return true;

        $td.children("a").after(
            $("<a class='unlock_button' href='#problem_content' data-problem='" + problem + "' data-toggle='modal'style='margin-left:5px;color:#8ace00'></a>").html(
                $td.children("i").removeClass().addClass("fa fa-unlock")
            )
        );
        // $(".unlock_button").click(function() {
        //     var title = $(this).attr("data-problem");
        //     $("#modal_title").html(title);
        //     $("#modal_content").html("");
        //     $.ajax({
        //         url: 'https://chrome-ext.luxiakun.com/leetcode-ext/problem/' + problem,
        //         type: 'get',
        //         dataType: 'json',
        //         async: true,
        //         success: function (jsonData) {
        //             if (typeof(jsonData) == 'undefined' || !jsonData) jsonData = {};
        //             var title = jsonData.title;
        //             var content = jsonData.content;
        //
        //             if (title && title !== "")
        //                 $('#modal_title').html(title);
        //
        //             if (content && content !== "")
        //                 $('#modal_content').html(Base64.decode(content));
        //             else
        //                 $('#modal_content').html("(no content)");
        //         },
        //         error: function (err) {
        //             $('#modal_content').html('problem not found.');
        //         }
        //     });
        // });
    });
});

function add_node() {
    $("body").append($('' +
        '<div class="modal fade" id="problem_content" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" id="modal_title">Problem Content</h4>' +
        '</div>' +
        '<div class="modal-body" id="modal_content">' +
        '</div>' +
        '<div class="modal-footer">' +
        '<span style="float:left" id="readme_alert"></span>' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'));

    var base64_script = document.createElement("script");
    base64_script.src = "https://chrome-ext.luxiakun.com/static/webtoolkit.base64.js";
    document.body.appendChild(base64_script);

    var script = document.createElement("script");
    script.innerHTML = "$('#problem_content').on('show.bs.modal', function(e) {" +
        "var problem = $(e.relatedTarget).data('problem');" +
        "$(e.currentTarget).find('#modal_title').html(problem);" +
        "$(e.currentTarget).find('#modal_content').html('');" +
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
                    "$(e.currentTarget).find('#modal_title').html(title);" +
                "if (content && content !== '') " +
                    "$(e.currentTarget).find('#modal_content').html(Base64.decode(content));" +
                "else " +
                    "$('#modal_content').html('(no content)');" +
            "}," +
            "error: function(err) {" +
                "$(e.currentTarget).find('#modal_content').html('problem not found.');" +
            "}" +
        "});" +
    "});";
    document.body.appendChild(script);
}