var DiggingApp = angular.module('DiggingApp', ['ngRoute', 'ngTouch', 'ngSanitize', 'ngCookies']);

DiggingApp.controller('MainCtrl', ['$http', 'URL', function($http, URL){
	
	var vm = this;
	
	vm.formData = {}
	
	vm.submit = function() {
		vm.results = [];
		if (angular.equals({}, vm.formData)) {
            $http.get('DiggingIntoData/all').then(function(response) {
				vm.results = response.data;
			});
        } else {
			var urlString = URL.objectToString(vm.formData);
			$http.get('DiggingIntoData/some?' + urlString).then(function(response) {
				vm.results = highlightPassages(response.data);
			});
		}
	};
}]);

	
var alphabet = { a:/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/ig,
				aa:/[\uA733]/ig,
				ae:/[\u00E6\u01FD\u01E3]/ig,
				ao:/[\uA735]/ig,
				au:/[\uA737]/ig,
				av:/[\uA739\uA73B]/ig,
				ay:/[\uA73D]/ig,
				b:/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/ig,
				c:/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/ig,
				d:/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/ig,
				dz:/[\u01F3\u01C6]/ig,
				e:/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/ig,
				f:/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/ig,
				g:/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/ig,
				h:/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/ig,
				hv:/[\u0195]/ig,
				i:/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/ig,
				j:/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/ig,
				k:/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/ig,
				l:/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/ig,
				lj:/[\u01C9]/ig,
				m:/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/ig,
				n:/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/ig,
				nj:/[\u01CC]/ig,
				o:/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/ig,
				oi:/[\u01A3]/ig,
				ou:/[\u0223]/ig,
				oo:/[\uA74F]/ig,
				p:/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/ig,
				q:/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/ig,
				r:/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/ig,
				s:/[\u0073\u24E2\uFF53\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/ig,
				ss:/[\u00DF\u1E9E]/ig,
				t:/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/ig,
				tz:/[\uA729]/ig,
				u:/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/ig,
				v:/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/ig,
				vy:/[\uA761]/ig,
				w:/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/ig,
				x:/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/ig,
				y:/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/ig,
				z:/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/ig,
				'':/[\u0300\u0301\u0302\u0303\u0308]/ig
			};
function replaceDiacritics (str) {
	for (var letter in alphabet) {
		str = str.replace(alphabet[letter], letter);
	}
	return str;
};

function highlightPassages(data) {
	var results = [];
	for (var i=0; i < data.length; i+=1) {
		var result = data[i];
		var sourceText = result.sourcematchcontext;
		var tokenizedSourceText = tokenize(sourceText);
		var allMatches = [];
		var targets = [];
		for (var j=0; j < result.target_alignment.length; j+=1) {
			var target = result.target_alignment[j];
			var targetText = target.sourcematchcontext;
			var tokenizedTargetText = tokenize(targetText);
			var matches = compareText(tokenizedSourceText, tokenizedTargetText);
			var matchesLen = matches.length;
			for (var k=0; k < matchesLen; k+=1) {
				var re = new RegExp('\\b' + matches[k] + '\\b',"gi");
				targetText = targetText.replace(re, '<span class="highlight">' + matches[k] + '</span>');
				if (allMatches.indexOf(matches[k]) === -1) {
                    allMatches.push(matches[k]);
                }
			}
			target.sourcematchcontext = targetText;
			targets.push(target);
		}
		result.target_alignments = targets;
		for (var l=0; l < allMatches.length; l+=1) {
            var re = new RegExp('\\b' + allMatches[l] + '\\b',"gi");
			sourceText = sourceText.replace(re, '<span class="highlight">' + allMatches[l] + '</span>');
        }
		result.sourcematchcontext = sourceText;
		results.push(result);
	}
	return results;
}

var stopwords = ['(', ')', '&', 'volume', 'a', 'about', 'above', 'across', 'after', 'again', 'against', 'all', 'almost',
                 'alone', 'along', 'already', 'also', 'although', 'always', 'among', 'an', 'and', 'another', 'any', 'anybody',
                 'anyone', 'anything', 'anywhere', 'are', 'area', 'areas', 'around', 'as', 'ask', 'asked', 'asking', 'asks', 'at',
                 'away', 'b', 'back', 'backed', 'backing', 'backs', 'be', 'became', 'because', 'become', 'becomes', 'been',
                 'before', 'began', 'behind', 'being', 'beings', 'best', 'better', 'between', 'big', 'both', 'but', 'by', 'c',
                 'came', 'can', 'cannot', 'case', 'cases', 'certain', 'certainly', 'clear', 'clearly', 'come', 'could', 'd',
                 'did', 'differ', 'different', 'differently', 'do', 'does', 'done', 'down', 'down', 'downed', 'downing',
                 'downs', 'during', 'e', 'each', 'early', 'either', 'end', 'ended', 'ending', 'ends', 'enough', 'even',
                 'evenly', 'ever', 'every', 'everybody', 'everyone', 'everything', 'everywhere', 'f', 'face', 'faces',
                 'fact', 'facts', 'far', 'felt', 'few', 'find', 'finds', 'first', 'for', 'four', 'from', 'full', 'fully',
                 'further', 'furthered', 'furthering', 'furthers', 'g', 'gave', 'general', 'generally', 'get', 'gets',
                 'give', 'given', 'gives', 'go', 'going', 'good', 'goods', 'got', 'great', 'greater', 'greatest', 'group',
                 'grouped', 'grouping', 'groups', 'h', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'herself',
                 'high', 'high', 'high', 'higher', 'highest', 'him', 'himself', 'his', 'how', 'however', 'i', 'if', 'important',
                 'in', 'interest', 'interested', 'interesting', 'interests', 'into', 'is', 'it', 'its', 'itself', 'j',
                 'just', 'k', 'keep', 'keeps', 'kind', 'knew', 'know', 'known', 'knows', 'l', 'large', 'largely', 'last',
                 'later', 'latest', 'least', 'less', 'let', 'lets', 'like', 'likely', 'long', 'longer', 'longest', 'm',
                 'made', 'make', 'making', 'man', 'many', 'may', 'me', 'member', 'members', 'men', 'might', 'more', 'most',
                 'mostly', 'mr', 'mrs', 'much', 'must', 'my', 'myself', 'n', 'necessary', 'need', 'needed', 'needing',
                 'needs', 'never', 'new', 'new', 'newer', 'newest', 'next', 'no', 'nobody', 'non', 'noone', 'not', 'nothing',
                 'now', 'nowhere', 'number', 'numbers', 'o', 'of', 'off', 'often', 'old', 'older', 'oldest', 'on', 'once',
                 'one', 'only', 'open', 'opened', 'opening', 'opens', 'or', 'order', 'ordered', 'ordering', 'orders',
                 'other', 'others', 'our', 'out', 'over', 'p', 'part', 'parted', 'parting', 'parts', 'per', 'perhaps',
                 'place', 'places', 'point', 'pointed', 'pointing', 'points', 'possible', 'present', 'presented', 'presenting',
                 'presents', 'problem', 'problems', 'put', 'puts', 'q', 'quite', 'r', 'rather', 'really', 'right', 'right',
                 'room', 'rooms', 's', 'said', 'same', 'saw', 'say', 'says', 'second', 'seconds', 'see', 'seem', 'seemed',
                 'seeming', 'seems', 'sees', 'several', 'shall', 'she', 'should', 'show', 'showed', 'showing', 'shows',
                 'side', 'sides', 'since', 'small', 'smaller', 'smallest', 'so', 'some', 'somebody', 'someone', 'something',
                 'somewhere', 'state', 'states', 'still', 'still', 'such', 'sure', 't', 'take', 'taken', 'than', 'that',
                 'the', 'their', 'them', 'then', 'there', 'therefore', 'these', 'they', 'thing', 'things', 'think', 'thinks',
                 'this', 'those', 'though', 'thought', 'thoughts', 'three', 'through', 'thus', 'to', 'today', 'together',
                 'too', 'took', 'toward', 'turn', 'turned', 'turning', 'turns', 'two', 'u', 'under', 'until', 'up', 'upon',
                 'us', 'use', 'used', 'uses', 'v', 'very', 'w', 'want', 'wanted', 'wanting', 'wants', 'was', 'way', 'ways',
                 'we', 'well', 'wells', 'went', 'were', 'what', 'when', 'where', 'whether', 'which', 'while', 'who', 'whole',
                 'whose', 'why', 'will', 'with', 'within', 'without', 'work', 'worked', 'working', 'works', 'would', 'x',
                 'y', 'year', 'years', 'yet', 'you', 'young', 'younger', 'youngest', 'your', 'yours', 'z'];

function tokenize(words) {
	words = replaceDiacritics(words);
	words = words.toLowerCase().split(/\b(\w+)\b/);
	var wordLen = words.length;
	var newList = []
	for (var i=0; i < wordLen; i++) {
			var word = words[i];
			if (stopwords.indexOf(word) !== -1) {
                continue;
            } else if (word.match(/([\.?!\-\(\)\[\];',])/)) {
					continue;
			} else if (word.match(/\d/)) {
					continue;
			} else if (word.match(/ /)) {
					continue;
			} else if (word.length < 1) {
					continue;
			}
			newList.push(word);
	}
	return newList;
}

function compareText(source, target) {
	var sourceLen = source.length;
	var matches = [];
	for (var i=0; i < sourceLen; i+=1) {
		var word = source[i];
		if (target.indexOf(word) != -1 && matches.indexOf(word) == -1) {
			matches.push(word);
		}
	}
	return matches;
}