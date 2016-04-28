/**
 * Created by binarylu on 3/24/16.
 */

$(function() {
    chrome.storage.sync.get({
        user: '',
        repo_name: ''
    }, function(items) {
        $("#menu").append($('<tr id="go_leetcode"><td>Go to LeetCode.com</td></tr>'));
        if (items.user !== "")
            $("#menu").append($('<tr id="go_github"><td>Go to Your GitHub Repository</td></tr>'));
        $("#menu").append($('<tr id="go_settings"><td style="border-top:1px solid lightgray;">Settings</td></tr>'));

        $("#go_leetcode").click(function() {
            chrome.tabs.create({url: "https://leetcode.com/problemset/algorithms/"});
        });
        $("#go_github").click(function() {
            chrome.tabs.create({url: "https://github.com/" + items.user + "/" + items.repo_name});
        });
        $("#go_settings").click(function() {
            chrome.runtime.openOptionsPage();
        });
    });
});