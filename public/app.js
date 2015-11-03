(function() {
    'use strict';

	angular
		.module('DiggingApp', ['ngRoute', 'ngTouch', 'ngSanitize', 'ngCookies', 'angularSpinner', 'infinite-scroll'])
		.controller('MainController', MainController);

		function MainController($location, $anchorScroll, $timeout, URL, usSpinnerService) {
            var vm = this;

            vm.hideLanding = true;
            vm.hideSearchForm = false;
            vm.landingPage = true;
		}
})();
