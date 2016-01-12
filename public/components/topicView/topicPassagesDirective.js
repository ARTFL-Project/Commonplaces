(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('topicPassages', topicPassages);

    function topicPassages($location, $http, $log, webConfig, $routeParams) {
        return {
            templateUrl: 'components/topicView/topicPassages.html',
            link: function(scope) {
                scope.debug = webConfig.debug;
                var dbIndex = 0;
                for (var i=0; i < webConfig.databases.length; i+=1) {
                    if (webConfig.databases[i].dbname === scope.main.dbActive) {
                        dbIndex = i;
                        break;
                    }
                }
                var topics = webConfig.databases[dbIndex].topics;
                scope.displayLimit = 50;
                var urlString = "/api/" + scope.main.dbActive + "/topic/" + $routeParams.topicID;
                var promise = $http.get(urlString);
                promise.then(function(response) {
                    scope.main.hideSearchForm = true;
                    scope.currentTopic = topics[$routeParams.topicID];
                    scope.topicPassages = response.data.passages;
                    scope.wordsInTopic = response.data.words;
                });
                scope.loadingData = false;
                scope.addMoreResults = function() {
                    scope.loadingData = true;
                    var lastWeight = scope.topicPassages[scope.topicPassages.length-1].topicWeight;
                    var update = $http.get(urlString + "?topicWeight=" + lastWeight);
                    update.then(function(response) {
                        Array.prototype.push.apply(scope.topicPassages, response.data.passages);
                        scope.displayLimit += 100;
                        scope.loadingData = false;
                    });
                }
            }
        }
    }
})();
