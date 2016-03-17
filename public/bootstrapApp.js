(function() {
    "use strict";

    angular
        .module("DiggingApp", ['ngRoute', 'ngTouch', 'ngSanitize', 'infinite-scroll', 'chart.js']);

    getConfig().then(bootstrapApplication);

    function getConfig() {
        var initInjector = angular.injector(["ng"]);
        var $http = initInjector.get("$http");

        return $http.get("config/config.json").then(function(response) {
            angular
                .module('DiggingApp')
                .constant("webConfig", response.data);
        }, function(errorResponse) {
            // Handle error case
        });
    }

    function bootstrapApplication() {
        angular.element(document).ready(function() {
            angular.bootstrap(document, ['DiggingApp']);
        });
    }
})();
