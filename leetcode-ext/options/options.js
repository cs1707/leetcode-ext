/**
 * Created by binarylu on 3/18/16.
 */

var github_op = new github_op();

$(function() {
    restore_options();
    $("#login").click(oauth);
    $("#logout").click(logout);
    $("#repo_add").click(save_repo);
    $("input:checkbox[name=commit]").change(save_commit);
    $("input:radio[name=ac_difficulty]").change(save_ac_difficulty);
    $("input:radio[name=progress]").change(save_progress);
    $("input:radio[name=countdown]").change(save_countdown);
    $("#comment").on("input", save_comment);
});

function restore_options() {
    chrome.storage.sync.get({
        oauth_token: '',
        repo_name: '',
        repo_private: 0,
        commit: [],
        ac_difficulty: 'show',
        comment: '[{title}][{state}]committed by LeetCode Extension',
        progress: 'show',
        countdown: 'yes'
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        $("#repo_name").val(items.repo_name);
        $("input:radio[name=repo_private]")[items.repo_private].checked = true;

        $('input[name="commit"]').each(function() {
            if (typeof(items.commit) !== 'object') {
                this.checked = true;
            } else {
                this.checked = $.inArray($(this).val(), items.commit) !== -1;
            }
        });

        $('input[name="ac_difficulty"]').each(function() {
            this.checked = this.value == items.ac_difficulty;
        });
        $('input[name="progress"]').each(function() {
            this.checked = this.value == items.progress;
        });
        $('input[name="countdown"]').each(function() {
            this.checked = this.value == items.countdown;
        });
        $("#comment").val(items.comment);
        save_comment();

        if (items.oauth_token != "") {
            github_op.set_token(items.oauth_token, cb_check_token);
        }
    });
}

function oauth() {
    token_fetcher.get_token(true, function(err, token) {
        if (err) {
            chrome.storage.sync.set({
                oauth_token: "",
                user: ""
            });
            $("#repository_row").hide();
            console.log(err);
            return false;
        }
        github_op.set_token(token, cb_check_token);
    });
}

function logout() {
    chrome.storage.sync.get({
        oauth_token: ''
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        token_fetcher.logout(items.oauth_token);
        cb_check_token("logout:" + items.oauth_token);
        clear_status();
        chrome.storage.sync.set({
            oauth_token: "",
            user: ""
        });
    });
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
        github_op.get_repo(repo_name, cb_add_repo);
    }
}

function cb_check_token(err, token, scopes, user) {
    if (err) {
        chrome.storage.sync.set({
            oauth_token: "",
            user: ""
        });
        $("#repository_row").hide();
        $("#login_prompt").show();
        $("#logout_prompt").hide();
        console.log(err);
        return false;
    }
    chrome.storage.sync.set({
        oauth_token: token,
        user: user
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        if ($.inArray("repo", scopes) != -1) {
            $("[name='repo_private']").attr("disabled", false);
            $("#r_pub,#r_pri").attr("style", "color:black");
        } else if ($.inArray("public_repo", scopes) != -1) {
            $("[name='repo_private']:first").attr("disabled", false);
            $("[name='repo_private']:last").attr("disabled", true);
            $("[name='repo_private']:first").prop("checked", true);
            $("#r_pub").attr("style", "color:black");
            $("#r_pri").attr("style", "color:gray");
        } else {
            $("[name='repo_private']").attr("disabled", true);
            $("#r_pub,#r_pri").attr("style", "color:gray");
            set_status("'repo' permission is required.", "err");
        }
        $("#username").html(user);
        $("#login_prompt").hide();
        $("#logout_prompt").show();
        $("#repository_row").show();

        var repo_name = $("#repo_name").val();
        if (repo_name != "") {
            github_op.get_repo(repo_name, cb_check_repo);
        }
    });
}

function cb_check_repo(err, repo_name, pri, user) {
    if (err) {
        set_status('Repository "' + repo_name + '" is not available.', "err");
        console.log(err);
        return false;
    }
    chrome.storage.sync.set({
        repo_name: repo_name,
        repo_private: pri,
        user: user
    }, function () {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        $("#repo_name").val(repo_name);
        $("input:radio[name=repo_private]")[pri].checked = true;
    });
}

function cb_add_repo(err, repo_name, pri, user, url) {
    if (err) {
        if (err['status'] == 404) {
            var repo_private = $("input:radio[name=repo_private]:checked").val();
            github_op.create_repo({repo_name: repo_name, repo_private: repo_private}, cb_create_repo);
        } else {
            set_status('Failed to add reporitory "' + repo_name + '".', "err");
            console.log(err);
        }
        return false;
    }
    chrome.storage.sync.set({
        repo_name: repo_name,
        repo_private: pri,
        user: user
    }, function () {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        $("#repo_name").val(repo_name);
        $("input:radio[name=repo_private]")[pri].checked = true;
        var tip = pri == 1 ? 'Private' : 'Public';
        tip += ' repository "' + repo_name + '" has been added. URL: ';
        tip += '<a href="' + url + '">' + url + '</a>';
        set_status(tip, "succ");
    });
}

function cb_create_repo(err, repo_name, pri, url, user) {
    if (err) {
        var tip = "Failed to create repository! Make sure you grant 'repo' or 'public_repo' permission. If you are creating a private repository, make sure you have the permission to create a private repository.";
        set_status(tip, "err");
        console.log(err);
        return false;
    }
    chrome.storage.sync.set({
        repo_name: repo_name,
        repo_private: pri,
        user: user
    }, function () {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        $("#repo_name").val(repo_name);
        $("input:radio[name=repo_private]")[pri].checked = true;
        var tip = pri == 1 ? 'Private' : 'Public';
        tip += ' repository "' + repo_name + '" has been created. URL: ';
        tip += '<a href="' + url + '">' + url + '</a>';
        set_status(tip, "succ");
        setTimeout(add_readme(), 2000);
    });
}

function cb_commit_file(err) {
    if (err) {
        set_status("Failed to create README.md", "err");
        console.log(err);
        return false;
    }
    set_status("Create README.md successfully.", "succ");
}

function add_readme() {
    var filename = "README.md";
    var content = "This is a repository created by [LeetCode Extension](https://chrome.google.com/webstore/detail/leetcode-extension/eomonjnamkjeclchgkdchpabkllmbofp). Codes here are commited from leetcode.com.";
    var message = "Initialized by LeetCode Extension";
    github_op.commit_file({filename: filename, message: message, content: content, sha: null}, cb_commit_file);
}

function save_commit() {
    var ci = [];
    $('input[name="commit"]:checked').each(function(){
        ci.push($(this).val());
    });

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

function save_progress() {
    var pr = $("input:radio[name=progress]:checked").val();
    chrome.storage.sync.set({
        progress: pr
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
    });
}


function save_countdown() {
    var cd = $("input:radio[name=countdown]:checked").val();
    chrome.storage.sync.set({
        countdown: cd
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
    });
}

function save_comment() {
    var comment = $("#comment").val();
    chrome.storage.sync.set({
        comment: comment
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
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
        $obj.show();
    }
}

function clear_status() {
    $("#status").attr("class", "");
    $("#status").html("");
    $("#status").hide();
}