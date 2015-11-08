(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('fullTextResults', fullTextResults)

    function fullTextResults($http, $timeout, $log, $location, URL) {
        return {
            restrict: 'E',
            templateUrl: 'components/fullTextResults/fullTextResults.html',
            link: function(scope, element, attrs) {
                var formData = $location.search();

                var urlString = URL.objectToString(formData)
                $http.get('DiggingIntoData/api/fulltext?' + urlString).then(function(response) {
                    scope.fullTextResults = response.data;
                    // usSpinnerService.stop('spinner-1');
                });




                scope.displayLimit = 20;
                scope.addMoreresults = function() {
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
})();
