(function() {
    'use strict';

	angular
		.module('DiggingApp')
		.config(DiggingAppConfig);

	function DiggingAppConfig($routeProvider, $locationProvider) {
		$routeProvider.
            when('/nav/:dbname/passage/:passageID', {
                templateUrl: 'components/passageResults/passageResults.html',
				controller: 'PassageController',
				controllerAs: 'passageResults'
            }).
			when('/nav/:dbname/query/search?:queryArgs', {
				templateUrl: 'components/fullTextResults/fullTextContainer.html',
				controller: 'FullTextController',
				controllerAs: 'fullText'
			}).
            when('/nav/:dbname/commonplace/search?:queryArgs', {
                templateUrl: 'components/commonplaceSearch/commonplaceSearch.html'
            });
		$locationProvider.html5Mode({
			enabled: true
		});
	}

}) ();
