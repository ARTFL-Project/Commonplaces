(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('fullTextResults', fullTextResults)

    function fullTextResults($http, $timeout, $log, $location, $routeParams, URL, sortEnd, sortKeys) {
        var getTotalCounts = function(scope) {
            var urlString = URL.objectToString(scope.main.formData);
            scope.waitingForCount = true;
            $http.get('api/'+ scope.dbname + '/fulltextcount?' + urlString).then(function(response) {
                scope.waitingForCount = false;
                scope.totalCount = response.data.totalCount;
            });
        }
        return {
            restrict: 'E',
            templateUrl: 'components/fullTextResults/fullTextResults.html',
            link: function(scope, element, attrs) {
                scope.main.queryType = "sharedPassages";
                scope.dbname = $routeParams.dbname;
                scope.main.dbActive = scope.dbname;
                scope.main.formData = angular.copy($location.search());
                scope.lastRow = 0;
                scope.loading = true;
                var urlString = URL.objectToString(scope.main.formData);
                scope.fullTextResults = {fullList: []};
                $http.get('api/' + scope.dbname + '/fulltext?' + urlString).then(function(response) {
                    scope.fullTextResults = response.data;
                    angular.element(".spinner").remove();
                    if (scope.fullTextResults.fullList != null) {
                        scope.lastRow += scope.fullTextResults.fullList.length;
                        $log.debug(scope.lastRow)
                    }
                    scope.loading = false;
                    getTotalCounts(scope);
                }).catch(function(response) {
                    scope.fullTextResults = {fullList: []};
                });
                scope.displayLimit = 40;
                scope.loadingData = false;
                scope.addMoreResults = function() {
                    scope.loadingData = true;
                    var formData = angular.copy(scope.main.formData);
                    if (typeof(scope.fullTextResults.fullList !== "undefined") && scope.lastRow != 0) {
                        formData.offset = scope.lastRow;
                        urlString = URL.objectToString(formData);
                        $http.get('api/' + scope.dbname + '/fulltext?' + urlString).then(function(response) {
                            scope.displayLimit += 40
                            Array.prototype.push.apply(scope.fullTextResults.fullList, response.data.fullList);
                            scope.lastRow += 40;
                            scope.loadingData = false;
                        });
                    }
                }
            }
        }
    }
})();
