(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('spinner', spinner);

    function spinner($log) {
        return {
            restrict: 'E',
            template: ['<div class="spinner-wrapper"><div class="showbox"><div class="loader">',
                       '<svg class="circular" viewBox="25 25 50 50">',
                       '<circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/>',
                       '</svg></div></div></div>'].join(''),
            link: function(scope, el, attrs) {
                attrs.$observe("show", function(loading) {
                    if (loading == "true") {
                        el.velocity('fadeIn', {duration: 200});
                    } else {
                        el.velocity('fadeOut', {duration: 200});
                    }
                });
            }
        }
    }
})();
