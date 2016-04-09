/**
 * Created by binarylu on 4/9/16.
 */

// constructor
function github_op() {
    // private property
    var github_api = "https://api.github.com";
    var client_id = "9f615c27bfa5009a2694";
    var client_secret = "17695ffdb8bba39d4519a6e0a10d2f9086cf7654";

    var _token = "";
    var _user = "";
    var _repo_name = "";

    // public function
    /*
     * callback(err, token, scopes, user)
     */
    this.set_token = function(token, callback) {
        $.ajax({
            url: github_api + '/applications/' + client_id + '/tokens/' + token,
            type: 'get',
            dataType: 'json',
            async: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", "Basic " + btoa(client_id + ":" + client_secret));
            },
            success: function(jsonData) {
                if (typeof(jsonData)=='undefined' || !jsonData) jsonData = {};
                _token = jsonData.token;
                _user = jsonData.user.login;
                callback(null, jsonData.token, jsonData.scopes, jsonData.user.login);
            },
            error: function(err) {
                _token = "";
                _user = "";
                callback(err, token);
            }
        });
    }

    /*
     * callback(err, username);
     */
    this.get_user = function(callback) {
        $.ajax({
            url: github_api + '/user',
            type: 'get',
            dataType: 'json',
            async: true,
            beforeSend: function(request) {
                request.setRequestHeader("Authorization", "token " + _token);
            },
            success: function(jsonData) {
                if (typeof(jsonData)=='undefined' || !jsonData) jsonData = {};
                _user = jsonData.login;
                callback(null, jsonData.login);
            },
            error: function(err) {
                callback(err);
            }
        });
    };

    /*
     * parameter: repo_info = {repo_name: "", repo_private: ""}
     * callback(err, repo_name, pri, url, user)
     */
    this.create_repo = function(repo_info, callback) {
        $.ajax({
            url: github_api + '/user/repos',
            type: 'post',
            dataType: 'json',
            async: true,
            data: JSON.stringify({
                name: repo_info.repo_name,
                private: repo_info.repo_private == 1,
                description: 'This is a leetcode repository created by LeetCode Extension',
                homepage: 'https://chrome.google.com/webstore/detail/leetcode-extension/eomonjnamkjeclchgkdchpabkllmbofp'
            }),
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", "token " + _token);
            },
            success: function (jsonData) {
                if (typeof(jsonData) == 'undefined' || !jsonData) jsonData = {};
                var repo_name  = jsonData.name;
                var pri = jsonData.private == true ? 1 : 0;
                var url = jsonData.html_url;
                var user = jsonData.owner.login;
                _repo_name = repo_name;
                callback(null, repo_name, pri, url, user);
            },
            error: function() {
                callback(err, repo_info.repo_name, repo_info.private);
            }
        });
    };

    /*
     * parameter: repo_name
     * callback(err, repo_name, pri, user, url)
     */
    this.get_repo = function(repo_name, callback) {
        if (_user === "") {
            callback("There is no available user name.");
        } else {
            $.ajax({
                url: github_api + '/repos/' + _user + '/' + repo_name,
                type: 'get',
                dataType: 'json',
                async: true,
                beforeSend: function (request) {
                    request.setRequestHeader("Authorization", "token " + _token);
                },
                success: function (jsonData) {
                    if (typeof(jsonData) == 'undefined' || !jsonData) jsonData = {};
                    var repo_name = jsonData.name;
                    var pri = jsonData.private === true ? 1 : 0;
                    var url = jsonData.html_url;
                    var user = jsonData.owner.login;
                    _repo_name = repo_name;
                    callback(null, repo_name, pri, user, url);
                },
                error: function (err) {
                    callback(err, repo_name);
                }
            });
        }
    };

    /*
     * parameter: filename (include the path)
     * callback(err, filename, sha, file_content)
     */
    this.get_file = function(filename, callback) {
        if (_user === "" || _repo_name === "") {
            callback("There is no available user or repository name.");
        } else {
            $.ajax({
                url: github_api + '/repos/' + _user  + '/' + _repo + '/contents/' + filename,
                type: 'get',
                dataType: 'json',
                async: true,
                beforeSend: function(request) {
                    request.setRequestHeader("Authorization", "token " + _token);
                },
                success: function(jsonData) {
                    if (typeof(jsonData)=='undefined' || !jsonData) jsonData = {};
                    var filename = jsonData.path;
                    var sha = jsonData.sha;
                    var file_content = jsonData.content;
                    callback(null, filename, sha, file_content);
                },
                error: function(err) {
                    callback(err, filename);
                }
            });
        }
    };

    /*
     * parameter: file_info = {filename: "", message: "", content: "", sha: ""}
     * callback(err);
     */
    this.commit_file = function(file_info, callback) {
        if (_user === "" || _repo_name === "") {
            callback("There is no available user or repository name.");
        } else {
            if (typeof(file_info.sha) == 'undefined') file_info.sha = null;
            $.ajax({
                url: github_api + '/repos/' + _user + '/' + _repo_name + '/contents/' + file_info.filename,
                type: 'put',
                dataType: 'json',
                async: true,
                data: JSON.stringify({
                    message: file_info.message,
                    content: Base64.encode(file_info.content),
                    sha: file_info.sha
                }),
                beforeSend: function (request) {
                    request.setRequestHeader("Authorization", "token " + _token);
                },
                success: function () {
                    callback(null)
                },
                error: function (err) {
                    callback(err);
                }
            });
        }
    };
}