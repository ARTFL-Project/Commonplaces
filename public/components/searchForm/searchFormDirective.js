(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('searchForm', searchForm);

    function searchForm($location, $routeParams, $log, $http, URL, sortKeys) {
        var hideLandingPage = function() {
            angular.element('.hiding-element').each(function() {
                hideElement(angular.element(this));
            })
        }
        var hideElement = function(element) {
            if (element instanceof jQuery === false) {
                element = angular.element(element.currentTarget).siblings(".hiding-element");
            }
            element.velocity('slideUp', {
                duration: 250,
                easing: "easeOut"
            });
            element.siblings(".close").addClass("closed");
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
            element.siblings(".close").removeClass("closed");
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
        var sortObject = function(obj) {
            var arr = [];
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    arr.push({
                        'key': prop,
                        'value': obj[prop]
                    });
                }
            }
            arr.sort(function(a, b) {
                return b.value - a.value;
            });
            return arr; // returns array
        }
        return {
            templateUrl: 'components/searchForm/searchForm.html',
            link: function(scope) {
                angular.element('[data-toggle="popover"]').popover();
                scope.sorting = "No Sorting";
                scope.submit = function() {
                    scope.results = [];
                    if (scope.main.formData.duplicates != "ignore") {
                        delete scope.main.formData.duplicates;
                    }
                    var urlString = URL.objectToString(scope.main.formData);
                    if (urlString.length === 0) {
                        alert("You haven't searched for anything, please fill in one of the search boxes");
                    } else {
                        hideLandingPage();
                        $location.url('/nav/' + scope.main.dbActive + '/query/search?' + urlString)
                    }
                };
                scope.toggleForm = function() {
                    if (scope.hideForm) {
                        angular.element('.hiding-element').velocity('slideDown');
                    } else {
                        hideLandingPage();
                    }
                }
                scope.clear = function() {
                    scope.main.formData = {
                        duplicates: "",
                        sorting: -1
                    }
                }
                scope.hideElement = hideElement;
                scope.selectSorting = function(sortId) {
                    scope.main.formData.sorting = sortId;
                    scope.sorting = sortKeys.keys[sortId].label;
                }
                scope.bibleFilter = "No filter";
                scope.bibleFiltering = function(filtering) {
                    if (filtering === 0) {
                        scope.main.formData.bible = "ignore";
                        scope.bibleFilter = "Filter out Bible sources";
                    } else if (filtering == 1) {
                        scope.main.formData.bible = "only";
                        scope.bibleFilter = "Filter out non-Bible sources";
                    } else if (filtering === 2) {
                        scope.main.formData.bible = "all";
                        scope.bibleFilter = "off";
                    }
                }
                scope.showLatinAuthorList = false;
                scope.latinAuthors = scope.main.webConfig.latinAuthors;
                scope.listAuthors = function() {
                    if (!scope.showLatinAuthorList) {
                        scope.showLatinAuthorList = true;
                    } else {
                        scope.showLatinAuthorList = false;
                    }
                }
                scope.showTopAuthorList = false;
                scope.topAuthors = scope.main.webConfig.topAuthors;
                scope.listTopAuthors = function() {
                    if (!scope.showTopAuthorList) {
                        scope.showTopAuthorList = true;
                    } else {
                        scope.showTopAuthorList = false;
                    }
                }
                scope.showTopTitleList = false;
                scope.topTitles = scope.main.webConfig.topTitles;
                scope.listTopTitles = function() {
                    if (!scope.showTopTitleList) {
                        scope.showTopTitleList = true;
                    } else {
                        scope.showTopTitleList = false;
                    }
                }
                scope.moduleNames = scope.main.webConfig.modules;
                scope.sourceModuleSelected = "None";
                scope.targetModuleSelected = 'None';
                scope.selectModule = function(key, moduleName) {
                    if (moduleName == 'None') {
                        delete scope.main.formData[key];
                    } else {
                        scope.main.formData[key] = '"' + moduleName + '"';
                    }
                    if (key.substring(0,6) === 'source') {
                        scope.sourceModuleSelected = moduleName;
                    } else {
                        scope.targetModuleSelected = moduleName;
                    }

                }
                scope.fillForm = function(field, value) {
                    scope.main.formData[field] = '"' + value + '"';
                    scope.showSourceModuleList = false;
                    scope.showTargetModuleList = false;
                    scope.showLatinAuthorList = false;
                    scope.showTopAuthorList = false;
                    scope.showTopTitleList = false;
                }
                scope.$watch("main.hideSearchForm", function(currentValue) {
                    if (currentValue) {
                        hideLandingPage();
                    } else {
                        showLandingPage();
                    }
                });
                scope.$watch("main.formData.sourcemodulename", function(currentValue) {
                    if ('sourcemodulename' in scope.main.formData) {
                        scope.sourceModuleSelected = currentValue.replace(/"/g, '');
                    }
                });
                scope.$watch("main.formData.targetmodulename", function(currentValue) {
                    if ('targetmodulename' in scope.main.formData) {
                        scope.targetModuleSelected = currentValue.replace(/"/g, '');
                    }
                });
            }
        }
    }
})();
