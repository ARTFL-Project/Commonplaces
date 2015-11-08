(function() {
    'use strict';

	angular
		.module('DiggingApp')
		.config(DiggingAppConfig);

	function DiggingAppConfig($routeProvider, $locationProvider) {
		$routeProvider.
            when('/DiggingIntoData/passage/:passageID', {
                templateUrl: 'components/passageResults/passageResults.html',
				controller: 'PassageController',
				controllerAs: 'passageResults'
            }).
			when('/DiggingIntoData/query?:queryArgs', {
				templateUrl: 'components/fullTextResults/fullTextContainer.html',
				controller: 'FullTextController',
				controllerAs: 'fullText'
			}).
			otherwise({
			  redirectTo: '/DiggingIntoData/'
			});
		$locationProvider.html5Mode({
			enabled: true
		});
	}

}) ();
