(function() {
    'use strict';

	angular
		.module('DiggingApp', ['ngRoute', 'ngTouch', 'ngSanitize', 'ngCookies', 'angularSpinner', 'infinite-scroll'])
		.controller('MainController', MainController);

		function MainController($location, $anchorScroll, $timeout, URL, usSpinnerService) {

			var vm = this;
			vm.formData = {};
            if (angular.element.isEmptyObject($location.search())) {
                vm.hideForm = false;
                vm.formToggleText = 'Show Form';
            } else {
                vm.hideForm = true;
                vm.formToggleText = 'Hide Form';
            }
			vm.submit = function() {
				vm.results = [];
                vm.hideForm = true;
				vm.currentPageNumber = 1;
				var urlString = URL.objectToString(vm.formData);
				$location.url('DiggingIntoData/query?' + urlString)
			};
            vm.toggleForm = function() {
                if (vm.hideForm) {
                    vm.hideForm = false;
                    vm.formToggleText = 'Hide Form';
                } else {
                    vm.hideForm = true;
                    vm.formToggleText = 'Show Form';
                }
            }
		}
})();
