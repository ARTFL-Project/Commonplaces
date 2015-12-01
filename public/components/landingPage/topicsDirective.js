(function() {
    'use strict';
    angular
        .module('DiggingApp')
        .directive('topics', topics);

    function topics($location, $routeParams, $log, webConfig, URL) {
        var buildTopicList = function(scope) {
            topics = [];
            var dbIndex = 0;
            for (var i=0; i < webConfig.databases.length; i+=1) {
                if (webConfig.databases[i].dbname === scope.main.dbActive) {
                    dbIndex = i;
                    break;
                }
            }
            var topicsInConfig = webConfig.databases[dbIndex].topics;
            for (var i in topicsInConfig) {
                var topicObject = {"label": topicsInConfig[i], "topic": i};
                topics.push(topicObject);
            }
            topics.sort(function(a, b) {
                if (a.label > b.label) {
                    return 1;
                }
                if (a.label < b.label) {
                    return -1.
                }
                return 0;
            });
            scope.topics = [];
            var topicSection = [];
            $log.debug(topics, topics.length)
            for (var i=0; i < topics.length; i+=1) {
                if (topicSection.length === 5) {
                    scope.topics.push(topicSection);
                    topicSection = [];
                    topicSection.push(topics[i]);
                } else {
                    topicSection.push(topics[i]);
                }
            }
            if (topicSection.length !== 0) {
                scope.topics.push(topicSection);
            }
        }
        return {
            templateUrl: 'components/landingPage/topics.html',
            link: function(scope) {
                scope.$watch("main.dbActive", function(oldValue, newValue) {
                    buildTopicList(scope);
                    $log.debug(scope.topics)
                });
                scope.displayTopics = function(topic) {
                    var urlString = "/topic/" + scope.main.dbActive + "/" + topic
                    $location.url(urlString);
                }
            }
        }
    }
})();
