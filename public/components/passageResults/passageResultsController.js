(function() {

	"use strict";

	angular
	.module('DiggingApp')
	.controller('PassageController', PassageController);

	function PassageController($scope, $http, $location, $routeParams, $anchorScroll, $timeout, URL, usSpinnerService) {
		var vm = this;
		vm.formData = $location.search();

        vm.passageID = $routeParams.passageID;
        $http.get('DiggingIntoData/api/commonplaces/' + vm.passageID).then(function(response) {
            vm.results = response.data;
            vm.timeline = [];
            vm.count = response.data.length;
            usSpinnerService.stop('spinner-1');
            vm.resultsView = "timeline";
            $scope.main.hideSearchForm = true;
        });

		vm.switchView = function(view) {
			vm.resultsView = view;
		}
	};
}) ();
