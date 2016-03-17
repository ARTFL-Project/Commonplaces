(function() {

	"use strict";

	angular
	.module('DiggingApp')
	.controller('FullTextController', FullTextController);

	function FullTextController($scope, $http, $location, $routeParams, $anchorScroll, $timeout, URL) {
		var vm = this;
        $scope.main.hideSearchForm = true;
		$scope.main.welcomePage = false;
		vm.facetVisible = true;
    }

}) ();
