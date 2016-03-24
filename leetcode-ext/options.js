/**
 * Created by binarylu on 3/18/16.
 */

var github_api = 'https://api.github.com';

$(function() {
    restore_options();
    $("#token_save").click(save_token);
    $("#repo_add").click(save_repo);
    // $("#repo_name").on("input", function() {
    //     if ($.trim($("#repo_name").val()) === "") {
    //         $("#repo_add").attr("disabled",true);
    //     } else {
    //         $("#repo_add").attr("disabled",false);
    //     }
    // });
    $("input:radio[name=commit]").change(save_commit);
    $("input:radio[name=ac_difficulty]").change(save_ac_difficulty);
    $("#comment").on("input", save_comment);
});

function restore_options() {
    chrome.storage.sync.get({
        token: '',
        repo_name: '',
        repo_private: 0,
        commit: 'any',
        ac_difficulty: 'show',
        comment: ''
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        $("#token").val(items.token);
        $("#repo_name").val(items.repo_name);
        $("input:radio[name=repo_private]")[items.repo_private].checked = true;
        $('input[name="commit"]').each(function() {
            if (this.value == items.commit) {
                this.checked = true;
            } else {
                this.checked = false;
            }
        });
        $('input[name="ac_difficulty"]').each(function() {
            if (this.value == items.ac_difficulty) {
                this.checked = true;
            } else {
                this.checked = false;
            }
        });
        check_token("");
        check_repository("", false);

        var comment = items.comment;
        if (comment === "") {
            comment = "[{title}][{state}]committed by LeetCode Extension";
        }
        $("#comment").val(comment);
    });
}

function save_token() {
    var token = $.trim($("#token").val());
    if (token === "") {
        chrome.storage.sync.set({
            token: "",
            user: ""
        }, function() {
            if(chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
                return;
            }
            $("#repo_add").attr("disabled", true);
            set_status("Token is cleared.", "succ");
        });
    } else {
        check_token("Token works");
    }
}

function save_repo() {
    var repo_name = $.trim($("#repo_name").val()).replace(/ /g, '-');
    if (repo_name === "") {
        chrome.storage.sync.set({
            repo_name: "",
            repo_private: 0
        }, function() {
            if(chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
                return;
            }
            set_status("Repository is cleared. Repository will neither be created nor be deleted.", "succ");
        });
    } else {
        var tip = 'Add repository "' + repo_name + '" successfully.';
        check_repository(tip, true);
    }
}

function save_commit() {
    var ci = $("input:radio[name=commit]:checked").val();
    chrome.storage.sync.set({
        commit: ci
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
    });
}

function save_ac_difficulty() {
    var ac = $("input:radio[name=ac_difficulty]:checked").val();
    chrome.storage.sync.set({
        ac_difficulty: ac
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
    });
}

function save_comment() {
    var comment = $("#comment").val();
    if (comment === "") {
        comment = "[{title}][{state}]committed by LeetCode Extension";
    }
    chrome.storage.sync.set({
        comment: comment
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
    });
}

function check_token(tips) {
    if (!tips) {
        tips = "";
    }
    var token = $.trim($("#token").val());
    if (token === "") {
        chrome.storage.sync.set({
            token: "",
            user: ""
        });
        $("#repo_add").attr("disabled",true);
    } else {
        get_user(token, function (jsonData) {
            if (typeof(jsonData) == 'undefined' || !jsonData) jsonData = {};
            var user = jsonData.login;
            chrome.storage.sync.set({
                token: token,
                user: user
            }, function () {
                if(chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    return;
                }
                $("#repo_add").attr("disabled",false);
                set_status(tips, "succ");
            });
        });
    }
}

function check_repository(tips, do_create) {
    if (!tips) {
        tips = "";
    }
    var repo_name = $.trim($("#repo_name").val()).replace(/ /g, '-');
    if (repo_name === "") {
        chrome.storage.sync.set({
            repo_name: ""
        });
    } else  {
        get_repo({
            repo_name: repo_name,
            success: function(name, pri, user) {
                chrome.storage.sync.set({
                    repo_name: name,
                    repo_private: pri,
                    user: user
                }, function () {
                    if(chrome.runtime.lastError) {
                        console.log(chrome.runtime.lastError.message);
                        return;
                    }
                    $("#repo_name").val(name);
                    $("input:radio[name=repo_private]")[pri].checked = true;
                    set_status(tips, "succ");
                });
            },
            error: function(err) {
                if (do_create) {
                    if (err['status'] == 404) {
                        create_repo();
                    } else {
                        set_status('Failed to add reporitory "' + repo_name + '".', "err");
                    }
                } else {
                    set_status('Repository "' + repo_name + '" is not available.', "err");
                }
            }
        });
    }
}

function create_repo() {
    chrome.storage.sync.get({
        token: '',
        user: ''
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        var token = items.token;
        var user = items.user;
        var repo_name = $.trim($("#repo_name").val()).replace(/ /g, '-');
        var repo_private = $("input:radio[name=repo_private]:checked").val();
        $.ajax({
            url: github_api + '/user/repos',
            type: 'post',
            dataType: 'json',
            async: true,
            data: JSON.stringify({
                name: repo_name,
                private: repo_private == 1,
                description: 'This is a leetcode repository created by LeetCode Extension',
                homepage: 'https://chrome.google.com/webstore/detail/leetcode-extension/eomonjnamkjeclchgkdchpabkllmbofp'
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
                    if(chrome.runtime.lastError) {
                        console.log(chrome.runtime.lastError.message);
                        return;
                    }
                    $("#repo_name").val(name);
                    $("input:radio[name=repo_private]")[pri].checked = true;
                    var content = pri == 1 ? 'Private' : 'Public';
                    content += ' repository "' + name + '" has been created. URL: ';
                    content += '<a href="' + url + '">' + url + '</a>';
                    set_status(content, "succ");
                    setTimeout(create_file(), 2000);
                });
            },
            error: function() {
                var content = "Failed to create repository! Make sure the token is correct and there is no repository with the same name.";
                set_status(content, "err");
            }
        });
    });
}

function create_file() {
    var filename = "README.md";
    var content = "This is a repository created by [LeetCode Extension](https://chrome.google.com/webstore/detail/leetcode-extension/eomonjnamkjeclchgkdchpabkllmbofp). Codes here are commited from leetcode.com.";
    var message = "Initialized by LeetCode Extension";
    chrome.storage.sync.get({
        token: '',
        user: '',
        repo_name: ''
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
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
                set_status("Failed to create README.md", "err");
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
            $("#repo_add").attr("disabled",true);
            set_status("Failed to get user, wrong token.", "err");
        }
    });
}

function get_repo(obj) {
    if (typeof(obj)=='undefined' || !obj) obj = {};
    var repo_name = obj.repo_name;
    var fsucc = obj.success;
    var ferr = obj.error;

    chrome.storage.sync.get({
        token: '',
        user: ''
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        var token = items.token;
        var user = items.user;
        $.ajax({
            url: github_api + '/repos/' + user + '/' + repo_name,
            type: 'get',
            dataType: 'json',
            async: true,
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", "token " + token);
            },
            success: function(jsonData) {
                if (typeof(jsonData)=='undefined' || !jsonData) jsonData = {};
                var name = jsonData.name;
                var pri = jsonData.private === true ? 1 : 0;
                var user = jsonData['owner']['login'];
                fsucc(name, pri, user);
            },
            error: function(err) {
                if(typeof ferr === "function") {
                    ferr(err);
                }
            }
        });
    });
}

var t;
function set_status(content, status) {
    if (content === "") {
        return false;
    }
    clearTimeout(t);
    var $obj = $("#status");
    if (status == "succ") {
        var old = "";
        if ($obj.attr("class") == "succ") {
            old = $obj.html() + "<br>";
        }
        $obj.html(old + content);
        $obj.attr("class", "succ");
        $obj.show();
        t = setTimeout(function() {
            $obj.attr("class", "");
            $obj.html("");
            $obj.hide();
        }, 5000);
    } else {
        $obj.html(content);
        $obj.attr("class", "err");
    }
}