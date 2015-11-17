(function() {
    'use strict';

	angular
		.module('DiggingApp')
		.controller('MainController', MainController);

		function MainController($http, webConfig) {
            var vm = this;

            vm.hideLanding = true;
            vm.hideSearchForm = false;
            vm.landingPage = true;
            vm.webConfig = webConfig;

            vm.openLandingPage = function() {
                if (vm.hideSearchForm) {
                    vm.hideSearchForm = false;
                }
            }
		}
})();
