/**
 * Created by binarylu on 3/15/16.
 */

var url = "https://chrome-ext.luxiakun.com/leetcode-ext";

$(function() {
    chrome.storage.sync.get({
        progress: 'show'
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        add_chart();
        if (items.progress !== "hide") {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function ()
            {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
                {
                    var jsonData = JSON.parse(xmlhttp.responseText);
                    enhanced_tag(jsonData);
                }
            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        }
    });
});

function enhanced_tag(jsonData) {
    var taglist = {};
    var difficulty_ac = {};
    var difficulty_nac = {};
    $("#problemList").children().last().children().each(function() {
        var problem = $(this).children("td:nth-child(3)").children("a:first-child").html();
        var ac = $(this).children("td:nth-child(1)").children("span:first-child").attr("class");
        if (typeof(jsonData[problem]) == "undefined" || !jsonData[problem]) jsonData[problem] = "unknown";
        for (var j = 0; j < jsonData[problem].length; ++j) {
            var tag = jsonData[problem][j];
            if (typeof(taglist[tag]) == 'undefined' || !taglist[tag]) taglist[tag] = 0;
            taglist[tag] += ac == "ac" ? 1 : 0;
        }

        var difficulty = "";
        var $difficulty_node = $(this).children("td:nth-child(6)");
        if (typeof($difficulty_node.attr("ori_data")) == "undefined") {
            difficulty = $difficulty_node.html();
        } else {
            difficulty = $difficulty_node.attr("ori_data");
        }
        if (typeof(difficulty_ac[difficulty]) == 'undefined' || !difficulty_ac[difficulty]) difficulty_ac[difficulty] = 0;
        if (typeof(difficulty_nac[difficulty]) == 'undefined' || !difficulty_nac[difficulty]) difficulty_nac[difficulty] = 0;
        difficulty_ac[difficulty] += ac == "ac" ? 1 : 0;
        difficulty_nac[difficulty] += ac == "ac" ? 0 : 1;
    });

    var Tag = document.getElementsByClassName("sidebar-module")[4].children[0].children;
    for (var i = 1; i < Tag.length; ++i) {
        var total = Tag[i].children[0].innerHTML;
        var tag = Tag[i].children[1].innerHTML;
        var ac = taglist[tag];
        var percent = Math.floor(ac / total * 100);

        var node = document.createElement("div");
        var style = "position:absolute;top:0;left:0;width:" + percent + "%;height:100%;background:green;opacity:0.15;";
        node.setAttribute("style", style);
        Tag[i].childNodes[1].innerHTML = ac + "/" + total;
        Tag[i].appendChild(node);
    }
    draw_chart(difficulty_ac, difficulty_nac);
}

function add_chart() {
    var $chart = $('<div class="row sidebar-module">' +
        '<ul class="col-md-offset-3 col-md-9 list-group">' +
            '<li class="list-group-item list-group-item-warning">' +
                '<strong>' +
                    '<span class="glyphicon glyphicon-plane"></span>' +
                    '<span>&nbsp;Progress</span>' +
                '</strong>' +
            '</li>' +
            '<li class="list-group-item">' +
                '<div id="lxk_chart" style="margin: 0 auto">' +
                '</div>' +
            '</li>' +
        '</ul>' +
    '</div>');
    $(".sidebar-module:last").after($chart);
}

function draw_chart(difficulty_ac, difficulty_nac) {
    //$('#lxk_chart').highcharts({
    var chart = new Highcharts.Chart({
        chart: {
            type: 'column',
            renderTo: 'lxk_chart',
            height: 250
        },
        title: {
            text: ''
        },
        xAxis: {
            categories: ['Easy', 'Medium', 'Hard']
        },
        yAxis: {
            min: 0,
            title: {
                text: ''
            },
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                }
            },
            visible: false
        },
        tooltip: {
            headerFormat: '<b>{point.x}</b><br/>',
            pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                    style: {
                        textShadow: '0 0 3px black'
                    }
                }
            }
        },
        series: [{
            name: 'Unsolved',
            data: [difficulty_nac.Easy, difficulty_nac.Medium, difficulty_nac.Hard]
        },
        {
            name: 'Solved',
            data: [difficulty_ac.Easy, difficulty_ac.Medium, difficulty_ac.Hard]
        }]
    });
}