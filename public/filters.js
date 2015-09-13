(function() {
		"use strict";

	angular
		.module('DiggingApp')
		.filter('unsafe', function($sce) { return $sce.trustAsHtml; })
		.filter('isNotEmpty', function($log) {
			return function(obj) {
				$log.debug(obj, angular.element.isEmptyObject(obj));
				if (angular.element.isEmptyObject(obj)) {
					return false;
				} else {
					return true;
				}
			}
		})
        .filter('keyLength', function(){
            return function(input) {
                if(!angular.isObject(input)){
                    throw Error("Usage of non-objects with keylength filter!!")
                }
                return Object.keys(input).length;
            }
        });
}) ();
