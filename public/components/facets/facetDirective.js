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
                scope.selectedFacet = "";
                scope.getFacet = function(facet) {
                    formData.facet = facet;
                    scope.selectedFacet = facet;
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
                scope.goToResult = function(queryType, facet) {
                    var currentFormData = angular.copy($location.search());
                    currentFormData[scope.selectedFacet + '_exact'] = facet;
                    var urlString = URL.objectToString(currentFormData);
                    if (queryType == "sharedPassages") {
                        var link = "/query/" + scope.main.dbActive + "/search?" + urlString;
                    } else if (queryType == "commonplaces") {
                        var link = "/commonplace/" + scope.main.dbActive + "/search?" + urlString;
                    } else if (queryType == "topicView") {
                        var link = "/topic/" + scope.main.dbActive + "/" + $routeParams.topicID + "?" + urlString;
                        $log.debug(link)
                    }
                    $location.url(link);
                }
            }
        }
    }
})();
