(function() {
    'use strict';

	angular
		.module('DiggingApp')
		.config(DiggingAppConfig);

	function DiggingAppConfig($routeProvider, $locationProvider) {
		$routeProvider.
			when('/DiggingIntoData/query?:queryArgs', {
				templateUrl: 'components/mainResults/mainResults.html',
				controller: 'ResultsController',
				controllerAs: 'mainResults'
			}).
			otherwise({
			  redirectTo: '/DiggingIntoData/'
			});
		$locationProvider.html5Mode({
			enabled: true
		});
	}

}) ();
