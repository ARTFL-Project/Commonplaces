(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('landingPage', landingPage);

    function landingPage($location, URL) {
        return {
            templateUrl: 'components/landingPage/landingPage.html'
        }
    }
})();
