(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('commonplaceResults', commonplaceResults);

    function commonplaceResults($location, $routeParams, $http, $log, $timeout, URL, commonplaceSortEnd) {
        var getTotalCounts = function(scope) {
            var urlString = URL.objectToString(scope.main.commonplace);
            scope.waitingForCount = true;
            $http.get('api/'+ scope.main.dbActive + '/searchincommonplacecount?' + urlString).then(function(response) {
                scope.waitingForCount = false;
                scope.totalCount = response.data.totalCount;
            });
        }
        return {
            templateUrl: "components/commonplaceSearch/commonplaceResults.html",
            link: function(scope) {
                var urlString = URL.objectToString($location.search());
                scope.main.commonplace = $location.search(); // for page reload
                var promise = $http.get("/api/" + scope.main.dbActive + "/searchincommonplace?" + urlString);
                scope.currentPosition = 0
                scope.loading = true;
                scope.noResults = false;
                promise.then(function(response) {
                    scope.commonplaces = response.data;
                    if (response.data != null) {
                        scope.currentPosition += response.data.length;
                    }
                    scope.loading = false;
                    getTotalCounts(scope);
                });
                scope.displayLimit = 20;
                scope.loadingData = false;
                var formData = {};
                scope.addMoreResults = function() {
                    scope.loadingData = true;
                    if (typeof(scope.commonplaces !== "undefined") && scope.currentPosition != 0) {
                        scope.main.commonplace.offset = scope.currentPosition;
                        urlString = URL.objectToString(scope.main.commonplace);
                        $http.get('api/' + scope.main.dbActive + "/searchincommonplace?" + urlString).then(function(response) {
                            scope.displayLimit += 40
                            Array.prototype.push.apply(scope.commonplaces, response.data);
                            scope.loadingData = false;
                            scope.currentPosition += response.data.length;
                        });
                    }
                }
            }
        }
    }
})();
