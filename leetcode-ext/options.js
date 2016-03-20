/**
 * Created by binarylu on 3/18/16.
 */

var github_api = 'https://api.github.com';

$(function() {
    restore_options();
    $('#token_save').click(save_token);
    $('#repo_create').click(create_repo);
});

function restore_options() {
    chrome.storage.sync.get({
        token: '',
        repo_name: '',
        repo_private: 0
    }, function(items) {
        $("#token").val(items.token);
        $("#repo_name").val(items.repo_name);
        $("input:radio[name=repo_private]")[items.repo_private].checked = true;
        check_token("");
    });
}

function save_token() {
    var token = $("#token").val();
    chrome.storage.sync.set({
        token: token,
    }, function() {
        set_status("token saved", "succ");
        check_token("token works");
    });
}

function check_token(tips) {
    if (!tips) {
        tips = "";
    }
    var token = $("#token").val();
    if (token != "") {
        get_user(token, function (jsonData) {
            if (typeof(jsonData) == 'undefined' || !jsonData) jsonData = {};
            var user = jsonData['login'];
            chrome.storage.sync.set({
                user: user
            }, function () {
                set_status(tips, "succ");
            });
        });
    } else {
        chrome.storage.sync.set({
            user: ""
        });
    }
}

function create_repo() {
    chrome.storage.sync.get({
        token: '',
        user: ''
    }, function(items) {
        var token = items.token;
        var user = items.user;
        var repo_name = $("#repo_name").val().replace(/ /g, '-');
        var repo_private = $("input:radio[name=repo_private]:checked").val();
        $.ajax({
            url: github_api + '/user/repos',
            type: 'post',
            dataType: 'json',
            async: true,
            data: JSON.stringify({
                name: repo_name,
                private: repo_private == 1,
                description: 'This is a leetcode repository created by leetcode-ext',
                homepage: 'https://chrome.google.com/webstore/detail/leetcode-ext/eomonjnamkjeclchgkdchpabkllmbofp?utm_source=chrome-ntp-icon'
            }),
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", "token " + token);
            },
            success: function (jsonData) {
                if (typeof(jsonData) == 'undefined' || !jsonData) jsonData = {};
                var name  = jsonData['name'];
                var pri = jsonData['private'] == true ? 1 : 0;
                var url = jsonData['html_url'];
                var user = jsonData['owner']['login'];
                chrome.storage.sync.set({
                    repo_name: name,
                    repo_private: pri,
                    user: user
                }, function() {
                    var content = pri == 1 ? 'Private' : 'Public';
                    content += ' repository "' + name + '" has been created. URL: ';
                    content += '<a href="' + url + '">' + url + '</a>';
                    set_status(content, "succ");
                    create_file();
                });
            },
            error: function() {
                var content = "Fail to create repository! Check your github to ensure there is no repository with the same name.";
                set_status(content, "err");
            }
        });
    });
}

function create_file() {
    var filename = "README.md";
    var content = "This is a repository created by [leetcode-ext](https://chrome.google.com/webstore/detail/leetcode-ext/eomonjnamkjeclchgkdchpabkllmbofp?utm_source=chrome-ntp-icon). Codes here are commited from leetcode.com.";
    var message = "Initialized by leetcode-ext";
    chrome.storage.sync.get({
        token: '',
        user: '',
        repo_name: ''
    }, function(items) {
        var token = items.token;
        var user = items.user;
        var repo = items.repo_name;
        $.ajax({
            url: github_api + '/repos/' + user  + '/' + repo + '/contents/' + filename,
            type: 'put',
            dataType: 'json',
            async: true,
            data: JSON.stringify({
                message: message,
                content: Base64.encode(content)
            }),
            beforeSend: function(request) {
                request.setRequestHeader("Authorization", "token " + token);
            },
            success: function() {
                set_status("Create README.md successfully.", "succ");
            },
            error: function() {
                set_status("Fail to create README.md", "err");
            }
        });
    });
}

function get_user(token, callback) {
    $.ajax({
        url: github_api + '/user',
        type: 'get',
        dataType: 'json',
        async: true,
        beforeSend: function(request) {
            request.setRequestHeader("Authorization", "token " + token);
        },
        success: callback,
        error: function() {
            chrome.storage.sync.set({
                user: ""
            });
            set_status("Fail to get user, wrong token.", "err");
        }
    });
}

function set_status(content, status) {
    if (!content) {
        return false;
    }
    var $obj = $("#status");
    if (status == "succ") {
        var old = "";
        if ($obj.attr("class") == "succ") {
            old = $obj.html() + "<br>";
        }
        $obj.html(old + content);
        $obj.attr("class", "succ");
        $obj.show();
        setTimeout(function() {
            $obj.attr("class", "");
            $obj.html("");
            $obj.hide();
        }, 5000);
    } else {
        $obj.html(content);
        $obj.attr("class", "err");
    }
}
