/** * Created by sly on 14-6-27. */var defaultColors = ['rgb(47,179,202)', 'rgb(241, 86, 79)', 'rgb(246,150,84)', 'rgb(252,238,33)', 'rgb(124,188,30)'];function getTimeFromRecord(record) {    return new Date(record.year, record.month - 1, record.day, record.hour, record.minute, record.second).getTime();}// Initialise sparklines/* *	Copy the each() function for each sparkline you have * 	e.g. $('#spark-1').each(function(){.....} */$(function () {    $('.widget[data-type=1]').each(function () {        var config = $(this).data('config');        var latestRecordId = {};        Highcharts.setOptions({            global: {                useUTC: false            }        });        var $container = $(this).find('.content');        config.dataInfos = config.dataInfos || [];        var promises = config.dataInfos.map(function (dataInfo, index) {            return $.get(                    '/api/data_sources/' + dataInfo.id            ).then(function (dataSource) {                    return $.get(                            '/api/data_sources/' + dataInfo.id + '/records?limit=' + config.limit                    ).then(function (resp) {                            var lineOpt = {};                            lineOpt.name = dataSource.name;                            index = index >= defaultColors.length ? (index % defaultColors.length) : index;                            lineOpt.color = defaultColors[index];                            lineOpt.data = [];                            resp = resp || [];                            latestRecordId[dataSource.name] = resp[0].id;                            resp.reverse().forEach(function (record) {                                lineOpt.data.push({                                    x: getTimeFromRecord(record),                                    y: record.value                                });                            });                            return lineOpt;                        }                    );                });        });        $.when.apply(null, promises).done(function () {            var dataSeries = Array.prototype.slice.apply(arguments);            $container.highcharts({                chart: {                    backgroundColor: '#2b2b2b',                    type: 'spline',                    animation: Highcharts.svg, // don't animate in old IE                    marginRight: 10,                    events: {                        load: function () {                            var series = this.series;                            // set up the updating of the chart each second                            setInterval(function () {                                config.dataInfos.forEach(function (dataInfo, idx) {                                    $.get(                                            '/api/data_sources/' + dataInfo.id,                                        function (dataSource) {                                            $.get(                                                    '/api/data_sources/' + dataInfo.id + '/records?limit=' + config.limit,                                                function (resp) {                                                    var flag = false;                                                    resp.reverse().filter(function (record) {                                                        if (record.id === latestRecordId[dataSource.name]) {                                                            flag = true;                                                            return false;                                                        }                                                        if (flag) {                                                            series[idx].addPoint([getTimeFromRecord(record), record.value], true, true);                                                        }                                                    });                                                    latestRecordId[dataSource.name] = resp[resp.length - 1].id;                                                });                                        });                                });                            }, config.reloadInterval);                        }                    }                },                title: {                    text: ''                },                xAxis: {                    type: 'datetime',                    tickPixelInterval: 150,                    lineColor: 'rgb(102, 108, 103)'                },                yAxis: {                    title: null,                    gridLineColor: null,                    plotLines: null                },                tooltip: {                    crosshairs: true,                    shared: true                },                legend: {                    layout: 'vertical',                    align: 'left',                    verticalAlign: 'top',                    y: 0,                    floating: true,                    borderWidth: 0,                    itemStyle: {                        color: 'lightgray'                    }                },                exporting: {                    enabled: false                },                series: dataSeries,                plotOptions: {                    spline: {                        colors: defaultColors,                        dataLabels: {                            enabled: true,                            color: 'lightgray',                            formatter: function () {                                if (this.point.x === this.series.data[this.series.data.length - 1].x) {                                    return this.y;                                } else {                                    return null;                                }                            }                        }                    }                }            });        });    });});