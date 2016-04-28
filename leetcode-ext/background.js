/**
 * Created by binarylu on 4/28/16.
 */

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.runtime.openOptionsPage();
        //chrome.tabs.create({url: "chrome://extensions/?options=" + chrome.runtime.id});
    }
});