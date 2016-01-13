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
                var queryTerms = $location.search().query_terms;
                var promise = $http.get("/api/" + scope.main.dbActive + "/searchincommonplace?query_terms=" + queryTerms);
                promise.then(function(response) {
                    scope.commonplaces = response.data;
                });
                scope.displayLimit = 20;
                scope.loadingData = false;
                var formData = {};
                scope.addMoreResults = function() {
                    scope.loadingData = true;
                    if (typeof(scope.commonplaces !== "undefined")) {
                        var lastIndex = scope.commonplaces.length - 1;
                        var lastRow = scope.commonplaces[lastIndex];
                        commonplaceSortEnd.last_date = lastRow.date;
                        commonplaceSortEnd.last_author = lastRow.author;
                        formData.last_author = commonplaceSortEnd.last_author;
                        formData.last_date = commonplaceSortEnd.last_date;
                        formData.query_terms = queryTerms;
                        var urlString = URL.objectToString(formData);
                        $timeout(function() {
                            usSpinnerService.spin('spinner-2');
                        }, 100);
                        $http.get('api/' + scope.main.dbActive + "/searchincommonplace?" + urlString).then(function(response) {
                            scope.displayLimit += 40
                            Array.prototype.push.apply(scope.commonplaces, response.data);
                            usSpinnerService.stop('spinner-2');
                            scope.loadingData = false;
                        });
                    }
                }
            }
        }
    }
})();
