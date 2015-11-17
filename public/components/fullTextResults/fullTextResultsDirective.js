(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('fullTextResults', fullTextResults)

    function fullTextResults($http, $timeout, $log, $location, $routeParams, URL) {
        return {
            restrict: 'E',
            templateUrl: 'components/fullTextResults/fullTextResults.html',
            link: function(scope, element, attrs) {
                var formData = $location.search();
                scope.dbname = $routeParams.dbname;
                console.log(scope.dbname)

                var urlString = URL.objectToString(formData)
                $http.get('api/' + scope.dbname + '/fulltext?' + urlString).then(function(response) {
                    scope.fullTextResults = response.data;
                    // usSpinnerService.stop('spinner-1');
                });

                scope.displayLimit = 20;
                scope.addMoreResults = function() {
                    formData.start = scope.displayLimit
                    if (scope.displayLimit !== 20) {
                        formData.start += 40
                    }
                    // formData.dbname = "eebo"
                    $http.get('api/' + scope.dbname + '/fulltext?' + urlString).then(function(response) {
                        scope.displayLimit += 40
                        Array.prototype.push.apply(scope.fullTextResults.fullList, response.data.fullList);
                        // usSpinnerService.stop('spinner-1');
                    });
                }
            }
        }
    }
})();
