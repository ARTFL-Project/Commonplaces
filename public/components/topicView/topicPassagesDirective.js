(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('topicPassages', topicPassages);

    function topicPassages($location, $http, $log, webConfig, $routeParams, URL) {
        var getTotalCounts = function(scope) {
            var urlString = "/api/" + $routeParams.dbname + "/topicCount/" + $routeParams.topicID;
            scope.waitingForCount = true;
            $http.get(urlString).then(function(response) {
                scope.waitingForCount = false;
                scope.totalCount = response.data.totalCount;
            });
        }
        return {
            templateUrl: 'components/topicView/topicPassages.html',
            link: function(scope) {
                var formData = $location.search();
                scope.main.queryType = "topicView";
                scope.dbname = $routeParams.dbname;
                scope.main.dbActive = scope.dbname;
                scope.debug = webConfig.debug;
                var topics = webConfig.databases[scope.main.dbActive].topics;
                scope.displayLimit = 50;
                scope.loading = true
                scope.currentPosition = 0
                var urlString = "/api/" + $routeParams.dbname + "/topic/" + $routeParams.topicID;
                var extraParams = URL.objectToString(formData);
                if (extraParams.length > 0) {
                    urlString += "?" + extraParams;
                }
                var promise = $http.get(urlString);
                promise.then(function(response) {
                    scope.main.hideSearchForm = true;
                    scope.currentTopic = topics[$routeParams.topicID];
                    scope.topicPassages = response.data.passages;
                    scope.wordsInTopic = response.data.words;
                    scope.loading = false;
                    scope.currentPosition += scope.topicPassages.length;
                    getTotalCounts(scope);
                });
                scope.loadingData = false;
                scope.addMoreResults = function() {
                    if (typeof(scope.topicPassages) !== "undefined" && scope.currentPosition != 0) {
                        scope.loadingData = true;
                        var formData = angular.copy($location.search());
                        formData.offset = scope.currentPosition;
                        var update = $http.get(urlString);
                        update.then(function(response) {
                            Array.prototype.push.apply(scope.topicPassages, response.data.passages);
                            scope.displayLimit += 100;
                            scope.loadingData = false;
                        });
                    }
                }
            }
        }
    }
})();
