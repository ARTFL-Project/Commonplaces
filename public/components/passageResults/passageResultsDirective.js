(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('uniqueTitles', uniqueTitles)
        .directive('timeline', timeline);

    function uniqueTitles($http, $timeout, $log, URL) {
        return {
            restrict: 'E',
            templateUrl: 'components/passageResults/uniqueTitles.html',
            link: function(scope, element, attrs) {
                scope.displayLimit = 20;
                scope.addMoreAuthors = function() {
                    scope.displayLimit += 20;
                }
                scope.getTitles = function($event, author, title) {
                    // $log.debug(author);
                    var newElement = angular.element($event.currentTarget).parent().siblings('.title-list');
                    var localParams = angular.copy(scope.passageResults.formData);
                    localParams.author = author;
                    localParams.not_title = title;
                    var urlString = URL.objectToString(localParams);
                    // $log.debug('DiggingIntoData/author?' + urlString);
                    var titleListElement = element.find('.title-list');
                    $http.get('DiggingIntoData/author?' + urlString).then(function(response) {
                        $log.debug(response.data);
                        var titleList = response.data;
                        var html = '<div class="list-group">';
                        for (var i = 0; i < titleList.length; i += 1) {
                            var title = titleList[i].title;
                            html += '<div class="list-group-item">'
                            html += '<h5 class="list-group-item-heading"><i>' + title + '</i>&nbsp;<b>[' + titleList[i].date + ']</b></h5>';
                            html += '<p class="list-group-item-text">' + titleList[i].leftContext;
                            html += '<span class="highlight">' + titleList[i].matchContext + '</span>';
                            html += titleList[i].rightContext + '</p>';
                            html += '</div>';
                        }
                        html += '</div>';
                        newElement.html(html);
                    });
                };
            }
        }
    }

    function timeline($log) {
        var getDecade = function(date) {
            date = date.toString().slice(0, -1) + '0';
            if (date == '-0') {
                date = '-10'
            }
            var startDate = parseInt(date);
            var endDate = startDate + 9
            var decade = startDate.toString() + '-' + endDate.toString();
            return decade;
        }
        return {
            restrict: 'E',
            templateUrl: 'components/passageResults/timeline.html',
            link: function(scope, element) {
                scope.timeline = scope.passageResults.results.titleList;
                Chart.defaults.global.maintainAspectRatio = false;
                Chart.defaults.global.showTooltips = false;
                scope.chartOptions = {
                    pointDotRadius : 1,
                    //scaleShowGridLines: false,
                    scaleGridLineColor : "rgba(256,256,256,.1)",
                     scaleShowVerticalLines: false,
                     bezierCurveTension : 0.1,
                    scaleFontColor: "rgba(256,256,256,1)"
                }
                scope.colours = [{ // default
                    "fillColor": "rgba(224, 108, 112, .2)",
                    "strokeColor": "rgba(207,100,103,1)",
                    "pointColor": "rgba(256,256,256,1)",
                    "pointStrokeColor": "#fff",
                    "pointHighlightFill": "#fff",
                    "pointHighlightStroke": "rgba(151,187,205,0.8)"
                }];
                scope.chartData = [
                    []
                ];
                scope.chartSeries = ["Overview of usage"];
                scope.chartLabels = [];
                var dateCounts = {};
                for (var i = 0; i < scope.timeline.length; i += 1) {
                    var decade = getDecade(scope.timeline[i].date);
                    if (!(dateCounts.hasOwnProperty(decade))) {
                        dateCounts[decade] = scope.timeline[i].result.length;
                        scope.chartLabels.push(decade);
                    } else {
                        dateCounts[decade] += scope.timeline[i].result.length;
                    }
                }
                for (var i=0; i < scope.chartLabels.length; i += 1) {
                    var decade = scope.chartLabels[i];
                    scope.chartData[0].push(dateCounts[decade]);
                    console.log(decade, dateCounts[decade])
                }
                $log.debug(scope.chartLabels)
                scope.displayLimit = 5;
                scope.addMoreItems = function() {
                    scope.displayLimit += 5;
                }
                scope.getCurrentPassage = function(event) {
                    var passageElement = angular.element(event.currentTarget).next('p');
                    if (passageElement.css('display') === 'none') {
                        passageElement.velocity('slideDown', 400, 'swing');
                        passageElement.velocity({
                            opacity: 1,
                            backgroundColor: '#fff'
                        }, {
                            delay: 100,
                            duration: 300,
                            queue: false
                        });
                    } else {
                        passageElement.velocity('slideUp', 400, 'swing');
                        passageElement.velocity({
                            opacity: 0,
                            backgroundColor: 'inherit'
                        }, {
                            delay: 100,
                            duration: 300,
                            queue: false
                        });
                    }
                }
                scope.formatTitle = function(title) {
                    if (title.length > 300) {
                        var titleSplit = title.slice(0, 300).split(' ');
                        title = titleSplit.slice(0, titleSplit.length - 1).join(" ") + " [...]";
                    }
                    return title;
                }
            }
        }
    }
})();
