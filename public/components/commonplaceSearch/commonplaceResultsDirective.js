(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('commonplaceResults', commonplaceResults);

    function commonplaceResults($location, $routeParams, $http, $log, $timeout, URL, commonplaceSortEnd, usSpinnerService) {
        var storeQueryEnd = function(scope) {

        }
        return {
            templateUrl: "components/commonplaceSearch/commonplaceResults.html",
            link: function(scope) {
                var urlString = URL.objectToString($location.search());
                scope.main.commonplace = $location.search(); // for page reload
                var promise = $http.get("/api/" + scope.main.dbActive + "/searchincommonplace?" + urlString);
                scope.currentPosition = 0
                promise.then(function(response) {
                    scope.commonplaces = response.data;
                    scope.currentPosition += response.data.length;
                });
                scope.displayLimit = 20;
                scope.loadingData = false;
                var formData = {};
                scope.addMoreResults = function() {
                    scope.loadingData = true;
                    if (typeof(scope.commonplaces !== "undefined")) {
                        scope.main.commonplace.offset = scope.currentPosition;
                        urlString = URL.objectToString(scope.main.commonplace);
                        $timeout(function() {
                            usSpinnerService.spin('spinner-2');
                        }, 100);
                        $http.get('api/' + scope.main.dbActive + "/searchincommonplace?" + urlString).then(function(response) {
                            scope.displayLimit += 40
                            Array.prototype.push.apply(scope.commonplaces, response.data);
                            usSpinnerService.stop('spinner-2');
                            scope.loadingData = false;
                            scope.currentPosition += response.data.length;
                        });
                    }
                }
            }
        }
    }
})();
