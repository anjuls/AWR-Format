function showConvertedBytes(){
	// this adds small text next columns in bytes using bytePrettyPrint
	// error with kbytes
	// might replace with tooltip
	$("td:first-child:contains('bytes')").each(function(){
		$(this).siblings().each(function(){
			var currentVal=$(this).text();
			currentVal=currentVal.replace(/\,/g,'');
			currentVal=parseFloat(currentVal);
			if(currentVal>1024){
				
				$(this).html(
					$(this).text()+
					'<span class="bytePrettyPrint">('+
					 bytePrettyPrint($(this).text())+
					 ')</span>'
				);
			}
		})

	})	
}



function sqlSummaryGetsPrettyPrint(gets,returnObj){
	
	var y = convertGetsToBytes(gets);
	
	if(y>1024){
		returnObj.display = bytePrettyPrint(y);
		returnObj.title = 'gets: '+gets;
		return true;
	}
	else{
		returnObj.display = gets;
		returnObj.title = '';
		return true;
	}

}


function addToolTipToCell(cellObj,unitType){
	$(cellObj).tipsy({opacity: 0.9, delayIn: 400,gravity: 'nw',title: function() { return getCellContentsToolTip(this,unitType); } });
	//$(cellObj).css('color','#264463');
	$(cellObj).addClass('number-convert-tooltip');
}
