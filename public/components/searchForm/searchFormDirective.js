(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('searchForm', searchForm);

    function searchForm($location, $routeParams, $log, URL, sortKeys) {
        var hideLandingPage = function() {
            angular.element('.hiding-element').each(function() {
                hideElement(angular.element(this));
            })
        }
        var hideElement = function(element) {
            element.velocity('slideUp', {
                duration: 250,
                easing: "easeOut"
            });
            element.parent().velocity({
                "padding-top": 0,
                "padding-bottom": 0,
                "margin-bottom": "5px",
                "margin-top": 0
            }, {
                duration: 250,
                easing: "easeOut",
                queue: false
            });
            var titleBar = element.parent().find('h4');
            titleBar.velocity({
                'font-size': "100%",
                'color': '#155F83',
                "margin-bottom": '0px',
                "padding": "5px"
            }, {
                duration: 250,
                easing: "easeOut",
                queue: false
            });
            titleBar.css('cursor', 'pointer');
            titleBar.off().on('click touchstart', function() {
                showElement(angular.element(this).parent().find('.hiding-element'));
            });
            element.parent().find('.glyphicon-chevron-right').show();
            element.parent().find('.glyphicon-chevron-down').hide();
        }
        var showElement = function(element) {
            element
                .velocity('slideDown', {
                    duration: 250,
                    easing: "easeOut"
                });
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
        var showLandingPage = function() {
            angular.element("#landing-page-container").find('.hiding-element').each(function() {
                showElement(angular.element(this));
            })
        }
        return {
            templateUrl: 'components/searchForm/searchForm.html',
            link: function(scope) {
                angular.element('[data-toggle="popover"]').popover();
                scope.sorting = "Target date, author";
                scope.submit = function() {
                    scope.results = [];
                    if (scope.main.formData.duplicates != "ignore") {
                        delete scope.main.formData.duplicates;
                    }
                    if (scope.main.formData.bible != "ignore") {
                        delete scope.main.formData.bible;
                    }
                    var urlString = URL.objectToString(scope.main.formData);
                    if (urlString.length === 0) {
                        alert("You haven't searched for anything, please fill in one of the search boxes");
                    } else {
                        hideLandingPage();
                        $location.url('/query/' + scope.main.dbActive + '/search?' + urlString)
                    }
                };
                scope.toggleForm = function() {
                    if (scope.hideForm) {
                        angular.element('.hiding-element').velocity('slideDown');
                    } else {
                        hideLandingPage();
                    }
                }
                scope.selectSorting = function(sortId) {
                    scope.main.formData.sorting = sortId;
                    scope.sorting = sortKeys.keys[sortId].label;
                }
                scope.$watch("main.hideSearchForm", function(currentValue) {
                    if (currentValue) {
                        hideLandingPage();
                    } else {
                        showLandingPage();
                    }
                });
            }
        }
    }
})();
