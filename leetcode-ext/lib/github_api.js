/**
 * Created by binarylu on 4/9/16.
 */

// constructor
function github_op() {
    // private property
    var github_api = "https://api.github.com";
    var client_id = global_config.client_id;
    var client_secret = global_config.client_secret;

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

var token_fetcher = (function() {
    var client_id = global_config.client_id;
    var client_secret = global_config.client_secret;
    var redirect_uri = "https://" + chrome.runtime.id + ".chromiumapp.org/leetcode-ext";
    var reg = new RegExp(redirect_uri + '[#\?](.*)');
    var oauth_url = "https://github.com/login/oauth/authorize?client_id=" + client_id +
        "&scope=public_repo,repo" +
        "&redirect_uri=" + encodeURIComponent(redirect_uri);

    var access_token = null;

    return {
        get_token: function(interactive, callback) {
            // If access_token has already been got, just return it
            //console.log("get_token");
            if (access_token) {
                callback(null, access_token);
                return;
            }

            chrome.identity.launchWebAuthFlow({
                'url': oauth_url,
                'interactive': interactive
            }, function (redirect) {
                if (chrome.runtime.lastError) {
                    callback(new Error(chrome.runtime.lastError));
                    return;
                }
                var matches = redirect.match(reg);
                if (matches && matches.length > 1) {
                    handle_response(parse_parameter(matches[1]));
                } else {
                    callback(new Error('Invalid redirect URI'));
                }
            });

            function parse_parameter(query) {
                var pairs = query.split(/&/);
                var values = {};

                pairs.forEach(function(pair) {
                    var nameval = pair.split(/=/);
                    values[nameval[0]] = nameval[1];
                });

                return values;
            }

            function handle_response(values) {
                //console.log("handle_response");
                if (values.hasOwnProperty('access_token')) {
                    set_access_token(values.access_token);
                } else if (values.hasOwnProperty('code')) {
                    exchange_code(values.code);
                } else {
                    callback(new Error('Neither access_token nor code avialable.'));
                }
            }

            function set_access_token(token) {
                //console.log("set_access_token");
                access_token = token;
                callback(null, access_token);
            }

            function exchange_code(code) {
                //console.log("exchange_code");
                $.ajax({
                    url: "https://github.com/login/oauth/access_token",
                    type: 'post',
                    dataType: 'json',
                    async: true,
                    data: JSON.stringify({
                        client_id: client_id,
                        client_secret: client_secret,
                        code: code,
                        redirect_uri: redirect_uri
                    }),
                    headers: {
                        "Accept": "application/json",
                        'content-type':'application/json'
                    },
                    success: function(jsonData) {
                        if (typeof(jsonData)=='undefined' || !jsonData) jsonData = {};
                        set_access_token(jsonData.access_token);
                        // var at = jsonData.access_token;
                        // var scope = jsonData.scope;
                        // console.log(jsonData);
                        // console.log("access_token: " + at);
                        // console.log("scope: " + scope);
                    },
                    error: function(err) {
                        callback(err);
                    }
                });
            }
        },
        logout: function() {
            $.ajax({
                url: "https://api.github.com/applications/" + client_id + "/tokens/" + access_token,
                type: 'delete',
                dataType: 'json',
                async: true,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader ("Authorization", "Basic " + btoa(client_id + ":" + client_secret));
                },
                success: function() {
                    access_token = null;
                },
                error: function(err) {
                    console.log("Failed to logout");
                    console.log(err);
                }
            });
        },
        check_token: function(callback) {

        }
    };
})();