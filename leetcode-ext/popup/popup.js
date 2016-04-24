/**
 * Created by binarylu on 3/24/16.
 */

window.onload = function() {
    var elements = document.getElementsByTagName("tr");
    chrome.storage.sync.get({
        user: '',
        repo_name: ''
    }, function(items) {
        for (var i = 0; i < elements.length; ++i) {
            var url = "";
            elements[i].onclick=function(){
                if (this.id === 'go_leetcode') {
                    url = "https://leetcode.com/problemset/algorithms/";
                } else if (this.id === 'go_github') {
                    url = "https://github.com/" + items.user + "/" + items.repo_name;
                } else if (this.id === 'go_settings') {
                    url = "chrome://extensions/?options=" + chrome.runtime.id;
                }
                chrome.tabs.create({url: url});
            };
        }
    });
};