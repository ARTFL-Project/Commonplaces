(function() {
    'use strict';

	angular
		.module('DiggingApp')
		.controller('MainController', MainController);

		function MainController($routeParams, $route, $log, $http, $location, webConfig) {
            var vm = this;

            vm.hideLanding = true;
            vm.hideSearchForm = false;
            vm.landingPage = true;
            vm.webConfig = webConfig;
            vm.webConfig.modules.unshift('None');
            vm.debug = webConfig.debug;
            vm.description = false;
            vm.queryType = "sharedPassages";
            vm.formData = {};
            vm.formData.duplicates = "ignore";
            vm.formData.sorting = -1;
            vm.dbActive = angular.element('body').data('db');

            vm.openLandingPage = function() {
                if (vm.hideSearchForm) {
                    vm.hideSearchForm = false;
                }
            }
            vm.backToTopButton = false;
            vm.reportScroll = function(distance) {
                if (distance > 0) {
                    vm.backToTopButton = true;
                } else {
                    vm.backToTopButton = false;
                }
                console.log(typeof(vm.backToTopButton))
            }
		}
})();
