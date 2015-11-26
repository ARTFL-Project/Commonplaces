(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('fullTextResults', fullTextResults)

    function fullTextResults($http, $timeout, $log, $location, $routeParams, URL, sortEnd, sortKeys, usSpinnerService) {
        var storeQueryEnd = function(scope) {
            var lastIndex = scope.fullTextResults.fullList.length - 1;
            var lastRow = scope.fullTextResults.fullList[lastIndex];
            var sortId = $location.search().sorting;
            sortEnd.keys = [];
            for (var i = 0; i < sortKeys.keys[sortId].fields.length; i++) {
                var field = sortKeys.keys[sortId].fields[i];
                var keyName = "last_" + field;
                var val = lastRow[field];
                sortEnd.keys.push({
                    key: keyName,
                    value: val
                });
            }
        }
        return {
            restrict: 'E',
            templateUrl: 'components/fullTextResults/fullTextResults.html',
            link: function(scope, element, attrs) {
                scope.dbname = $routeParams.dbname;
                scope.main.dbActive = scope.dbname;
                scope.main.formData = angular.copy($location.search());
                var urlString = URL.objectToString(scope.main.formData);
                scope.fullTextResults = {fullList: []};
                $timeout(function() {
                    usSpinnerService.spin('spinner-1');
                }, 100);
                $http.get('api/' + scope.dbname + '/fulltext?' + urlString).then(function(response) {
                    scope.fullTextResults = response.data;
                    usSpinnerService.stop('spinner-1');
                    $(".spinner").remove();
                    // usSpinnerService.stop('spinner-2');
                }).catch(function(response) {
                    scope.fullTextResults = {fullList: []};
                });
                scope.displayLimit = 20;
                scope.loadingData = false;
                scope.addMoreResults = function() {
                    scope.loadingData = true;
                    var formData = angular.copy(scope.main.formData);
                    if (typeof(scope.fullTextResults !== "undefined")) {
                        storeQueryEnd(scope);
                        for (var i=0; i < sortEnd.keys.length; i++) {
                            formData[sortEnd.keys[i].key] = sortEnd.keys[i].value;
                        }
                        urlString = URL.objectToString(formData);
                        $timeout(function() {
                            usSpinnerService.spin('spinner-2');
                        }, 100);
                        $http.get('api/' + scope.dbname + '/fulltext?' + urlString).then(function(response) {
                            scope.displayLimit += 40
                            Array.prototype.push.apply(scope.fullTextResults.fullList, response.data.fullList);
                            usSpinnerService.stop('spinner-2');
                            scope.loadingData = false;
                        });
                    }
                }
            }
        }
    }
})();
