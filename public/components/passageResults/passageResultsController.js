(function() {

	"use strict";

	angular
	.module('DiggingApp')
	.controller('PassageController', PassageController);

	function PassageController($scope, $http, $location, $routeParams, $anchorScroll, $timeout, URL) {
		var vm = this;
		vm.formData = $location.search();

		$scope.main.welcomePage = false;

        vm.passageID = $routeParams.passageID;
        vm.dbname = $routeParams.dbname;
        $http.get('api/' + vm.dbname + '/commonplaces/' + vm.passageID).then(function(response) {
            vm.results = response.data;
            vm.timeline = [];
            vm.count = response.data.length;
            vm.resultsView = "timeline";
            $scope.main.hideSearchForm = true;
        });

		vm.switchView = function(view) {
			vm.resultsView = view;
		}
	};
}) ();
