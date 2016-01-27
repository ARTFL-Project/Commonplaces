(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('facetSearch', facetSearch);

    function facetSearch($location, $http, $log, webConfig, URL, $routeParams) {
        return {
            templateUrl: "components/facets/facetSearch.html",
            link: function(scope) {
                var formData = angular.copy($location.search());
                scope.showfacet = false;
                scope.getFacet = function(facet) {
                    formData.facet = facet;
                    if (scope.main.queryType === "sharedPassages") {
                        var urlString = "/api/" + scope.main.dbActive + "/fulltextfacet?"
                    } else if (scope.main.queryType === "commonplaces") {
                        var urlString = "/api/" + scope.main.dbActive + "/commonplacefacet?"
                    } else {
                        var urlString = "/api/" + scope.main.dbActive + "/topicFacet/" + $routeParams.topicID + "?"
                    }
                    urlString += URL.objectToString(formData);
                    $log.debug(urlString)
                    $http.get(urlString).then(function(response) {
                        $log.debug(response.data);
                        scope.facetData = response.data;
                        scope.showfacet = true;
                    });
                }
                scope.closeFacets = function() {
                    scope.showfacet = false;
                }
            }
        }
    }
})();
