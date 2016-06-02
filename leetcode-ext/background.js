/**
 * Created by binarylu on 4/28/16.
 */

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.runtime.openOptionsPage();
        //chrome.tabs.create({url: "chrome://extensions/?options=" + chrome.runtime.id});
    } else if (details.reason === "update") {
        var currentVersion = chrome.runtime.getManifest().version;
        var notificationId = "leetcode-ext-upgrade";
        var notification = {
            type: "basic",
            title: "LeetCode Extension Upgrade",
            message: "Upgrade to version " + currentVersion + ". \nClick here for more information.",
            iconUrl: chrome.runtime.getURL("icons/icon128.png"),
            isClickable: true
        };
        chrome.notifications.create(notificationId, notification, function(notificationId) {
            return chrome.notifications.onClicked.addListener(function(notificationId) {
                chrome.tabs.create({url: "https://github.com/binarylu/leetcode-ext#release-notes"});
            });
        });
    }
});