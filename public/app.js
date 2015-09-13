(function() {
    'use strict';

	angular
		.module('DiggingApp', ['ngRoute', 'ngTouch', 'ngSanitize', 'ngCookies', 'angularSpinner'])
		.controller('MainController', MainController);

		function MainController($location, $anchorScroll, $timeout, URL, usSpinnerService) {

			var vm = this;
			vm.formData = {};

			vm.submit = function() {
				vm.results = [];
				vm.currentPageNumber = 1;
				var urlString = URL.objectToString(vm.formData);
				$location.url('DiggingIntoData/query?' + urlString)
			};
		}
})();
