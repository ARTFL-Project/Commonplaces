(function() {
    'use strict';

	angular
		.module('DiggingApp')
		.controller('MainController', MainController);

		function MainController($scope, $routeParams, $route, $log, $http, $location, webConfig) {
            var vm = this;

            vm.hideLanding = true;
            vm.hideSearchForm = false;
            vm.welcomePage = false;
            vm.landingPage = true;
            vm.webConfig = webConfig;
            vm.debug = webConfig.debug;
            vm.description = false;
            vm.queryType = "sharedPassages";
            vm.formData = {};
            vm.formData.duplicates = "";
            vm.formData.sorting = -1;
            vm.commonplace = {};
            vm.dbActive = "merge";

            vm.openLandingPage = function() {
                if (vm.hideSearchForm) {
                    vm.hideSearchForm = false;
                }
                vm.welcomePage = true;
            }
		}
})();
