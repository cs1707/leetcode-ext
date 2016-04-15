/**
 * Created by binarylu on 3/18/16.
 */

var github_api = 'https://api.github.com';

var token = "";
var user = "";
var repo = "";
var commit_cond = "";
var default_comment = "";

var postfix = {
    c: ".c",
    cpp: ".cpp",
    java: ".java",
    python: ".py",
    csharp: ".cs",
    javascript: ".js",
    ruby: ".rb",
    swift: ".swift",
    golang: ".go",
    base: ".sh",
    mysql: ".sql"
};

$(function(){
    var reg = new RegExp('submissions');
    if (window.location.pathname.match(reg) !== null)
        return false;
    chrome.storage.sync.get({
        token: '',
        oauth_token: '',
        user: '',
        repo_name: '',
        commit: ["accepted", "time limit exceeded", "compile error", "runtime error"],
        comment: ''
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        token = items.oauth_token;
        user = items.user;
        repo = items.repo_name;
        commit_cond = items.commit;
        default_comment = items.comment;

        upload_problem();
        if (items.token !== '' && items.oauth_token === '') {
            var $bulletin = $("<span style='padding-left:10px;' id='bulletin'></span>");
            $("code-button").after($bulletin);
            var content = "LeetCode Extension does not support personal access token any more, please go to <b>option page</b> to login with OAuth.";
            $("#bulletin").html(content);
            $("#bulletin").css("color", "red");
        }

        if (token && user && repo) {
            add_node();
            $("#readme_button").click(restore);
            // $("#commit_readme").click({from: "commit_readme"}, commit);
            // $("#commit_question").click({from: "commit_question"}, commit);
            document.getElementById("commit_readme").onclick=function(){commit("commit_readme");};
            document.getElementById("commit_question").onclick=function(){commit("commit_question");};
            // submit button
            $("#button1").click(function() {
                $("#commit_status").html("");
            });
            $("#filename").val(get_filename());
            $('select[name=lang]').change(function () {
                var ext = get_extension();
                var filename = get_filename();
                filename = filename.substring(0, filename.lastIndexOf(".")) + ext;
                $("#filename").val(filename);
            });
            // result of submit
            $("#result-state").bind("DOMSubtreeModified", function() {
                var state = get_state("submit");
                if (state !== "" && $.inArray(state, commit_cond) != -1) {
                    commit("");
                }
            });
        } else {
            console.log("token: " + token);
            console.log("user: " + token);
            console.log("repo: " + token);
        }
    });
});

function add_node() {
    var $buttons = $("" +
        "<button type='button' class='btn btn-success' id='commit_question'>Add Question</button>&nbsp;" +
        "<button type='button' class='btn btn-success' data-toggle='modal' data-target='#readme' id='readme_button'>Add 'README.md'</button>" +
        "<span style='padding-left:10px;float:center' id='commit_status'></span>");
    var $div = $('' +
        '<div class="action">' +
            '<form class="form-inline">' +
                '<div style="width:100%" class="form-group">' +
                    '<table style="width:100%">' +
                        '<tr>' +
                            '<td style="width:70px">' +
                                '<label for="filename">Filename</label></td>' +
                            '<td style="width:200px">' +
                                '<input type="text" class="form-control" id="filename" placeholder="Filename"></td>' +
                            '<td style="width:75px">' +
                                '<label for="code_message">Comment</label></td>' +
                            '<td>' +
                                '<input style="width:100%" type="text" class="form-control" id="code_message" placeholder="Input the comment for git commits"></td>' +
                        '</tr>' +
                    '</table>' +
                '</div>' +
            '</form>' +
        '</div>');
    var $modal =$('' +
        '<div class="modal fade" id="readme" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">' +
            '<div class="modal-dialog" role="document">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                        '<h4 class="modal-title" id="myModalLabel">README.md</h4>' +
                    '</div>' +
                    '<div class="modal-body">' +
                        'The following content will be commit to your Github repository.' +
                        '<textarea id="readme_content" class="form-control" rows="10"></textarea><br>' +
                        '<input id="readme_message" type="text" class="form-control" placeholder="Input comments for git commit">' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<span style="float:left" id="readme_alert"></span>' +
                        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                        '<button type="button" class="btn btn-primary" id="commit_readme">Commit</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>');
    var $code = $("" +
        "<textarea id='code_content' style='display:none'></textarea>");

    $("code-button").after($buttons);
    $("div.action").before($div);
    $("body").append($modal).append($code);
    $("#code_message").val(default_comment);

    /* Only by this, the variable in original page can be got.
    * Even using jQuery like before can not get the variable in original page */
    var script = document.createElement("script");
    script.innerHTML = "var lxk_editor = {};" +
        "$(function(){" +
            "$('.editor').attr('id', 'ace_editor_id');" +
            "lxk_editor = ace.edit('ace_editor_id');" +
            "get_code();" +
            "$('select[name=lang]').change(get_code);" +
            "$('#button0').click(get_code);" +
            "$('#button1').click(get_code);" +
        "});" +
        "function get_code() {" +
            "$('#code_content').val(lxk_editor.getValue());" +
        "}";
    document.body.appendChild(script);
}

function commit(from) {
    $("#commit_status").html("");
    var filename = "";
    if (from == "commit_readme") {
        filename = "README.md";
    } else if (from == "commit_question") {
        filename = "Question.md";
    } else {
        filename = get_filename();
    }
    filename = get_path() + "/" + filename;
    get_file(filename, update_file, update_file);
}

function restore() {
    var filename = "README.md";
    filename = get_path() + "/" + filename;
    get_file(filename, restore_file);
    $("#readme_message").val(default_comment);
}

function get_file(filename, fsucc, ferr) {
    $.ajax({
        url: github_api + '/repos/' + user  + '/' + repo + '/contents/' + filename,
        type: 'get',
        dataType: 'json',
        async: true,
        beforeSend: function(request) {
            request.setRequestHeader("Authorization", "token " + token);
        },
        success: function(jsonData) {
            if (typeof(jsonData)=='undefined' || !jsonData) jsonData = {};
            var sha = jsonData.sha;
            var file_content = jsonData.content;
            fsucc(filename, sha, file_content);
        },
        error: function(err) {
            if (err.status == 404) {
                if(typeof ferr === "function") {
                    ferr(filename);
                }
            } else {
                set_status(filename.substr(path.length + 1), repo, "err");
            }
        }
    });
}

function restore_file(filename, sha, file_content) {
    if (filename == get_path() + "/README.md") {
        $("#readme_content").val(Base64.decode(file_content));
    }
}

function update_file(filename, sha) {
    var path = get_path();
    var content = "";
    var message = "";
    if (filename == path + "/README.md") {
        content = $("#readme_content").val();
        message = $("#readme_message").val();
        if (message === "") {
            message = default_comment;
        }
        message = message.replace(/\{state\}/g, "");
    } else if (filename == path + "/Question.md") {
        content = "# " + $(".question-title:first").children(":first").html() + "\n\n";
        content += "[Original Page](" + window.location.href + ")\n\n";
        content += toMarkdown($(".question-content:first").html());
        message = default_comment.replace(/\{state\}/g, "");
    } else {
        content = $("#code_content").val();
        message = $("#code_message").val();
        if (message === "") {
            message = default_comment;
        }
    }
    message = parse_comment(message);

    $.ajax({
        url: github_api + '/repos/' + user  + '/' + repo + '/contents/' + filename,
        type: 'put',
        dataType: 'json',
        async: true,
        data: JSON.stringify({
            message: message,
            content: Base64.encode(content),
            sha: sha
        }),
        beforeSend: function(request) {
            request.setRequestHeader("Authorization", "token " + token);
        },
        success: function() {
            set_status(filename.substr(path.length + 1), repo, "succ");
        },
        error: function() {
            set_status(filename.substr(path.length + 1), repo, "err");
        }
    });
}

function set_status(filename, repo, status) {
    var $obj = filename == "README.md" ? $("#readme_alert") : $("#commit_status");
    if (status == "succ") {
        $obj.html('Commit "' + filename + '" to repository "' + repo + '" successfully');
        $obj.css("color", "green");
        setTimeout(function() {
            $obj.html("");
        }, 10000);
    } else {
        $obj.html("Fail to commit " + filename);
        $obj.css("color", "red");
    }
}

function get_path() {
    return $(".question-title:first").children(":first").html().replace(/ /g, "-").replace(/\./g, "");
}

function get_filename() {
    var filename;
    filename = $("#filename").val();
    if (filename === "") {
        var ext = get_extension();
        filename = "solution" + ext;
    }
    return filename;
}

function get_extension() {
    var ext = postfix[$("select[name=lang]").val()];
    if (!ext) {
        ext = ".code";
    }
    return ext;
}

function get_state(button) {
    var state = "";
    if (button === "submit") {
        state = $("#result-state").html().replace(/(^\s*)|(\s*$)/g, "").toLocaleLowerCase();
    } else if (button === "run") {
        state = $("#result_state").html().replace(/(^\s*)|(\s*$)/g, "").toLocaleLowerCase();
    } else {
        return;
    }
    if (state === "" || state === "pending" || state === "judging" || state === "failed") {
        state = "";
    }
    return state;
}

function parse_comment(comment) {
    var title = $(".question-title:first").children(":first").html();
    var state = $("#result-state").html().replace(/(^\s*)|(\s*$)/g, "");
    return comment.replace(/\{title\}/g, title).replace(/\{state\}/g, state);
}

function upload_problem() {
    var problem = {};
    problem.title = $(".question-title:first").children(":first").html().replace(/^\d+\. */, "");
    problem.url = window.location.href;
    problem.content = Base64.encode($(".question-content:first").html());
    problem.difficulty = $(".total-submit:last strong").html();
    problem.companies = [];
    problem.tags = [];
    $(".hidebutton:eq(-2) a").each(function() {
        problem.tags.push($(this).html());
    });
    var contributor = {};
    contributor.github = user;

    var data = {};
    data.problem = problem;
    data.md5 = md5(JSON.stringify(problem));
    //data.locked = false;
    data.contributor = contributor;
    data.version = chrome.runtime.getManifest().version;
    data.create_time = new Date();

    $.ajax({
        url: "https://chrome-ext.luxiakun.com/leetcode-ext/problem",
        type: 'post',
        contentType: "application/json",
        dataType: 'json',
        async: true,
        data: JSON.stringify(data),
        success: function (jsonData) {
        },
        error: function(err) {
            console.log(err);
        }
    });
}