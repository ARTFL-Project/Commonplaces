(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('searchForm', searchForm);

    function searchForm($location, URL) {
        var hideLandingPage = function() {
            angular.element('.hiding-element').velocity('slideUp', {duration: 200});
            angular.element('#search-form, #landing-page-container > .panel').velocity({"padding-top": 0, "padding-bottom": 0}, {duration: 200, queue: false});
            var titleBars = angular.element('#landing-page-container h4');
            titleBars.velocity({
                'font-size': "100%",
                'color': '#155F83'
            }, {duration: 200, queue: false});
            titleBars.css('cursor', 'pointer');
            titleBars.click(function() {
                showElement(angular.element(this).parent().find('.hiding-element'));
            })
        }
        var showElement = function(element) {
            element
                .velocity('slideDown', {duration: 200})
                .parent().find('h4').velocity({
                    'font-size': "120%",
                    'color': 'black'
                });
        }
        return {
            templateUrl: 'components/searchForm/searchForm.html',
            link: function(scope) {
    			scope.formData = {};
                if (angular.element.isEmptyObject($location.search())) {
                    scope.formToggleText = 'Show Form';
                } else {
                    hideLandingPage()
                    scope.formToggleText = 'Hide Form';
                }
    			scope.submit = function() {
    				scope.results = [];
                    hideLandingPage();
    				var urlString = URL.objectToString(scope.formData);
    				$location.url('DiggingIntoData/query?' + urlString)
    			};
                scope.toggleForm = function() {
                    if (scope.hideForm) {
                        angular.element('.hiding-element').velocity('slideDown');
                        scope.formToggleText = 'Hide Form';
                    } else {
                        hideLandingPage();
                        scope.formToggleText = 'Show Form';
                    }
                }
            }
        }
    }
})();
