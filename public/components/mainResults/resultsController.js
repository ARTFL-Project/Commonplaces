(function() {

	"use strict";

	angular
	.module('DiggingApp')
	.controller('ResultsController', ResultsController);

	function ResultsController($http, $location, $anchorScroll, $timeout, URL, usSpinnerService) {
		var vm = this;
		vm.formData = $location.search();

		getData();

		vm.switchView = function(view) {
			vm.resultsView = view;
		}

		vm.goToPage = function(pageNumber) {
			//vm.formData.page = pageNumber;
			vm.currentPageNumber = pageNumber;
			vm.results = [];
			$anchorScroll(0);
			getData();
		}

		function getData() {
			$timeout(function() {
				usSpinnerService.spin('spinner-1');
			});
			var urlString = URL.objectToString(vm.formData);
			$http.get('DiggingIntoData/commonplaces?' + urlString).then(function(response) {
				vm.results = response.data;
                vm.timeline = [];
				vm.count = response.data.length;
				usSpinnerService.stop('spinner-1');
                vm.resultsView = "timeline";
			});
		}
	};
}) ();
