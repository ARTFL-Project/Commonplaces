(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('uniqueAuthors', uniqueAuthors)
        .directive('timeline', timeline);

    function uniqueAuthors($http, $timeout, $log, URL) {
        return {
            restrict: 'E',
            templateUrl: 'components/passageResults/uniqueAuthors.html',
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
        return {
            restrict: 'E',
            templateUrl: 'components/passageResults/timeline.html',
            link: function(scope, element) {
                scope.timeline = scope.passageResults.results.titleList;
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
                        title = titleSplit.slice(0, titleSplit.length-1).join(" ") + " [...]";
                    }
                    return title;
                }
            }
        }
    }
})();
