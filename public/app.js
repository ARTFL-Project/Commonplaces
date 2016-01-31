(function() {
    'use strict';

	angular
		.module('DiggingApp')
		.controller('MainController', MainController);

		function MainController($scope, $routeParams, $route, $log, $http, $location, webConfig) {
            var vm = this;

            vm.hideLanding = true;
            vm.hideSearchForm = false;
            vm.landingPage = true;
            vm.webConfig = webConfig;
            vm.debug = webConfig.debug;
            vm.description = false;
            vm.queryType = "sharedPassages";
            vm.formData = {};
            vm.formData.duplicates = "ignore";
            vm.formData.sorting = -1;
            vm.commonplace = {};
            vm.dbActive = "eebo";

            vm.openLandingPage = function() {
                if (vm.hideSearchForm) {
                    vm.hideSearchForm = false;
                }
            }
		}
})();
