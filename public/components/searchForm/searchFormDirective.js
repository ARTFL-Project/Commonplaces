(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('searchForm', searchForm);

    function searchForm($location, URL) {
        var hideLandingPage = function() {
            angular.element('.hiding-element').each(function() {
                hideElement(angular.element(this));
            })
        }
        var hideElement = function(element) {
            element.velocity('slideUp', {duration: 250, easing: "easeOut"});
            element.parent().velocity({
                "padding-top": 0,
                "padding-bottom": 0,
                "margin-bottom": "2px",
                "margin-top": 0
            }, {duration: 250, easing: "easeOut", queue: false});
            var titleBar = element.parent().find('h4');
            titleBar.velocity({
                'font-size': "100%",
                'color': '#155F83',
                "margin-bottom": '0px',
                "padding": "5px"
            }, {duration: 250, easing: "easeOut", queue: false});
            titleBar.css('cursor', 'pointer');
            titleBar.off().on('click touchstart', function() {
                showElement(angular.element(this).parent().find('.hiding-element'));
            });
            element.parent().find('.glyphicon-chevron-right').show();
            element.parent().find('.glyphicon-chevron-down').hide();
        }
        var showElement = function(element) {
            element
                .velocity('slideDown', {duration: 250, easing: "easeOut"});
            element.parent().velocity({
                "padding": "15px",
                "margin-bottom": "15px",
                "margin-top": "15px"
            });
            var titleBar = element.parent().find('h4');
            titleBar.off();
            titleBar.velocity({
                    'font-size': "120%",
                    'color': 'black',
                    "margin-bottom": '15px',
                    "padding": 0
                });
            titleBar.on("click touchstart", function() {
                hideElement(element);
            });
            element.parent().find('.glyphicon-chevron-right').hide();
            element.parent().find('.glyphicon-chevron-down').show();
        }
        return {
            templateUrl: 'components/searchForm/searchForm.html',
            link: function(scope) {
    			scope.formData = {};
    			scope.submit = function() {
    				scope.results = [];
    				var urlString = URL.objectToString(scope.formData);
                    if (urlString.length === 0) {
                        alert("You haven't searched for anything, please fill in one of the search boxes");
                    } else {
                        hideLandingPage();
		                $location.url('DiggingIntoData/query?' + urlString)
                    }
    			};
                scope.toggleForm = function() {
                    if (scope.hideForm) {
                        angular.element('.hiding-element').velocity('slideDown');
                    } else {
                        hideLandingPage();
                    }
                }
                scope.$watch("main.hideSearchForm", function(currentValue) {
                    if (currentValue) {
                        hideLandingPage()
                    } else {

                    }
                })
            }
        }
    }
})();
