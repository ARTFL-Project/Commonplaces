(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('sourceSelection', sourceSelection);

    function sourceSelection($location) {
        return {
            templateUrl: "components/sourceSelection/sourceSelection.html",
            link: function(scope) {
                scope.setDb = function(dbname) {
                    scope.main.dbActive = dbname;
                    scope.main.description = true;
                    $location.url(dbname);
                }
            }
        }
    }
})();
