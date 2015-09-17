(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('uniqueAuthors', uniqueAuthors)
        .directive('timeline', timeline);

    function uniqueAuthors($http, $timeout, $log, URL) {
        return {
            restrict: 'E',
            templateUrl: 'components/mainResults/uniqueAuthors.html',
            link: function(scope, element, attrs) {
                scope.displayLimit = 20;
                scope.addMoreAuthors = function() {
                    scope.displayLimit += 20;
                    $log.debug(scope.displayLimit)
                }
                scope.getTitles = function($event, author, title) {
                    // $log.debug(author);
                    var newElement = angular.element($event.currentTarget).parent().siblings('.title-list');
                    var localParams = angular.copy(scope.mainResults.formData);
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
        var getTimeline = function(scope) {
            var titleList = scope.mainResults.results.titleList;
            var dates = {};
            for (var i = 0; i < titleList.length; i += 1) {
                var date = parseInt(titleList[i].date);
                if (!(date in dates)) {
                    dates[date] = [];
                }
                dates[date].push(titleList[i]);
            }
            var timeline = [];
            for (var key in dates) {
                timeline.push([key, dates[key]]);
            }
            timeline.sort(function(a, b) {
                var x = a[0];
                var y = b[0];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
            return timeline;
        }
        return {
            restrict: 'E',
            templateUrl: 'components/mainResults/timeline.html',
            link: function(scope, element) {
                scope.timeline = getTimeline(scope);
                scope.displayLimit = 5;
                scope.addMoreItems = function() {
                    scope.displayLimit += 5;
                    $log.debug(scope.displayLimit)
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
            }
        }
    }
})();
