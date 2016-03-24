/**
 * Created by binarylu on 3/24/16.
 */

window.onload = function() {
    var elements = document.getElementsByTagName("tr");
    for (var i = 0; i < elements.length; ++i) {
        elements[i].onclick=function(){
            chrome.tabs.create({url: this.getAttribute("href")});
        };
    }
};