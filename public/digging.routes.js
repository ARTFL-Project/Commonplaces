(function() {
    'use strict';

	angular
		.module('DiggingApp')
		.config(DiggingAppConfig);

	function DiggingAppConfig($routeProvider, $locationProvider) {
		$routeProvider.
            // when('/welcome', {
            //     templateUrl: 'components/welcomePage/welcomePage.html'
            // }).
            when('/passage/:dbname/:passageID', {
                templateUrl: 'components/passageResults/passageResults.html',
				controller: 'PassageController',
				controllerAs: 'passageResults'
            }).
			when('/query/:dbname/search?:queryArgs', {
				templateUrl: 'components/fullTextResults/fullTextContainer.html',
				controller: 'FullTextController',
				controllerAs: 'fullText'
			}).
            when('/topic/:dbname/:topicID', {
                templateUrl: 'components/topicView/topicView.html'
            }).
            when('/commonplace/:dbname/search?:queryArgs', {
                templateUrl: 'components/commonplaceSearch/commonplaceSearch.html'
            }).
			otherwise({
			  redirectTo: '/'
			});
		$locationProvider.html5Mode({
			enabled: true
		});
	}

}) ();
