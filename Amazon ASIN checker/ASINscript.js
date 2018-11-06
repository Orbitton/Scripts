/*
	Creator: https://github.com/orbitton
	Commissioned by: Wouter Geurtsen
	Date: 06-11-2018
	Version: 1.2018.11.06.0
	
	For checking availability of products on Amazon by ASIN
*/

(function(e, s) {
	var checkerAppVersion = '1.2018.11.06.0';
	
    e.src = s;
    e.onload = function() {
        $ = jQuery.noConflict();
        console.log('jQuery injected');
		
		makeAmazonCall = function(str) {
			$.ajax({
			url: getBaseUR()+str
			})
		};
		
		log = function(str) {
			console.log(str);
			$('.Log').html(str);
		};
		
		var baseURL = null;
		getBaseURL = function() {
			if (baseURL === null) {
				var url = window.location.host;
				var stringToLocate = "amazon.";
				var tldIndex = url.indexOf(stringToLocate)+stringToLocate.length;
				var tld = url.substr(tldIndex)
				
				baseURL = 'https://www.amazon.'+tld+'/dp/';
			}
			return baseURL;
		}
		
		var currentLanguage = null;
		getLanguage = function() {
			if (currentLanguage === null) {
				var urlArr = window.location.host.split('.');
				var tld = urlArr[urlArr.length-1];
				log('Detected TLD/language: '+tld);
				currentLanguage = tld;
			}
			return currentLanguage;
		}
		
		isLanguageSupported = function(lan) {
			return typeof languages[lan] !== 'undefined';
		}
		
		var languages = {
			'uk' : {
				'availability' : {
					'In stock (few left)' : 'Left in stock',
					'In stock' : 'In stock',
					
					'Unavailable' : 'We don\'t know when or if this item will be back in stock',
					'Temporarily out of stock' : 'Temporarily out of stock.', /*can be ordered*/
				}
			},
			'es' : {
				'availability' : {
					'In stock (expected)' : 'Envío en',
					'In stock' : 'En stock',
					
					'Unavailable' : 'No disponible', /*unverified*/
					'Temporarily out of stock' : 'Temporalmente sin stock.',/*can be ordered*/
					'Unavailable for the moment': 'No disponible por el momento', /*unverified*/
				}
			},
			'it' : {
				'availability' : {
					'In stock (special)' : 'Disponibilità: ',
					'In stock (dispatch)' : 'Generalmente spedito',
					'In stock' : 'Disponibilità immediata',
					
					'Unavailable' : 'Attualmente non disponibile.', /*unverified*/
				}
			},
			'fr' : {
				'availability' : {
					'In stock' : 'En stock',
					
					'Unavailable' : 'Actuellement indisponible.',
					'Temporarily out of stock' : 'Temporairement en rupture de stock.',/*can be ordered*/
					'Availability unknown' : 'Disponibilité inconnue', /*unverified*/
					'Individual dealers' : 'Voir les offres',
				}
			},
			//https://www.amazon.co.uk/gp/help/customer/display.html?nodeId=201910280
			//https://www.amazon.it/gp/help/customer/display.html?nodeId=201910280
			//https://www.amazon.es/gp/help/customer/display.html?nodeId=201910280
			
		};
		
		var asinPhrases = [
			"<tr><td class='label'>ASIN</td><td class='value'>%asin%</td></tr>",
			"<li><b>ASIN: </b>%asin%</li>"
		];
		
		checkAvailabilityResults = function(asin, str, unknownIsFine) {
			var language = getLanguage();
			if (!isLanguageSupported(language)) {
				setResult(asin, '-','availability');
				return true;
			}
			
			//minor workaround: cut off part of page with "unavailable" things
			var startIndex = str.indexOf('id="centerCol"');
			var endIndex = str.indexOf('id="bottomRow"');
			str = str.substr(startIndex, endIndex-startIndex);
			
			var checks = Object.keys(languages[language]['availability']);
			for (var index in checks) {
				var message = checks[index];
				//var testString = languages[language]['availability'][message].replace('%asin%',asin);
				var testString = languages[language]['availability'][message];
				if (str.toLowerCase().indexOf(testString.toLowerCase())>-1) {
					setResult(asin, message,'availability', (message.substr(0,8).toLowerCase() != 'in stock') ? 'Stock issue' : null );
					return true
				}
			}
			setResult(asin, 'Unknown','availability', (!unknownIsFine) ? 'Stock issue' : null );
			return true
		};
		
		checkVendorResults = function(asin, str) {
			var regex = new RegExp(/id="bylineInfo"[^>]*>([^<]*)<\/a>/gi);
			var matches = regex.exec(str);
			if (matches && typeof matches[1] !== undefined) {
				setResult(asin, matches[1], 'vendor' );
				return true;
			}
			setResult(asin, 'No vendor found', 'vendor' );
			return true;
		}
		
		checkNameResults = function(asin, str) {
			var regex = new RegExp(/<span id="productTitle"[^>]*>([^<]*)<\/span>/gi);
			var matches = regex.exec(str);
			if (matches && typeof matches[1] !== undefined) {
				setResult(asin, matches[1], 'name' );
				return true;
			}
			setResult(asin, 'No name found', 'name' );
			return true;
		}
		
		checkStatusResults = function(asin, statusCode) {
			var result = ''
			if (statusCode === 404) {
				setResult(asin, '404 Page', 'status', 'Page unavailable' );
				return false;
			} else if (statusCode !== 200) {
				setResult(asin, 'Status code: '+statusCode, 'status', 'Page unavailable' );
				return false;
			}
				setResult(asin, 'Good', 'status' );
			return true;
		};
		
		checkRedirectResults = function(asin, str) {
			for (var index in asinPhrases){
				var testString = asinPhrases[index].substr(0, asinPhrases[index].indexOf('%asin%'));
				if (str.indexOf(testString)!==-1){
					var asinIndex = str.indexOf(testString)+testString.length;
					var foundAsin = str.substr(asinIndex).substr(0,10);
					if (asin !== foundAsin) {
						setResult(asin, foundAsin, 'redirect' );
						return true;
					} else {
						return true;
					}
				}
			}
			setResult(asin, 'ERROR: No ASIN found on page', 'result' );
			return false;
		}
		
		setResult = function(asin, checkResult, checkType, totalResult) {
			$('[data-asin=\''+asin+'\']').find('.'+checkType).html(checkResult);
			if ( totalResult && (!$('[data-asin=\''+asin+'\']').find('.result').html()) ){
				$('[data-asin=\''+asin+'\']').find('.result').html(totalResult);
			}
		}
		
		processResult = function(asin, str, statusCode) {
			str = str.replace(/ +(?= )/g,''); //Preprocessing to deal with multiple spaces. We remove all double (and more) spaces
			
			var result = true;
			if (result) result = 	checkStatusResults(asin, statusCode);
			if (result) result = 	checkRedirectResults(asin, str);
			if (result) result = 	checkAvailabilityResults(asin, str, true);
			if (result) result = 	checkVendorResults(asin, str);
			if (result) result = 	checkNameResults(asin, str);
			
			var notedResult = $('[data-asin=\''+asin+'\']').find('.result').html();
			if (!notedResult) {
				$('[data-asin=\''+asin+'\']').find('.result').html('Good');
			}
		};
		
		makeAmazonCallRecursive = function(index, arr, handler) {
			var closureArray = arr;
			var closureIndex = index;
			if (index==arr.length) {
				handler();
				return;
			}
			
			log(closureIndex+1+' of '+closureArray.length);
			
			$.ajax({
				url: getBaseURL()+arr[index],
				success:function(data, textStatus, jqXHR) {
					processResult(closureArray[closureIndex], data, jqXHR.status);
				},
				error:function(jqXHR, textStatus, errorString) {
					processResult(closureArray[closureIndex], jqXHR.responseText, jqXHR.status);
				}
			}).then(function(data){
				if (index==arr.length) handler();
				else {
					makeAmazonCallRecursive(++closureIndex, closureArray, handler)
				}
			},function(data){
				if (index==arr.length) handler();
				else {
					makeAmazonCallRecursive(++closureIndex, closureArray, handler)
				}
			});
		};
		
		createOutputRow = function(asin) {
			var $row = $('<tr></tr>').addClass('resultRow');
			
			var rowContentType = asin ? '<td></td>' : '<th></th>';
			
			$row
				.append($(rowContentType).addClass('asin').html('ASIN'))
				//.append($(rowContentType).addClass('link').html(''))
				
				.append($(rowContentType).addClass('status').html('Status'))
				.append($(rowContentType).addClass('redirect').html('Redirect'))
				
				.append($(rowContentType).addClass('name').html('Name'))
				.append($(rowContentType).addClass('vendor').html('Vendor'))
				.append($(rowContentType).addClass('availability').html('Availability'))
				
				.append($(rowContentType).addClass('result').html('Result'))
			;
			
			if (asin) {
				$row.attr('data-asin', asin).children().html('');
				$row.find('.asin').html(asin);
				$row.find('.link').html('(link)');
			} else {
				$row.removeClass('resultRow').addClass('headerRow');
			}
			return $row;
		}
		
		var runError = false;
		
		$('.CheckerApp').remove();
		var $overlay = $('<div style="width:100%; height:100%; background-color: rgba(0,0,0,0.5);position:absolute;top:0px;left:0px;z-index:1000;text-align:center;"></div>').addClass('CheckerApp');
		var $main = $("<div style='background-color:white;display:inline-block;width:75%;margin-top:50px;text-align:left;'>");
		$overlay.append( $main );
		
		var metaInfoElements = "";
		metaInfoElements = metaInfoElements + "<div><span>ASIN validity checker, version: </span><span class='Version'></div>";
		metaInfoElements = metaInfoElements + "<div><span>Currently running on language: </span><span class='Language'></div>";
		$main.append($(metaInfoElements));
		
		
		var responseElements = ""
		responseElements = responseElements + "<div><span class='Log'></span></div>";
		$main.append($('<hr>')).append($(responseElements));
		
		
		if (isLanguageSupported(getLanguage())) {
			var applicationElements = "";
			
			applicationElements = applicationElements + "<div style='background-color: white;'><span>Paste ASINS here:&nbsp;</span><input class='ASINInput'type='textarea' style='width:50%;' /></div>";
			applicationElements = applicationElements + "<div><input value='Check' class='GoButton' type='submit' /></div>";
			applicationElements = applicationElements + "<div><table class='ASINoutput'></table></div>";
			$main.append($('<hr>')).append($(applicationElements));
		} else {
			runError = 'The selected language is not supported. The application currently supports: '+Object.keys(languages).toString().replace(',',', ')+'.';
		}
		
		$('body').append( $overlay ).css('position', 'relative');
		
		$('.Version').html(checkerAppVersion);
		$('.Language').html(getLanguage());

		if (runError) {
			log(runError);
			$('.Log').css("color", "crimson");
			return;
		}
		
		log('Please paste your ASINs in the field below and click "Check".');
		
		var testSet = '';
		$('.ASINInput').val(testSet);
		
		var performCalls = function() {
			$('.ASINoutput').empty();
			var asins = $('.CheckerApp').find('.ASINInput').val().split(' ');
				$('.ASINoutput').append(
					createOutputRow()
				);
			
			for (var index=0;index<asins.length;index++) {
				if (asins[index].length===0) continue;
				$('.ASINoutput').append(
					createOutputRow(asins[index])
				);
			}
			//$('.ASINoutput').find('.resultRow').find('.link').on('click', function(){
			//	window.open(getBaseURL()+$(this).parents('.resultRow').attr('data-asin'), '_blank');
			//});
			$('.ASINoutput').find('.resultRow').find('.asin').on('click', function(){
				window.open(getBaseURL()+$(this).parents('.resultRow').attr('data-asin'), '_blank');
			});			
			makeAmazonCallRecursive(0, asins, function(){log('Done!')});
		};
		$('.GoButton').on('click', performCalls);
	};
    document.head.appendChild(e);
})(document.createElement('script'), '//code.jquery.com/jquery-latest.min.js')
