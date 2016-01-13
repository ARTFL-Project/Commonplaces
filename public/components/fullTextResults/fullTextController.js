(function() {

	"use strict";

	angular
	.module('DiggingApp')
	.controller('FullTextController', FullTextController);

	function FullTextController($scope, $http, $location, $routeParams, $anchorScroll, $timeout, URL, usSpinnerService) {
		var vm = this;
        $scope.main.hideSearchForm = true;
    }

}) ();
