DiggingApp.factory('URL', function() {
	return {
		objectToString: function(localParams) {
            var str = [];
            for (var p in localParams) {
                var k = p, 
                    v = localParams[k];
                str.push(angular.isObject(v) ? this.query(v, k) : (k) + "=" + encodeURIComponent(v));
            }
            return str.join('&')
        }	
	}
})

