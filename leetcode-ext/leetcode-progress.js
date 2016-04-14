/**
 * Created by binarylu on 3/15/16.
 */

var url = "https://chrome-ext.luxiakun.com/leetcode-ext/all_problems";

var lxk_chart = {};
var tag_data = {};

$(function() {
    chrome.storage.sync.get({
        progress: 'show',
        hide_locked: 0
    }, function(items) {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        add_check();
        $("#hide_locked").prop("checked", items.hide_locked === 0 ? false : true);
        if (items.progress !== "hide") {
            add_chart();
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function ()
            {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
                {
                    lxk_chart = init_chart();

                    tag_data = JSON.parse(xmlhttp.responseText);
                    update_statistic(tag_data);
                }
            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        } else {
            update_statistic(tag_data);
        }
    });
});

function add_check() {
    var $check = '<div class="row col-md-4"><div class="checkbox" style="margin: 5px 15px">' +
        '<label>' +
            '<input type="checkbox" id="hide_locked" checked="false"> Hide locked problems' +
        '</label>' +
    '</div></div>';
    $(".blog-main .row:nth-child(2)").after($check);
    $("#hide_locked").click(hide_locked);
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

function hide_locked() {
    var hide_locked = $("#hide_locked").prop("checked") === true ? 1 : 0;
    chrome.storage.sync.set({
        hide_locked: hide_locked
    }, function() {
        if(chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        update_statistic(tag_data);
    });
}

function update_statistic(jsonData) {
    var tag_ac = {};
    var tag_nac = {};
    var difficulty_ac = {};
    var difficulty_nac = {};
    var hide_locked = $("#hide_locked").prop("checked") === true ? 1 : 0;
    $("#problemList tbody tr").each(function() {
        var problem = $(this).children("td:eq(2)").children("a:first").html();
        var ac = $(this).children("td:eq(0)").children("span:first").attr("class");
        var locked = $(this).children("td:eq(2)").children("i").length == 0 ? 0 : 1;

        if (hide_locked === 1 && locked === 1) {
            $(this).hide();
            return true;
        }
        $(this).show();

        //if (typeof(jsonData[problem]) == "undefined" || !jsonData[problem]) return true; // same with continue in js for
        if (typeof(jsonData[problem]) == "undefined" || !jsonData[problem]) {
            jsonData[problem] = {};
        }

        var tags = jsonData[problem].tags;
        if (typeof(tags) == "undefined" || !tags) {
            tags = [];
        }

        for (var j = 0; j < tags.length; ++j) {
            var tag = tags[j];
            if (typeof(tag_ac[tag]) == 'undefined' || !tag_ac[tag]) tag_ac[tag] = 0;
            if (typeof(tag_nac[tag]) == 'undefined' || !tag_nac[tag]) tag_nac[tag] = 0;
            tag_ac[tag] += ac == "ac" ? 1 : 0;
            tag_nac[tag] += ac == "ac" ? 0 : 1;
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

    if ($.isEmptyObject(jsonData) !== true) {
        draw_bar(tag_ac, tag_nac);
        draw_chart(difficulty_ac, difficulty_nac);
        var ac = difficulty_ac.Easy + difficulty_ac.Medium + difficulty_ac.Hard;
        var nac = difficulty_nac.Easy + difficulty_nac.Medium + difficulty_nac.Hard;
        change_summary(ac, nac);
    }
}

function draw_bar(tag_ac, tag_nac) {
    $(".sidebar-module:eq(4)").children("ul:first").children(":gt(0)").each(function() {
        var tag = $(this).children("small").html();

        if (typeof(tag_ac[tag]) == 'undefined' || !tag_ac[tag]) tag_ac[tag] = 0;
        if (typeof(tag_nac[tag]) == 'undefined' || !tag_nac[tag]) tag_nac[tag] = 0;
        var total = tag_ac[tag] + tag_nac[tag];
        var ac = tag_ac[tag];
        var percent = total == 0 ? 100 : Math.floor(ac / total * 100);

        $(this).children("span").html(ac + "/" + total);
        $(this).children("div").remove();
        var $bar = $('<div style="position:absolute;top:0;left:0;width:' + percent + '%;height:100%;background:green;opacity:0.15;">' +
            '</div>');
        $(this).append($bar);
    });
}

function draw_chart(difficulty_ac, difficulty_nac) {
    lxk_chart.series[0].setData([difficulty_nac.Easy, difficulty_nac.Medium, difficulty_nac.Hard]);
    lxk_chart.series[1].setData([difficulty_ac.Easy, difficulty_ac.Medium, difficulty_ac.Hard]);
}

function change_summary(ac, nac) {
    $("#brief_stats strong").html(ac + " / " + Number(ac + nac));
}

function init_chart() {
    //$('#lxk_chart').highcharts({
    return new Highcharts.Chart({
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
            name: 'Unsolved'
        },
        {
            name: 'Solved'
        }],
        credits: {
            enabled: false
        }
    });
}