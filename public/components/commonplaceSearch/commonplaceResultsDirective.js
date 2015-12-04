(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('commonplaceResults', commonplaceResults);

    function commonplaceResults($location, $routeParams, $http, $log, URL, sortKeys) {
        return {
            templateUrl: "components/commonplaceSearch/commonplaceResults.html",
            link: function(scope) {
                var queryTerms = $location.search().query_terms;
                var promise = $http.get("/api/" + scope.main.dbActive + "/searchincommonplace?query_terms=" + queryTerms);
                promise.then(function(response) {
                    scope.commonplaces = response.data;
                });
            }
        }
    }
})();
