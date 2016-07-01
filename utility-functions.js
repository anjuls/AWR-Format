function bytePrettyPrint(x){
    if(typeof x === 'string'){
        var x1=x.replace(/\,/g,'');
        var y=parseFloat(x1);
    }
    else{
        var y=x;
    }
	
	if(isNaN(y)){
		return '';
	}
    
    if(y>1099511627776){
		// TB (y > 1 TB)
        return (y/1024/1024/1024/1024).toFixed(1)+' TB';
    }
    else if(y>1073741824){
		// GB (y > 1 GB)
        return (y/1024/1024/1024).toFixed(1)+' GB';
    }
	else if(y>1048576){
		// MB (y > 1 MB)
		return (y/1024/1024).toFixed(1)+' MB';
    }
	else if(y>1024){
		// KB (y > 1 KB)
		return (y/1024).toFixed(1)+' KB';
	}
	else{
		return y +' B';
	}
}


function getSection(titleArray,sectionObj){
	var exitLoopNow = false;
	for ( var i=0, len=titleArray.length; i<len; ++i ){
		$('.custom-awr-header:contains("'+titleArray[i]+'"):not(.custom-summary-table)').each(function(){
			if($(this).text().trim() === titleArray[i]){
				sectionObj.header = $(this);
				sectionObj.table = $(this).data('tableElement');
				return sectionObj;
				exitLoopNow = true;
			}
			
			if(exitLoopNow){
				return false;
			}
		});
		
		if(exitLoopNow){
			break;
		}
		
	}
}

function getSectionByName(name,sectionObj){
	sectionId = convertHeaderNameToId(name);
	//log('name: '+name);
	//log('section id: '+sectionId);
	
	$('#'+sectionId).each(function(){
		//log('section text: '+$(this).text().trim());
		if($(this).text().trim() === name){
			sectionObj.header = $(this);
			sectionObj.table = $(this).data('tableElement');
			
			return sectionObj;
		}
	});
	
	return false;
}


function getJumpLinkFromSection(sectionObj,jumpText){
	var theLink ="";
	var jumpTextLocal = "Jump to Original Section";
	
	if(jumpText){
		jumpTextLocal=jumpText;
	}
	
	if(typeof $(sectionObj.header).data('anchorElement') !== 'undefined' ){
		theLink	= '<a href="#'+$(sectionObj.header).data('anchorElement').attr('name')+'" class="awr jump-link">'+jumpTextLocal+'</a>';
	}

	return theLink;
}

function getCellByHeader(rowObj,headerNum){
	return $(rowObj).find('td:eq('+headerNum+')').text();
}

function getCellByHeaderName(rowObj,headerCellsObj,headerName){
	// headerCellsObj is retrieved by calling getHeaderCells()
	return $(rowObj).find('td:eq('+headerCellsObj[headerName]+')');
}

function convertGetsToBytes(gets){
	if(gets){
		if(gets.replace){
			var x1=gets.replace(/\,/g,'');
			var y=parseFloat(x1);
		}
		else{
			var y=gets;
		}
	}
	else{
		return;
	}
		
		
	y = (y * awrRpt.blockSizeKb)*1024;
	return y;
}


function cleanNumber(theString){
	var x = theString;
	var y = x.replace(/\,/g,'');
	y = parseFloat(y);
	return y;
}


function convertNumberTo(linkObj){
	$('#numberConvertsionContainer').empty().append($(awrRpt.convertNumberCellObj).text()+' min ');
	$('#numberConvertsionContainer').append($(linkObj).text());
	
}


function linkConvertNumbers(){
	$('td').click(function(e) {
	  if(e.shiftKey) {
		//Shift-Click
	  }
	  if(e.ctrlKey) {
		//Ctrl+Click
		if(!isNaN($(this).text().replace(/\,/g,''))){
			awrRpt.convertNumberCellObj = $(this);
			showConvertNumberPopup($(this));
		}
		
		
	  }
	  if(e.altKey) {
		//Alt+Click
	  }
	});
}


function convertTimeUnits(timeData,unitType){
	var theNumber = parseFloat(timeData.replace(/\,/g,'').trim());
	if(unitType==='minutes'){
		theNumber = theNumber*60;
	}
	var timeObj = secondsToTime(theNumber);
	return timeObj.h+':'+timeObj.m+':'+timeObj.s;
}


function addCommas(nStr)
{
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}


Array.prototype.findIndex = function(value){
	var ctr = "";
	for (var i=0; i < this.length; i++) {
		if (this[i] == value) {
			return i;
		}
	}
	return ctr;
};


function convertBytesToUnit(bytesIn,outputUnitType,returnObj){
	//log('convertBytesToUnit, bytesIn: '+bytesIn+', outputUnitType: '+outputUnitType);
	if(bytesIn.replace && typeof bytesIn.replace !== 'undefined' && bytesIn.replace !== null){
        var x1=bytesIn.replace(/\,/g,'');
        var y=parseFloat(x1);
    }
    else{
        var y=bytesIn;
    }
    
    if(outputUnitType === 'TB'){
		returnObj.number = (y/1024/1024/1024/1024).toFixed(1);
		returnObj.newUnits = 'TB';
		returnObj.formatted = addCommas(returnObj.number)+' TB';
        return true;
    }
    else if(outputUnitType === 'GB'){
		returnObj.number = (y/1024/1024/1024).toFixed(1);
		returnObj.newUnits = 'GB';
		returnObj.formatted = addCommas(returnObj.number)+' GB';
        return true;
    }
	else if(outputUnitType === 'MB'){
		returnObj.number = (y/1024/1024).toFixed(1);
		returnObj.newUnits = 'MB';
		returnObj.formatted = addCommas(returnObj.number)+' MB';
        return true;
    }
	else if(outputUnitType === 'KB'){
		log('converting to KB:'+y);
		returnObj.number = (y/1024).toFixed(1);
		returnObj.newUnits = 'KB';
		returnObj.formatted = addCommas(returnObj.number)+' KB';
        return true;
	}
	else{
		returnObj.number = (y).toFixed(1);
		returnObj.newUnits = 'B';
		returnObj.formatted = addCommas(returnObj.number)+' B';
        return true;
	}

}

function convertStorageUnits(storageData,unitType,returnObj){
	var theString = storageData.replace(/\,/g,'').trim();
	
	if(/gets|reads|blocks/i.test(unitType)){
		var theBytes = convertGetsToBytes(theString);
		var theSize = bytePrettyPrint(theBytes).toString();
		returnObj.text = theSize;
		if(typeof theSize.match(/[A-Z]{1,2}$/) !== 'undefined' && theSize.match(/[A-Z]{1,2}$/) !== null){
			returnObj.newUnits = theSize.match(/[A-Z]{1,2}$/)[0];
		}
		else{
			returnObj.newUnits = unitType;
		};
		return true;
	}
	else if(unitType==='bytes'){
		var theSize = bytePrettyPrint(theString).toString();

		returnObj.text = theSize;
		if(typeof theSize.match(/[A-Z]{1,2}$/) !== 'undefined' && theSize.match(/[A-Z]{1,2}$/) !== null){
			returnObj.newUnits = theSize.match(/[A-Z]{1,2}$/)[0];
		}
		else{
			returnObj.newUnits = unitType;
		};
		return true;
	}
}


function secondsToTime(secs)
{
	var hours = Math.floor(secs / (60 * 60));
	
	var divisor_for_minutes = secs % (60 * 60);
	var minutes = Math.floor(divisor_for_minutes / 60);

	var divisor_for_seconds = divisor_for_minutes % 60;
	var seconds = Math.ceil(divisor_for_seconds);
	
	hours = padding_left(hours+='', '0', 2);
	minutes = padding_left(minutes+='', '0', 2);
	seconds = padding_left(seconds+='', '0', 2);
	
	
	var obj = {
		"h": hours,
		"m": minutes,
		"s": seconds
	};
	return obj;
}




//sets the item in the localstorage
function localStorageSetItem(key, value) {
	try {
	  window.localStorage.removeItem(key);
	  window.localStorage.setItem(key, value);
	}catch(e) {
	  log("Error inside setItem");
	  log(e);
	}
}
//Gets the item from local storage with the specified
//key
function localStorageGetItem(key) {
	var value;
	try {
	  value = window.localStorage.getItem(key);
	}catch(e) {
	  log("Error inside getItem() for key:" + key);
	  log(e);
	  value = "null";
	}
	return value;
}
//Clears all the key value pairs in the local storage
function localStorageClearStrg() {
	window.localStorage.clear();
}

function log(txt) {
	if(logging) {
	  console.log(txt);
	}
}

function time(txt){
	if(timing) {
	  console.time(txt);
	}
}

function timeEnd(txt){
	if(timing) {
	  console.timeEnd(txt);
	}
}

function profile(txt) {
	if(profiling) {
	  console.profile(txt);
	}
}

function profileEnd(txt) {
	if(profiling) {
	  console.profileEnd(txt);
	}
}
 
// left padding s with c to a total of n chars
//padding_left('abcd', '0', 8);                        // 0000abcd

function padding_left(s, c, n) {
    if (! s || ! c || s.length >= n) {
        return s;
    }

    var max = (n - s.length)/c.length;
    for (var i = 0; i < max; i++) {
        s = c + s;
    }

    return s;
}

// right padding s with c to a total of n chars
//padding_right('1234', '0', 9);                       // 123400000
function padding_right(s, c, n) {
    if (! s || ! c || s.length >= n) {
        return s;
    }

    var max = (n - s.length)/c.length;
    for (var i = 0; i < max; i++) {
        s += c;
    }

    return s;
}

function convertHeaderNameToId(headerName){
	return headerName.replace(/\s/g,'_').replace(/\W/g,'-');
}