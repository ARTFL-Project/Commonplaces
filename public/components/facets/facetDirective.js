(function () {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('facetSearch', facetSearch);

    function facetSearch($location, $http, $log, webConfig, URL, $routeParams) {
        return {
            templateUrl: "components/facets/facetSearch.html",
            link: function (scope) {
                var formData = angular.copy($location.search());
                scope.showfacet = false;
                scope.selectedFacet = "";
                scope.facetLoading = false;
                scope.getFacet = function (facet) {
                    scope.facetLoading = true;
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
                    scope.showFacetSelection = false;
                    $http.get(urlString).then(function (response) {
                        scope.facetData = response.data;
                        scope.showfacet = true;
                        scope.facetLoading = false;
                    });
                }
                scope.closeFacets = function () {
                    scope.showfacet = false;
                    scope.showFacetSelection = true;
                }
                scope.showFacetSelection = true;
                scope.displayFacetSelection = function () {
                    scope.showFacetSelection = true;
                }
                scope.hideFacets = function () {
                    angular.element('#full-text-results').removeClass('col-sm-7 col-md-9').addClass('col-sm-12');
                    angular.element('#facet-container').hide();
                    scope.fullText.facetVisible = false;
                }
                scope.goToResult = function (queryType, facet) {
                    var currentFormData = angular.copy($location.search());
                    currentFormData[scope.selectedFacet] = '"' + facet + '"';
                    var urlString = URL.objectToString(currentFormData);
                    var link = "/nav/" + scope.main.dbActive + "/query/search?" + urlString;
                    $location.url(link);
                }
            }
        }
    }
})();
