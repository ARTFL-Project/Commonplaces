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
                $http.get('api/fulltext?' + urlString).then(function(response) {
                    scope.fullTextResults = response.data;
                    // usSpinnerService.stop('spinner-1');
                });

                scope.displayLimit = 20;
                scope.addMoreResults = function() {
                    formData.start = scope.displayLimit
                    if (scope.displayLimit !== 20) {
                        formData.start += 20
                    }
                    $http.get('api/fulltext?' + urlString).then(function(response) {
                        scope.displayLimit += 20
                        Array.prototype.push.apply(scope.fullTextResults.fullList, response.data.fullList);
                        // usSpinnerService.stop('spinner-1');
                    });
                }
            }
        }
    }
})();
