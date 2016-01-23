(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('fullTextResults', fullTextResults)

    function fullTextResults($http, $timeout, $log, $location, $routeParams, URL, sortEnd, sortKeys, usSpinnerService) {
        return {
            restrict: 'E',
            templateUrl: 'components/fullTextResults/fullTextResults.html',
            link: function(scope, element, attrs) {
                scope.dbname = $routeParams.dbname;
                scope.main.dbActive = scope.dbname;
                scope.main.formData = angular.copy($location.search());
                scope.lastRow = 0;
                var urlString = URL.objectToString(scope.main.formData);
                scope.fullTextResults = {fullList: []};
                $timeout(function() {
                    usSpinnerService.spin('spinner-1');
                }, 100);
                $http.get('api/' + scope.dbname + '/fulltext?' + urlString).then(function(response) {
                    scope.fullTextResults = response.data;
                    usSpinnerService.stop('spinner-1');
                    angular.element(".spinner").remove();
                    scope.lastRow += scope.fullTextResults.fullList.length;
                    // usSpinnerService.stop('spinner-2');
                }).catch(function(response) {
                    scope.fullTextResults = {fullList: []};
                });
                scope.displayLimit = 20;
                scope.loadingData = false;
                scope.addMoreResults = function() {
                    scope.loadingData = true;
                    var formData = angular.copy(scope.main.formData);
                    if (typeof(scope.fullTextResults.fullList !== "undefined")) {
                        formData.offset = scope.lastRow;
                        urlString = URL.objectToString(formData);
                        $timeout(function() {
                            usSpinnerService.spin('spinner-2');
                        }, 100);
                        $http.get('api/' + scope.dbname + '/fulltext?' + urlString).then(function(response) {
                            scope.displayLimit += 40
                            Array.prototype.push.apply(scope.fullTextResults.fullList, response.data.fullList);
                            scope.lastRow += 40;
                            usSpinnerService.stop('spinner-2');
                            scope.loadingData = false;
                        });
                    }
                }
            }
        }
    }
})();
