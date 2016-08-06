// Tyler D. Muth

var version='1.6';
var logging=false;
var timing=false;
var profiling=false;
var awrRpt=new Object;
var awrRptObservations=[];
var sectionTitles=[];

sectionTitles["Top 5 Timed Foreground Events"]=["Top 5 Timed Foreground Events","Top 5 Timed Events"];
sectionTitles["Time Model Statistics"]=["Time Model Statistics"];
sectionTitles["Foreground Wait Class"]=["Foreground Wait Class"];
sectionTitles["Foreground Wait Events"]=["Foreground Wait Events"];
sectionTitles["Background Wait Events"]=["Background Wait Events"];

var sectionTblspaceIoObj = new Object;


$(document).ready(function() {
	
	//showSpinner();
	var t=setTimeout('',500);
	time('determineReportType');
	determineReportType();
	timeEnd('determineReportType');
	

	if (awrRpt.isAwr==='YES'){
		showInitialButtonBar();
	}
	
});

function determineReportType(){
	
	if ($("title:contains('AWR')").length){
		if ($('h1:contains("WORKLOAD REPOSITORY")').length){
			awrRpt.isAwr = 'YES';
		}	
	}
	
	
	if(awrRpt.isAwr === 'YES'){
		if ($('h1:contains("WORKLOAD REPOSITORY")').text().indexOf('RAC') > 0){
			awrRpt.racReport='YES';
		}
		else{
			awrRpt.racReport='NO';
		}
		
		awrRpt.comparePeriod = 'NO';
		if ($('h1:contains("WORKLOAD REPOSITORY")').text().indexOf('Compare Period') > 0){
			awrRpt.comparePeriod = 'YES';
		}
		
	
	
		var instanceTable = $('h1:contains("WORKLOAD REPOSITORY")').nextAll("p").eq(0).find('table:first-child');
		var instanceTblHeaderCells=new Object;
		getHeaderCells(instanceTable,instanceTblHeaderCells);
		var instanceTblRow=$(instanceTable).find('tr:nth-child(2)');
		
		awrRpt.dbName = $(getCellByHeaderName(instanceTblRow,instanceTblHeaderCells,'DB Name')).text();
		awrRpt.dbHostName = $(getCellByHeaderName(instanceTblRow,instanceTblHeaderCells,'Host')).text();
		awrRpt.dbId = $(getCellByHeaderName(instanceTblRow,instanceTblHeaderCells,'DB Id')).text();
		awrRpt.racInstanceNum = $(getCellByHeaderName(instanceTblRow,instanceTblHeaderCells,'Inst num')).text();
		awrRpt.dbVersion = $(getCellByHeaderName(instanceTblRow,instanceTblHeaderCells,'Release')).text();
		awrRpt.dbVersionMajor = parseInt(awrRpt.dbVersion.replace(/^(\d+)\..*/,"$1"));
		awrRpt.dbVersionMinor = parseInt(awrRpt.dbVersion.replace(/^(\d+)\.(\d+).*/,"$2"));
		
		awrRpt.racDB = $(getCellByHeaderName(instanceTblRow,instanceTblHeaderCells,'RAC')).text();
		
		
		var cellPhysIoInterconnectBytes='';
		$('td:first-child:contains("cell physical IO interconnect bytes")').each(function(){
			if($(this).text() === 'cell physical IO interconnect bytes'){
				cellPhysIoInterconnectBytes=$(this).next('td').text();
				return true;
			}
		});
		
		
		awrRpt.platform = '';
		if(awrRpt.dbVersionMajor>=11){
			var hostTable=$('table:lt(5):has(th:contains("Platform"))');
			var hostHeaderCells=new Object;
			getHeaderCells(hostTable,hostHeaderCells);
			awrRpt.platform=getCellByHeaderName($(hostTable).find('tr:has(td)'),hostHeaderCells,"Platform").text();
			awrRpt.dbHostName = $(getCellByHeaderName(instanceTblRow,instanceTblHeaderCells,'Host Name')).text();
		}
				
		if((cellPhysIoInterconnectBytes.length > 1) && (awrRpt.platform.indexOf('Linux') >= 0)){
			awrRpt.isExadata='YES';
		}
		else{
			awrRpt.isExadata='NO';
		}	
	}
	else{
		return false;
	}
}



function showInitialButtonBar(){
	
	function setPrefStorageVal(name,val){
		var newVal;
		if(val==='yes'){
			newVal = 'yes';
		}
		else{
			newVal = 'no';
		}
		localStorageSetItem(name,newVal);
	}
	
	function displayPreferences(){
		
		$('#initialFormatMenu').append('<br /><div id="reportPrefs"><span>Preferences: </span></div>');
		if(!/yes|no/i.test(localStorageGetItem('reportPrefLinkWaits'))){
			setPrefStorageVal('reportPrefLinkWaits','yes');
			setPrefStorageVal('reportCombineTopSql','yes');
			setPrefStorageVal('reportPrefHighlighRows','yes');
			setPrefStorageVal('reportPrefHighlighColumns','yes');	
		}
		
		var prefLinkWaits="";
		if(localStorageGetItem('reportPrefLinkWaits') === 'yes'){prefLinkWaits=' checked="checked"';}
		$('#reportPrefs').append('<input type="checkbox" name="link_wait_events" value="yes" id="reportPrefLinkWaits"'+prefLinkWaits+'"/> Link Wait Events');
		$('#reportPrefLinkWaits').click(function(){
			//localStorageSetItem('reportPrefLinkWaits',$('#reportPrefLinkWaits:checked').val());
			setPrefStorageVal('reportPrefLinkWaits',$('#reportPrefLinkWaits:checked').val());
		})
		
		
		var prefCombineTopSql="";
		if(localStorageGetItem('reportCombineTopSql') === 'yes'){prefCombineTopSql=' checked="checked"';}
		$('#reportPrefs').append('<input type="checkbox" name="combine_top_sql" value="yes" id="reportCombineTopSql"'+prefCombineTopSql+'"/> Combine Top SQL');
		$('#reportCombineTopSql').click(function(){
			//localStorageSetItem('reportCombineTopSql',$('#reportCombineTopSql:checked').val());
			setPrefStorageVal('reportCombineTopSql',$('#reportCombineTopSql:checked').val());
		})
		
		var prefHighlightRows="";
		if(localStorageGetItem('reportPrefHighlighRows') === 'yes'){prefHighlightRows=' checked="checked"';}
		$('#reportPrefs').append('<input type="checkbox" name="highlight_rows" value="yes" id="reportHighlighRows"'+prefHighlightRows+'"/> Highlight Rows');
		$('#reportHighlighRows').click(function(){
			//localStorageSetItem('reportPrefHighlighRows',$('#reportHighlighRows:checked').val());
			setPrefStorageVal('reportPrefHighlighRows',$('#reportHighlighRows:checked').val());			
		})
		
		var prefHighlightColumns="";
		if(localStorageGetItem('reportPrefHighlighColumns') === 'yes'){prefHighlightColumns=' checked="checked"';}
		$('#reportPrefs').append('<input type="checkbox" name="highlight_Columns" value="yes" id="reportHighlighColumns"'+prefHighlightColumns+'"/> Highlight Columns');
		$('#reportHighlighColumns').click(function(){
			//localStorageSetItem('reportPrefHighlighColumns',$('#reportHighlighColumns:checked').val());	
			setPrefStorageVal('reportPrefHighlighColumns',$('#reportHighlighColumns:checked').val());			
		})
	}

	var moreDetails ='<span id="moreDetails"><a target="_blank" href="chrome-extension://agejgflogmnnkmojpnmfladhplamhhnb/whats-new.html">[details]</a></span>';

	$('body').prepend('<div style="margin:-10px;margin-bottom:30px;padding: 8px;height:50px;width:100%;background-color:#002b55" id="initialFormatMenu"></div>');
	if(awrRpt.comparePeriod==="NO" && awrRpt.racReport ==="NO"){
		$('#initialFormatMenu').append('<span class="report-title">AWR Formatter '+version+moreDetails+'</span><div id="topButtons" />');
		$('#topButtons').append('<a href="#" id="initialFormatButton">Format AWR</a>');
		$('#topButtons').append('<a href="#" id="initialFormatHide">Hide This Menu</a>');
		$( "#topButtons a" ).button();
		
		$( "#initialFormatButton" ).click(function() { 
			$('body').css('cursor','progress');
			formatAWR();
			//$('#initialFormatMenu').hide(); 
			$('#initialFormatButton').button('disable'); 
			$('#initialFormatHide').button('disable'); 
			
			$('#reportCombineTopSql,#reportPrefLinkWaits').attr("disabled", true);
			return false; 
		});

		$( "#initialFormatHide" ).click(function() { 
			$('#initialFormatMenu').hide(); 
			return false; 
		});
	
	
		var racReport="Non-RAC Report";
		if(awrRpt.racReport==='YES'){
			racReport='RAC Report';
		}
		
		var comparePeriod="";
		
		if(awrRpt.comparePeriod==='YES'){
			comparePeriod=', Compare Period';
		}
		
		
		$('#initialFormatMenu').append('<div id="reportType"><span>Report Type:</span> '+awrRpt.dbVersion+', '+racReport + comparePeriod+'</div>');
		
		
		displayPreferences();
		
		
	}
	else{
		$('#initialFormatMenu').append('<div id="reportType">"Compare Period" or "RAC / Global" reports are not supported yet...</div>');
	}
	
}


function showSpinner(){
	$('body').append('<div id="spinner"><img src="ajax-loader.gif" /></div>');
	//$('body').append('<div id="spinner">Running...</div>');
	$('#spinner').css('position','absolute');
	$('#spinner').css('top','200');
	$('#spinner').css('left','50%');
}

function hideSpinner(){
	$('#spinner').remove();
}


function showCsvToTablePopup(theText){
	$("#sqlTextPopup").empty().append('<textarea rows="20" cols="90" class="table-to-csv">'+theText+'</textarea>');
	$("#sqlTextPopup").dialog("open");
	$('#sqlTextPopup').dialog('option', 'title', 'CSV Export');
}

function addCsvOptionToTable(tableObj){
	
	if(!$(tableObj).hasClass('table-to-csv-container-table')){
		$(tableObj).addClass('table-to-csv-container-table');
		var $newDiv = $('<span class="table-to-csv-container"><a href="#" class="table-to-csv-link">Convert to CSV</a></span>');
		$(tableObj).first().before($newDiv);
		
		$($newDiv).find('a').click(function(){
			var theText=$(tableObj).table2CSV({delivery: 'value'});
			showCsvToTablePopup(theText);
			return false;
		})
	}
}


function showSqlTextPopup(sqlId){
	

	function renderSqlText(){
		log('in render');
		if(localStorageGetItem('sqlTextDisplayOriginal') === 'no'){
			log('original = no');
			var sqlkeywords=['select','from','where','and','or','order by','group by','having','connect by','start with'];
			var sqlText = $('#sqltextdisplayhiddendiv').text();
			for (var i=0; i<sqlkeywords.length; i++) {
				var re = new RegExp("("+sqlkeywords[i]+") ","gi");
				sqlText = sqlText.replace(re,'\r\n$1 ');
				//sqlText = sqlText.replace(re,'~~~~$1 ');
				//log('sqlText: '+sqlText);
			}
			$("#sqltextdisplaydiv").empty().append('<pre id="sqltextdisplaypre"><code>'+sqlText+'</code></pre>');
		
		}
		else{
			log('original = yes');
			$("#sqltextdisplaydiv").empty().append('<pre id="sqltextdisplaypre"><code>'+$('#sqltextdisplayhiddendiv').text()+'</code></pre>');
		}
	
	
		if(localStorageGetItem('sqlTextHighlight')==='yes'){
			$.beautyOfCode.init('clipboard.swf');
			$("#sqltextdisplaypre").beautifyCode('sql',{addControls: false,noGutter: true});
			$("#sqltextdisplaypre").beautifyCode('sql',{toolbar: false,noGutter: true});
		}
		
		$("#sqlTextPopup").dialog("open");
		$('#sqlTextPopup').dialog('option', 'title', 'SQL Text');
		
	} // end renderSqlText()
	
	

	var fullSqlText=$('a[name='+sqlId+']').closest('td').next('td').text();
	
	
	var originalYes='';
	var originalNo='';
	if(localStorageGetItem('sqlTextDisplayOriginal') === 'no'){
		originalNo=' checked="checked"';
	}else{
		originalYes=' checked="checked"';
	}
	
	var highlightYes='';
	var highlightNo='';
	if(localStorageGetItem('sqlTextHighlight') === 'no'){
		highlightNo=' checked="checked"';
	}else{
		highlightYes=' checked="checked"';
	}
	
	
	var sqlPopTabs=
	'<ul>'+
	'	<li><a href="#sql-text-tab">SQL Text</a></li>'+
	'	<li><a href="#sql-awr-plan">SQL Plan</a></li>'+
	'	<li><a href="#sql-color">Color SQL</a></li>'+
	'	<li><a href="#sql-awr-sql-report">AWR SQL Report</a></li>'+
	'</ul>';
	
	//AWR SQL Plan
	var sqlPopAwrPlanTab='<div id="sql-awr-plan">';
	sqlPopAwrPlanTab += "<p class=\"normal-text\">To display the full SQL Plan for this statement, execute the following SQL as a database user with the SELECT_CATALOG_ROLE privilidge. "+
		'This is documented <a href="http://download.oracle.com/docs/cd/E11882_01/appdev.112/e16760/d_xplan.htm#i999706" target="_blank">here</a>.</p>';
	sqlPopAwrPlanTab += "<pre class=\"highlight-no-gutter\"><code>select * from table(dbms_xplan.display_awr('"+sqlId+"',null,"+awrRpt.dbId+",'ALL'));</code></pre>";
	sqlPopAwrPlanTab += '</div>';
	
	
	//AWR Color SQL
	var sqlPopColorSql = '<div id="sql-color">';
	sqlPopColorSql += "<p class=\"normal-text\">To 'color' this SQL, execute the following SQL as a database user with the SELECT_CATALOG_ROLE privilidge. "+
		'This procedure adds a colored SQL ID. If an SQL ID is colored, it will be captured in every snapshot, independent of its level of activities '+
		'(so that it does not have to be a TOP SQL). Capture occurs if the SQL is found in the cursor cache at snapshot time. '+
		'This is documented <a href="http://download.oracle.com/docs/cd/E14072_01/appdev.112/e10577/d_workload_repos.htm#CHDGFJAD" target="_blank">here</a>.</p>';
	sqlPopColorSql += "<pre class=\"highlight-no-gutter\"><code>execute dbms_workload_repository.add_colored_sql(sql_id => '"+sqlId+"', dbid => "+awrRpt.dbId+");</code></pre>";
	sqlPopColorSql += '</div>';
	
	// AWR SQL Report
	/*select output from table(dbms_workload_repository.awr_sql_report_html( :dbid,
                                                            :inst_num,
                                                            :bid, :eid,
                                                            :sqlid,
                                                            :rpt_options ));*/
															
	var sqlPopAwrSqlReport = '<div id="sql-awr-sql-report">';
	sqlPopAwrSqlReport += "<p class=\"normal-text\">To run an AWR report for just this SQL statement, execute the following SQL as a database user with the SELECT_CATALOG_ROLE privilidge. "+
		'This is documented <a href="http://download.oracle.com/docs/cd/E11882_01/appdev.112/e16760/d_workload_repos.htm#CIHHJCEI" target="_blank">here</a>.</p>';
	var sqlAwrOutputFileName = 'awr_sql_report_'+awrRpt.dbName+'_'+awrRpt.snapBegin+'-'+awrRpt.snapEnd+'_id-'+sqlId+'.html';
	sqlPopAwrSqlReport += '<pre class="highlight-no-gutter"><code>set echo off verify off feedback off trimspool on trimout on; \r\nspool '+sqlAwrOutputFileName+'\r\n' +
								"select output from \r\n" +
						        "       table(dbms_workload_repository.awr_sql_report_html(\r\n" +
								"			"+awrRpt.dbId+","+awrRpt.racInstanceNum+","+awrRpt.snapBegin+","+awrRpt.snapEnd+",'"+sqlId+"'));\r\n"+
								"spool off\r\n\r\n</code></pre>";
	
	sqlPopAwrSqlReport += '</div>';
	
	//SQL Text
	var sqlPopSqlTextTab=
		'<div id="sql-text-tab">'+
		'<div class="sqltextdisplayControl" id="sqltextdisplayControl">'+
	   '<span id="sqlOriginalRadio">Display:<input type="radio" name="sqldisplayoriginal" value="yes"'+originalYes+' /> Original'+
	   '<input type="radio" name="sqldisplayoriginal" value="no"'+originalNo+' />Formatted</span>'+
	   '<span id="sytaxradio">Syntax Highlighter:<input type="radio" name="syntaxhighlighterradio" value="yes"'+highlightYes+' /> Yes'+
	   '<input type="radio" name="syntaxhighlighterradio" value="no"'+highlightNo+' />No</span></div>';
	
	sqlPopSqlTextTab += '<div class="sqltextdisplay" id="sqltextdisplaydiv"><pre id="sqltextdisplaypre"><code>'+fullSqlText+'</code></pre></div>';
	sqlPopSqlTextTab += '<div class="sqltextdisplay" id="sqltextdisplayhiddendiv" style="display:none;">'+fullSqlText+'</div>';
	sqlPopSqlTextTab += '</div>';
	
	$("#sqlTextPopup").empty().append('<div id="sql-popup-tabs">' + sqlPopTabs + sqlPopAwrPlanTab + sqlPopColorSql + sqlPopSqlTextTab + sqlPopAwrSqlReport + '</div>');
	
	//$("#sqlTextPopup").append('<div class="sqltextdisplay" id="sqltextdisplaydiv"><pre id="sqltextdisplaypre"><code>'+fullSqlText+'</code></pre></div>');
	//$("#sqlTextPopup").append('<div class="sqltextdisplay" id="sqltextdisplayhiddendiv" style="display:none;">'+fullSqlText+'</div>');
	
	$('#sqltextdisplayControl input').click(function(){
		localStorageSetItem('sqlTextDisplayOriginal',$("#sqlOriginalRadio input[@name=sqldisplayoriginal]:checked").val());
		localStorageSetItem('sqlTextHighlight',$("#sytaxradio input[@name=syntaxhighlighterradio]:checked").val());
		renderSqlText();
	});
	
	renderSqlText();
	
	$.beautyOfCode.init('clipboard.swf');
	$(".highlight-no-gutter").beautifyCode('sql',{addControls: false,gutter: false});
	
	$("#sql-popup-tabs").tabs();
	$("#sql-popup-tabs").tabs('select',0);
}



function formatAWR(){
	
	time('formatAWR');
	//showSpinner();
	//linkInstanceStats();
	/*
	var worker = new Worker("chrome-extension://jihfmcaodmnnnlahonbhipaopgolmcee/worker.js");
	
	// Posts a message to the Web Worker
	worker.postMessage(0);

	// Triggered by postMessage in the Web Worker
	
	worker.onmessage = function (evt) {
		// evt.data is the values from the Web Worker
		console.log(evt.data);
	};
	*/
	//setTimeout(function(){ console.log("test"); }, 5); 
	
	time('associateHeadersWithTables');
	associateHeadersWithTables();
	timeEnd('associateHeadersWithTables');
	
	//linkWaitEventStats();
	//linkOsStats();
	
	time('generateSummary');
	generateSummary();
	timeEnd('generateSummary');
	
	if(localStorageGetItem('reportCombineTopSql') === 'yes'){
		time('consolidateSqlStats');
		consolidateSqlStats();
		timeEnd('consolidateSqlStats');
		
		time('generateSQLsummaryTable');
		generateSQLsummaryTable();
		timeEnd('generateSQLsummaryTable');
	}
	
	if(awrRpt.isExadata==='YES'){getExaStats();}
	
	
	time('addJquiTopTabsObjects');	
	addJquiTopTabsObjects();
	timeEnd('addJquiTopTabsObjects');
	
	time('linkSqlFullText');
	linkSqlFullText();
	timeEnd('linkSqlFullText');
	
	if(localStorageGetItem('reportPrefLinkWaits') === 'yes'){
		time('linkWaitEventStats');
		linkWaitEventStats();
		timeEnd('linkWaitEventStats');
		
		time('linkOsStats');
		linkOsStats();
		timeEnd('linkOsStats');
	}
	
	
	if(localStorageGetItem('reportCombineTopSql') === 'yes'){
		$('#sqlStatsCombined').tableFilter();
		$('#sqlStatsCombined').addClass("tablesorter");
		$('#sqlStatsCombined').tablesorter(); 
		
		time('consolidateSqlIntersectGrid');
		consolidateSqlIntersectGrid();
		timeEnd('consolidateSqlIntersectGrid');
	}

	/*
	$('#sqlStatsCombined').find('input#filter_2').val('>0');
	
	var press = jQuery.Event("keyup");
	press.ctrlKey = false;
	press.which = 40;
	var t=setTimeout('',5000);
	$('#sqlStatsCombined').find('input#filter_2').trigger(press);
	*/

	time('addTableFilterPlugin');
	for(var sectionTitle in sectionTitles) {
		addTableFilterPlugin(sectionTitles[sectionTitle]);
	}
	timeEnd('addTableFilterPlugin');
	
	time('addTablePlugins');
	$('table.custom-awr-table:not(.tablesorter)').each(function(){
		addTablePlugins($(this));
	});
	timeEnd('addTablePlugins');
	
	// fix TopSQL Section
	$('#sqlStatsCombined').find('input.filter').css('width','60px');
	
	time('linkConvertNumbers');
	linkConvertNumbers();
	timeEnd('linkConvertNumbers');
	
	time('addToolTipTopSQL');
	addToolTipTopSQL();
	timeEnd('addToolTipTopSQL');
	
	time('checkObservations');
	checkObservations();
	timeEnd('checkObservations');
	
	time('addToolTipInstanceActivity');
	addToolTipInstanceActivity();
	timeEnd('addToolTipInstanceActivity');
	
	time('addTooltipToCellsNeedTooltip');
	addTooltipToCellsNeedTooltip();
	timeEnd('addTooltipToCellsNeedTooltip');
	
	
	
	
	addAboutTab();
	
	$("#jquitoptabs").tabs();
	$("#jquitoptabs").tabs('select',0);

	
	time('generateIoGraphs');
	generateIoGraphs();
	timeEnd('generateIoGraphs');
	
	$("#jquitoptabs").find('table').each(function(){
		addCsvOptionToTable($(this));
	})

	
	time('rowColumnHighlighting');
	// row and column highlighting
	$("table").delegate('td','mouseover mouseleave', function(e) {
		if (e.type == 'mouseover') {
			if(localStorageGetItem('reportPrefHighlighRows')==='yes'){
				$(this).parent().addClass("hover");
			}
			if(localStorageGetItem('reportPrefHighlighColumns')==='yes'){
				var theIndex = $(this).index()+1;
				$(this).closest('table').find("tbody tr td:nth-child("+theIndex+")").addClass("hover");
			}
		}
		else {
			if(localStorageGetItem('reportPrefHighlighRows')==='yes'){
				$(this).parent().removeClass("hover");
			}
			if(localStorageGetItem('reportPrefHighlighColumns')==='yes'){
				var theIndex = $(this).index()+1;
				$(this).closest('table').find("tbody tr td:nth-child("+theIndex+")").removeClass("hover");
			}			
		}
	});
	timeEnd('rowColumnHighlighting');
	
	$('body').css('cursor','default');
	timeEnd('formatAWR');
	
}


function addAboutTab(){
	$('#jquitoptabs ul').append('<li><a href="#aboutSection">About</a></li>');
	$('#jquitoptabs').append('<div id="aboutSection">This is a google Chrome Plugin written by Tyler Muth (<a href="http://tylermuth.wordpress.com" target="_blank">http://tylermuth.wordpress.com</a>) to make AWR reports more '+ 						'readable. It is not a replacement for ADDM, and as such is not designed to tune your database. It\'s simply a tool to make a useful report more useful.'+
							 '<br /><br />Libraries Used:'+
							 '<ul><li><a href="http://jquery.com/" target="_blank">jQuery</li>'+
							 '<li><a href="http://jqueryui.com/" target="_blank">jQuery UI</li>'+
							 '<li><a href="http://www.picnet.com.au/picnet_table_filter.html" target="_blank">PicNet Table Filter</a></li>'+
							 '<li><a href="http://tablesorter.com/docs/" target="_blank">jQuery Table Sorter</a></li></ul></div>');

}



function linkWaitEventStats(){

	$('table.custom-awr-table,#customSummaryTab,table.custom-awr-table-non-tagged').each(function(){
		var tableObj = $(this);
	
		$(tableObj).find("td:first-child:not(:has(a))").each(function(){
			var tdText=$(this).text().trim();
			if( dbWaitDefs[tdText] !== undefined ) {
				$(this).css("text-decoration","underline")
					.css("color","blue")
					.css("cursor","help")
					.click(function(){
						showStatDesc($(this).text(),'dbWaitDefs');
					});
			}
			else if(dbStatDefs[tdText] !== undefined){
				$(this).css("text-decoration","underline")
					.css("color","blue")
					.css("cursor","help")
					.click(function(){
						showStatDesc($(this).text(),'dbStatDefs');
					});
			}
			else if(enqueueDefs[tdText] !== undefined){
				$(this).css("text-decoration","underline")
					.css("color","blue")
					.css("cursor","help")
					.click(function(){
						showStatDesc($(this).text(),'enqueueDefs');
					});
			}
			else if(customDefinitions[tdText] !== undefined){
				$(this).css("text-decoration","underline")
					.css("color","blue")
					.css("cursor","help")
					.click(function(){
						showStatDesc($(this).text(),'customDefinitions');
					});
			}else if(tdText.indexOf('gc ') === 0){
				$(this).append('<span class="ui-icon ui-icon-document arw-custom-documentation-link rac-doc-link" title="Click to view link to relevant documentation"></span>');
				$(this).wrapInner('<div class="doclink-wrapper" />');
				$(this).find('span.rac-doc-link').click(function(){
					documentationRacWaitEventsLink();
					return true;
				});
			}else if(tdText.indexOf('PX ') === 0){
				$(this).append('<span class="ui-icon ui-icon-info arw-custom-mos-link pq-doc-link" title="Click to view link to relevant MyOracleSupport (MOS) Note"></span>');
				$(this).wrapInner('<div class="doclink-wrapper" />');
				$(this).find('span.pq-doc-link').click(function(){
					documentationPxWaitEventsLink();
					return true;
				});
			}
			
			if( idleWaitEvents[tdText] !== undefined ) {
				var spanClass="arw-custom-idle-wait";
				if ($(this).children('div').length === 0){
					$(this).wrapInner('<div class="doclink-wrapper" />');
					spanClass="arw-custom-idle-wait2";
				}
			
				$(this).find('div').append('<span class="ui-icon ui-icon-arrow-1-s '+spanClass+'" title="This is an idle wait event"></span>');
				$(this).css("color","#aaaaaa")
				
				$(this).find('span.arw-custom-idle-wait').click(function(){
					documentationIdleWaitEventsLink();
					return true;
				});
			}
			
			
			
		});
	});
}


function documentationRacWaitEventsLink(){
	$("#statdesc").dialog('option', 'title', 'Documentation for RAC Wait Events');
	$("#statdesc").empty().append('"gc" wait events are documented in the <strong>Oracle® Real Application Clusters Administration and Deployment Guide</strong>:<br />'+
								  '<a target="_blank" href="http://download.oracle.com/docs/cd/E18283_01/rac.112/e16795/monitor.htm">'+
								  'http://download.oracle.com/docs/cd/E18283_01/rac.112/e16795/monitor.htm</a>');
	$("#statdesc").dialog("open");
}


function documentationPxWaitEventsLink(){
	$("#statdesc").dialog('option', 'title', 'Documentation for Parallel Wait Events');
	$("#statdesc").empty().append('"PX" wait events that are not covered in the Database Rerference are documented in My Oracle Support Master Note <strong>1097154.1</strong>:<br />'+
								  '<a target="_blank" href="https://support.oracle.com/metalink/plsql/showdoc?db=NOT&id=1097154.1">'+
								  'https://support.oracle.com/metalink/plsql/showdoc?db=NOT&id=1097154.1</a><br /><br />'+
								  'They are also briefly discussed in this blog post:<br />'+
								  '<a target="_blank" href="http://blogs.oracle.com/db/2010/09/master_note_parallel_execution_wait_events.html">'+
								  'http://blogs.oracle.com/db/2010/09/master_note_parallel_execution_wait_events.html</a><br /><br />'
								  );
	$("#statdesc").dialog("open");
}

function documentationIdleWaitEventsLink(){
	$("#statdesc").dialog('option', 'title', 'Idle Wait Events');
	$("#statdesc").empty().append('In general there is nothing you can do about idle wait events, move on');
	$("#statdesc").dialog("open");
}



function linkOsStats(){
	tableObj=$('h3:contains("Operating System Statistics")').nextAll("table").eq(0);
	for(var index in osStatDefs) {
		$(tableObj).find("td:first-child:contains("+index+")")
			.css("text-decoration","underline")
			.css("color","blue")
			.css("cursor","help")
			.click(function(){
				showStatDesc($(this).text(),'osStatDefs');
		})
	}
}



function showStatDesc(statName,statObj){
	var statDef;
	eval("statDef="+statObj+"[statName]");

	$("#statdesc").dialog('option', 'title', statName);
	$("#statdesc").empty().append(statDef);
	$("#statdesc").dialog("open");
	

}



function generateSummary(){
	
	function genSumRow(a,b,rowClass){
		var newRowClass = '';
		if(typeof rowClass != 'undefined'){
			newRowClass = ' class="'+rowClass+'"';
		}
		
		if(typeof b === 'string' && b.indexOf('NaN') > 0){
			return '';
		}
		else{
			return '<tr'+newRowClass+'><td class="customSumLeft">'+a+'</td><td class="customSumRight">'+b+'</td></tr>';
		}
		
	}
	
	function nullIfNaN(x){
		log(x);
		log('typeOf: '+typeof x );
		//log('x.indexOf: '+x.indexOf('NaN'));
		
		//if(x.indexOf('NaN') > 0){
		if(typeof x === 'string' && x.indexOf('NaN') > 0){
			return ' ';
		}
		else{
			
			return x;
		}
	}
	
	function replaceFloatIfNaN(x,y){
		z = parseFloat(x);
		if (z*0!=0){
			if(typeof y==='undefined'){
				return '';
			}
			else{
				return y;
			}
		}
		else{
			return z;
		}
	}
	
	
	
	var tempObj;
	
	awrRpt.blockSize=$("td:contains('Std Block Size:')").first().next('td').text();
	awrRpt.blockSizeKb=parseInt(awrRpt.blockSize.replace(/\k/g,''));
	
	tempObj = $("td:contains('Logical read (blocks):')").first().next('td');
	awrRpt.logicalBlockReadsSec=parseFloat($(tempObj).text().replace(/\,/g,''));
	addSmartNumberToCell($(tempObj),'gets');
	addSmartNumberToCell($(tempObj).next('td'),'gets');
	
	awrRpt.logicalReadsXBSec=bytePrettyPrint(awrRpt.logicalBlockReadsSec*awrRpt.blockSizeKb*1024);
	
	awrRpt.physicalReadsXBSec=bytePrettyPrint($("td:first-child:contains('physical read total bytes')").first().next('td').next('td').text());
	awrRpt.physicalWritesXBSec=bytePrettyPrint($("td:first-child:contains('physical write total bytes')").first().next('td').next('td').text());
	
	var instanceActivitySectionObj = new Object;
	getSectionByName('Other Instance Activity Stats',instanceActivitySectionObj); 
	
	awrRpt.physicalReadTotReqSec=$(instanceActivitySectionObj.table).find("td:first-child:contains('physical read total IO requests')").first().next('td').next('td').text();
	awrRpt.physicalWriteTotReqSec=$(instanceActivitySectionObj.table).find("td:first-child:contains('physical write total IO requests')").first().next('td').next('td').text();

	var totalIOPs = (cleanNumber(awrRpt.physicalReadTotReqSec) + cleanNumber(awrRpt.physicalWriteTotReqSec)).toFixed(1);
	awrRpt.totalIOPs = addCommas(totalIOPs);
	
	
	

	
	time('getsnapinfo2');
	var overviewTableSnapshots = $("table:lt(20)").find("td:first-child:contains('DB Time:')").first().closest('table');
	awrRpt.ElapsedMin=parseFloat($(overviewTableSnapshots).find("td:first-child:contains('Elapsed:')").first().next('td').next('td').text().replace(/\(mins\)/g,'').replace(/\,/g,''));
	awrRpt.DbTimeMin=parseFloat($(overviewTableSnapshots).find("td:first-child:contains('DB Time:')").first().next('td').next('td').text().replace(/\(mins\)/g,'').replace(/\,/g,''));
	awrRpt.snapBegin=parseFloat($(overviewTableSnapshots).find("td:first-child:contains('Begin Snap:')").first().next('td').text());
	awrRpt.snapEnd=parseFloat($(overviewTableSnapshots).find("td:first-child:contains('End Snap:')").first().next('td').text());
	timeEnd('getsnapinfo2');
	
	awrRpt.DbTimePerSec=(awrRpt.DbTimeMin/awrRpt.ElapsedMin).toFixed(1);
	
	if(awrRpt.racDB==='YES'){awrRpt.racNumInstances=$("td:contains('Number of Instances:')").first().next('td').text();}
	
	
	tempObj=$("td:contains('Redo size (bytes):')").first().next('td');
	var redoSize = $(tempObj).text().replace(/\,/g,'');
	awrRpt.redoReadsXBSec=bytePrettyPrint(redoSize);
	addSmartNumberToCell($(tempObj),'bytes');
	addSmartNumberToCell($(tempObj).next('td'),'bytes');
	
	tempObj=$("td:contains('Physical read (blocks):')").first().next('td');
	addSmartNumberToCell($(tempObj),'gets');
	addSmartNumberToCell($(tempObj).next('td'),'gets');
	
	tempObj=$("td:contains('Physical write (blocks):')").first().next('td');
	addSmartNumberToCell($(tempObj),'gets');
	addSmartNumberToCell($(tempObj).next('td'),'gets');
	
	var osSectionObj = new Object;
	getSectionByName('Operating System Statistics',osSectionObj);
	
	var overviewTableOsDetails = osSectionObj.table;
	awrRpt.OSnumCPUs=replaceFloatIfNaN($(overviewTableOsDetails).find("td:first-child:contains('NUM_CPUS')").first().next('td').text(),'?');
	awrRpt.OSnumCPUcores=replaceFloatIfNaN($(overviewTableOsDetails).find("td:first-child:contains('NUM_CPU_CORES')").first().next('td').text(),'?');
	awrRpt.OSnumCPUsockets=replaceFloatIfNaN($(overviewTableOsDetails).find("td:first-child:contains('NUM_CPU_SOCKETS')").first().next('td').text(),'?');
	awrRpt.OSmemory=bytePrettyPrint($(overviewTableOsDetails).find("td:first-child:contains('PHYSICAL_MEMORY_BYTES')").first().next('td').text());
	var cpuBusyTime=parseInt($(overviewTableOsDetails).find("td:first-child:contains('BUSY_TIME')").first().next('td').text().replace(/\,/g,''));
	var cpuIdleTime=parseInt($(overviewTableOsDetails).find("td:first-child:contains('IDLE_TIME')").first().next('td').text().replace(/\,/g,''));
	awrRpt.OScpuBusyPct=((cpuBusyTime/(cpuBusyTime+cpuIdleTime))*100).toFixed(1);
	
	awrRpt.DbTimePerSecPerCPU = (parseFloat(awrRpt.DbTimePerSec) / awrRpt.OSnumCPUs).toFixed(1);	
	awrRpt.DbTimePerSecPerCore = (parseFloat(awrRpt.DbTimePerSec) / awrRpt.OSnumCPUcores).toFixed(1);	
	
	
	$('#customSummary').remove();
	$('#initialFormatMenu').after('<div id="customSummary"></div>');
	$('#jquitoptabs').remove();
	$('#customSummary').append('<div id="jquitoptabs"><ul></ul></div>');
	$('#jquitoptabs').append('<div id="customSummaryDiv"></div>');
	
	 
	$('#customSummaryDiv').append('<table id="customSummaryTab" class="custom-summary-tab" cellpadding="0" cellspacing="0">');
	
	
	var summaryDbInfo = "";
	summaryDbInfo += genSumRow('DB Name',awrRpt.dbName);
	summaryDbInfo += genSumRow('DB ID',awrRpt.dbId);
	summaryDbInfo += genSumRow('Host Name',awrRpt.dbHostName);
	summaryDbInfo += genSumRow('Version',awrRpt.dbVersion);
	summaryDbInfo += genSumRow('RAC',awrRpt.racDB);
	if(awrRpt.racDB==='YES'){
		summaryDbInfo += genSumRow('RAC Instance x of y',awrRpt.racInstanceNum+' of '+awrRpt.racNumInstances);
	}
	summaryDbInfo += genSumRow('RAC-Report',awrRpt.racReport);
	summaryDbInfo += genSumRow('Exadata',awrRpt.isExadata);
	summaryDbInfo += genSumRow('Report Period (minutes)',awrRpt.ElapsedMin,'need-smart-number');
	summaryDbInfo += genSumRow('DB Time (minutes)',awrRpt.DbTimeMin,'need-smart-number');
	summaryDbInfo += genSumRow('DB Time per Second',awrRpt.DbTimePerSec);
	summaryDbInfo += genSumRow('DB Time per Second per CPU',awrRpt.DbTimePerSecPerCPU);
	summaryDbInfo += genSumRow('DB Time per Second per Core',awrRpt.DbTimePerSecPerCore);
	summaryDbInfo += genSumRow('<br />','<br />');

		
	var initSectionObj = new Object;
	getSectionByName('init.ora Parameters',initSectionObj);
	
	awrRpt.sga_target = bytePrettyPrint($(initSectionObj.table).find('tr td:first-child:contains("sga_target")').next('td').text().trim());
	awrRpt.sga_max_size = bytePrettyPrint($(initSectionObj.table).find('tr td:first-child:contains("sga_max_size")').next('td').text().trim());
	awrRpt.pga_aggregate_target = bytePrettyPrint($(initSectionObj.table).find('tr td:first-child:contains("pga_aggregate_target")').next('td').text().trim());
	
	var summaryMemInfo = "";
	summaryMemInfo += genSumRow('sga_target',awrRpt.sga_target);
	summaryMemInfo += genSumRow('sga_max_size',awrRpt.sga_max_size);
	summaryMemInfo += genSumRow('pga_aggregate_target',awrRpt.pga_aggregate_target);
	summaryMemInfo += genSumRow('<br />','<br />');
	
	/*$('#customSummaryTab').append(genSumRow('sga_target',awrRpt.sga_target));
	$('#customSummaryTab').append(genSumRow('sga_max_size',awrRpt.sga_max_size));
	$('#customSummaryTab').append(genSumRow('pga_aggregate_target',awrRpt.pga_aggregate_target));
	$('#customSummaryTab').append(genSumRow('<br />','<br />'));*/
	
	var summaryOsInfo = "";
	if(awrRpt.platform.length > 0){
		summaryOsInfo += genSumRow('Platform',awrRpt.platform);
	}
	summaryOsInfo += genSumRow('OS Sockets / Cores / CPUs',awrRpt.OSnumCPUsockets+' / '+awrRpt.OSnumCPUcores+' / '+awrRpt.OSnumCPUs);
	summaryOsInfo += genSumRow('OS Memory',awrRpt.OSmemory);
	summaryOsInfo += genSumRow('OS CPU Percent Busy',awrRpt.OScpuBusyPct);
	summaryOsInfo += genSumRow('<br />','<br />');
	
	/*if(awrRpt.platform.length > 0){
		$('#customSummaryTab').append(genSumRow('Platform',awrRpt.platform));
	}
	$('#customSummaryTab').append(genSumRow('OS Sockets / Cores / CPUs',awrRpt.OSnumCPUsockets+' / '+awrRpt.OSnumCPUcores+' / '+awrRpt.OSnumCPUs));
	$('#customSummaryTab').append(genSumRow('OS Memory',awrRpt.OSmemory));
	$('#customSummaryTab').append(genSumRow('OS CPU Percent Busy',awrRpt.OScpuBusyPct));
	$('#customSummaryTab').append(genSumRow('<br />','<br />')); */
	
	var summaryIoInfo = "";
	summaryIoInfo +=
	summaryIoInfo += genSumRow('Redo Size/sec',awrRpt.redoReadsXBSec);
	summaryIoInfo += genSumRow('Logical Reads/sec',awrRpt.logicalReadsXBSec);
	summaryIoInfo += genSumRow('Physical Reads Total/sec',awrRpt.physicalReadsXBSec);
	summaryIoInfo += genSumRow('Physical Writes Total/sec',awrRpt.physicalWritesXBSec);
	summaryIoInfo += genSumRow('Approximate Read IOPs',awrRpt.physicalReadTotReqSec);
	summaryIoInfo += genSumRow('Approximate Write IOPs',awrRpt.physicalWriteTotReqSec);
	summaryIoInfo += genSumRow('Approximate Total IOPs',awrRpt.totalIOPs);	
	
	/*$('#customSummaryTab').append(genSumRow('Redo Size/sec',awrRpt.redoReadsXBSec));
	$('#customSummaryTab').append(genSumRow('Logical Reads/sec',awrRpt.logicalReadsXBSec));
	$('#customSummaryTab').append(genSumRow('Physical Reads Total/sec',awrRpt.physicalReadsXBSec));
	$('#customSummaryTab').append(genSumRow('Physical Writes Total/sec',awrRpt.physicalWritesXBSec));
	$('#customSummaryTab').append(genSumRow('Approximate Read IOPs',awrRpt.physicalReadTotReqSec));
	$('#customSummaryTab').append(genSumRow('Approximate Write IOPs',awrRpt.physicalWriteTotReqSec));
	$('#customSummaryTab').append(genSumRow('Approximate Total IOPs',awrRpt.totalIOPs));	*/
	
	
	$('#customSummaryTab').append(summaryDbInfo + summaryMemInfo + summaryOsInfo +summaryIoInfo + '</table>');
	//addSmartNumberToCell($('#customSummaryTab').find('tr.need-smart-number td:nth-child(2)'),'minutes');
	$('#customSummaryTab').find('tr.need-smart-number').each(function(){
		addSmartNumberToCell($(this).find('td:nth-child(2)'),'minutes');
	});
	
	addCsvOptionToTable($('#customSummaryTab'));
	
	
	$('body').prepend('<a name="custom-top" />');
	$('a[href="#top"]').append('<br /><a class="awr" href="#custom-top">Back to Custom Top</a>');
	
	// add popup container for statistic definitions
	$("body").append('<div id="statdesc" title="Statistic Definition" style="display:none"></div>');
	$("#statdesc").dialog({
           autoOpen: false,
           modal: true,
           height: 200,
           width: 900
    });
	
	// add popup container used for displaying SQL Text
	$("body").append('<div id="sqlTextPopup" title="SQL Text" style="display:none"></div>');
	$("#sqlTextPopup").dialog({
           autoOpen: false,
           modal: true,
           height: 500,
           width: 900
    });
	
	
	
	
	
}


function addJquiTopTabsObjects(){

	$('#jquitoptabs ul').append('<li><a href="#customSummaryDiv">Overview</a></li>');
	if(localStorageGetItem('reportCombineTopSql') === 'yes'){
		$('#jquitoptabs ul').append('<li><a href="#sqlStatsCombinedDiv">Top SQL Combined</a></li>');
	}
	$('#jquitoptabs ul').append('<li><a href="#topEvents">Top Events</a></li>');
	if(awrRpt.isExadata==='YES'){$('#jquitoptabs ul').append('<li><a href="#instanceActivityStatsExa">Exadata Stats</a></li>');}
	
	$('#jquitoptabs ul').append('<li><a href="#memorySummary">Memory</a></li>');
	$('#jquitoptabs ul').append('<li><a href="#ioGraph">I/O Graphs</a></li>');
	
	if(localStorageGetItem('reportCombineTopSql') === 'yes'){
		$('#sqlStatsCombinedDiv').remove().appendTo('#jquitoptabs');
	}
	
	$('#jquitoptabs').append('<div id="topEvents"></div>');
	getTopStats11g1node();

	$('#jquitoptabs').append('<div id="memorySummary"></div>');
	getMemoryInfo();
	
	$('#jquitoptabs').append('<div id="ioGraph"><div id="ioGraph1" style="width:700px;height:300px"></div>'+
	'<div id="ioGraph2" style="width:700px;height:300px"></div></div>');
}


function generateIoGraphs(){
	var temp='';
	function genSumRow(a,b){
		var x;
		//if(!isNaN(x) && isFinite(x) ){
		if(parseFloat(b)==b){
			x = b.toFixed(1);
		}else{
			x = b;
		}
	
	
		return '<tr><td class="customSumLeft">'+a+'</td><td class="customSumRight">'+x+'</td></tr>';
	}
	
	getSectionByName('Tablespace IO Stats',sectionTblspaceIoObj);
	var headerCells=new Object;
	getHeaderCells(sectionTblspaceIoObj.table,headerCells);

	// get all of the av rd(ms) times into an array. each row will have the counter and the value: [counter,value]
	var tblspaceIoAvgReadMsArr = [];
	var tblspaceIoStatArr = [];
	var tblspaceIoAvgReadsPerSec = [];
	var tblspaceIoAvgWritesPerSec = [];
	var counter = 1;
	$(sectionTblspaceIoObj.table).find('tbody tr').each(function(){
		var avgReadMs = cleanNumber($(getCellByHeaderName($(this),headerCells,'Av Rd(ms)')).text());
		
		var avgReadsPerSec = cleanNumber($(getCellByHeaderName($(this),headerCells,'Av Reads/s')).text());
		var avgWritesPerSec = cleanNumber($(getCellByHeaderName($(this),headerCells,'Av Writes/s')).text());
		if(parseInt(avgReadsPerSec) >= 1){
			tblspaceIoAvgReadMsArr.push([counter,avgReadMs]);
			tblspaceIoStatArr.push(avgReadMs);
			
			tblspaceIoAvgReadsPerSec.push([counter,avgReadsPerSec]);		
		}
		
		if(parseInt(avgWritesPerSec) >= 1){
				tblspaceIoAvgWritesPerSec.push([counter,avgWritesPerSec]);
		}
		counter++;
	});

	$('#ioGraph').prepend('<h2>'+$(sectionTblspaceIoObj.header).html()+'</h2>'+
	'<table id="tblspacePlot1stats" class="custom-summary-tab" cellpadding="0" cellspacing="0"><thead></thead><tbody></tbody></table>');
	
	$('#tblspacePlot1stats thead').append('<tr><th colspan="2">Avg Read(ms)</th></tr>');
	
	
	
	temp += genSumRow('Min',jStat.min(tblspaceIoStatArr));
	temp += genSumRow('Max',jStat.max(tblspaceIoStatArr));
	temp += genSumRow('Mean',jStat.mean(tblspaceIoStatArr));
	temp += genSumRow('Median',jStat.median(tblspaceIoStatArr));
	temp += genSumRow('Standard Deviation',jStat.stdev(tblspaceIoStatArr));
	temp += genSumRow('Quartiles',jStat.quartiles(tblspaceIoStatArr));
	
	$('#tblspacePlot1stats tbody').append(temp);
		
	
	function showTooltip(x, y, contents) {
        $('<div id="tooltip">' + contents + '</div>').css( {
            position: 'absolute',
            display: 'none',
            top: y + 5,
            left: x + 5,
            border: '1px solid #fdd',
            padding: '2px',
            'background-color': '#fee',
            opacity: 0.80
        }).appendTo("body").fadeIn(200);
    }
	
	
	
	var plot1 = $.plot($("#ioGraph1"),
           [ { data: tblspaceIoAvgReadMsArr, label: 'Average Read Time in Milliseconds'}], {
               series: {
                   points: { show: true }
               },
				grid: { hoverable: true, clickable: true },
				selection: { mode: "x" },
				yaxis: { ticks: 10 }
             });
	
	var previousPoint = null;
    $("#ioGraph1").bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));
 
            if (item) {
                if (previousPoint != item.dataIndex) {
                    previousPoint = item.dataIndex;
                    
                    $("#tooltip").remove();
					
					var tableRowNum = item.datapoint[0];
					
					var tblSpaceName
					$(sectionTblspaceIoObj.table).find('tbody tr:nth-child('+tableRowNum+')').each(function(){
					
						 tblSpaceName= $(this).find('td:first-child').text();
						return true;
					});
					
					
                    var y = item.datapoint[1].toFixed(2);
                    
                    showTooltip(item.pageX, item.pageY,
                                item.series.label + " for " + tblSpaceName + " = " + y);
                }
            }
            else {
                $("#tooltip").remove();
                previousPoint = null;            
            }
    });
 
    $("#ioGraph1").bind("plotclick", function (event, pos, item) {
        if (item) {
            $('#ioStatRowDetails1').empty();
			
			var tableRowNum = item.datapoint[0];
			$('#ioStatRowDetails1').append($(sectionTblspaceIoObj.table).clone());
			$('#ioStatRowDetails1 table').removeClass('tablesorter');
			$('#ioStatRowDetails1 table tbody tr:nth-child('+tableRowNum+')').addClass('save-me');
			$('#ioStatRowDetails1 table tbody tr:not(.save-me)').remove();
			$('#ioStatRowDetails1 table thead tr.filters').remove();
			plot1.unhighlight();
            plot1.highlight(item.series, item.datapoint);
        }
    });
	
	/*
	$("#ioGraph1").bind("plotselected", function (event, ranges) {
        $("#selection").text(ranges.xaxis.from.toFixed(1) + " to " + ranges.xaxis.to.toFixed(1));
 
        //var zoom = $("#zoom").attr("checked");
        //if (zoom)
            plot1 = $.plot($("#ioGraph1"), tblspaceIoAvgReadMsArr,
                          $.extend(true, {}, {
                              xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to }
                          }));
    });
	*/
	
	
	$("#ioGraph1").after('<div id="ioStatRowDetails1"></div>');
	
	// ################################################################################################
	
	var plot2 = $.plot($("#ioGraph2"),
           [ { data: tblspaceIoAvgReadsPerSec, label: 'Average Reads Per Second'},
			 { data: tblspaceIoAvgWritesPerSec, label: 'Average Writes Per Second'}
		   ], {
               series: {
                   points: { show: true }
               },
               grid: { hoverable: true, clickable: true }
               //yaxis: { min: 0, max: 300 }
             });
	
	
	var previousPoint2 = null;
    $("#ioGraph2").bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));
 
            if (item) {
                if (previousPoint2 != item.dataIndex) {
                    previousPoint2 = item.dataIndex;
                    
                    $("#tooltip").remove();
					
					var tableRowNum = item.datapoint[0];
					
					var tblSpaceName
					$(sectionTblspaceIoObj.table).find('tbody tr:nth-child('+tableRowNum+')').each(function(){
					
						 tblSpaceName= $(this).find('td:first-child').text();
						return true;
					});
					
					
                    var y = item.datapoint[1].toFixed(2);
                    
                    showTooltip(item.pageX, item.pageY,
                                item.series.label + " for " + tblSpaceName + " = " + y);
                }
            }
            else {
                $("#tooltip").remove();
                previousPoint2 = null;            
            }
    });
 
    $("#ioGraph2").bind("plotclick", function (event, pos, item) {
        if (item) {
			$('#ioStatRowDetails2').empty();
			
			var tableRowNum = item.datapoint[0];
			$('#ioStatRowDetails2').append($(sectionTblspaceIoObj.table).clone());
			$('#ioStatRowDetails2 table').removeClass('tablesorter');
			$('#ioStatRowDetails2 table tbody tr:nth-child('+tableRowNum+')').addClass('save-me');
			$('#ioStatRowDetails2 table tbody tr:not(.save-me)').remove();
			$('#ioStatRowDetails2 table thead tr.filters').remove();
			plot2.unhighlight();
            plot2.highlight(item.series, item.datapoint);
        }
    });
	
	$("#ioGraph2").after('<div id="ioStatRowDetails2"></div>');
	
		

}



function appendTopStat(titleArray,statColumn,hideBelowPct){
	var sectionObj = new Object;
	getSection(titleArray,sectionObj);
	
	
	if($(sectionObj).length){
		var newDiv = $("#topEvents").append('<div class="topstat-container" title="'+$(sectionObj.header).text().trim()+'"></div>');
		var newTitle = $("#topEvents div:last").append('<div class="topstat-title">'+$(sectionObj.header).text().trim()+'</div>');
		var newTable = $("#topEvents div:last").append($(sectionObj.table).clone().addClass('custom-summary-table'));
		
		//if(typeof statColumn != 'undefined' && statColumn != null){
		if(statColumn > 0){
			time('hideStatsBelowValue-'+titleArray);
			hideStatsBelowValue($(newTable),statColumn,hideBelowPct);
			timeEnd('hideStatsBelowValue-'+titleArray);
		}
	}
}

function getTopStats11g1node(){
	//time('appendTopStat-top5-fg');
	appendTopStat(sectionTitles["Top 5 Timed Foreground Events"]);
	//timeEnd('appendTopStat-top5-fg');
	
	//time('appendTopStat-time-model');
	appendTopStat(sectionTitles["Time Model Statistics"],3,1);
	//timeEnd('appendTopStat-time-model');
	
	//time('appendTopStat-foregroundWaitClass');
	appendTopStat(sectionTitles["Foreground Wait Class"],6,1);
	//timeEnd('appendTopStat-foregroundWaitClass');
	
	//time('appendTopStat-foregroundWaitEvents');
	appendTopStat(sectionTitles["Foreground Wait Events"],7,1);
	//timeEnd('appendTopStat-foregroundWaitEvents');
	
	if(awrRpt.dbVersionMajor >= 11){
		//time('appendTopStat-backgroundWaitEvents');
		appendTopStat(sectionTitles["Background Wait Events"],7,1);
		//timeEnd('appendTopStat-backgroundWaitEvents');
	}
	else{
		appendTopStat(sectionTitles["Background Wait Events"]);
	}
	
}

function hideStatsBelowValue(tableObj,columnNumber,statValue){
	
	var theHeaderCell = $(tableObj).find('tr:first-child').find('th:nth-child('+columnNumber+')');
	$(theHeaderCell).prepend('<a href="#" class="custom-showstats">[show all (&lt; '+statValue+'% hidden)</a>');
	$(theHeaderCell).find('a').data('statValue',statValue).click(function(){clickShowStats($(this));return false;});
	
	
	var hideAboveIndex = 0;
	$(tableObj).find('tbody tr:not(first-child)').each(function(){
		if($(this).find('td').length){
			var theColumn = $(this).find('td:nth-child('+columnNumber+')').text().trim();
			var theStat = parseFloat(theColumn);
			
			if(theStat < statValue || theColumn.length == 0 || theColumn == null){
				// we found the first stat index number to hide. exist and hide all above it -1
				hideAboveIndex = ($(this).index()) - 1;				
				return false;
			}
		}
	});
	
	$(tableObj).find('tbody tr:gt('+hideAboveIndex+')').hide().addClass('custom-showstats-hiderow');
}

function clickShowStats(thisObj){
	var theLink = $(thisObj);
	$(theLink).closest('table').find('tr.custom-showstats-hiderow').show();
	$(theLink).click(function(){clickHideStats($(this)); return false;});
	$(theLink).text('[hide < '+$(theLink).data('statValue')+'%]');
}

function clickHideStats(thisObj){
	var theLink = $(thisObj);
	$(theLink).closest('table').find('tr.custom-showstats-hiderow').hide();
	$(theLink).click(function(){clickShowStats($(this));return false;});
	$(theLink).text('[show all (< '+$(theLink).data('statValue')+'% hidden)%]');
}

function getExaStats(){
	// instance activity stats
	var instanceActivityStatsObj = new Object;
	getSectionByName('Instance Activity Stats',instanceActivityStatsObj);
	
	$('#jquitoptabs').append('<div id="instanceActivityStatsExa"></div>');
	$('#instanceActivityStatsExa').append('<div id="instanceActivityStatsExaHideZero"><a class="customlink">hide zero stats</a> | <a class="customlink-inactive">show all</a></div>');
	$('#instanceActivityStatsExaHideZero a:first').click(function(){
		hideStatsWithValue($('#instanceActivityStatsExaTable'),2,'0');
		$(this).attr('class','customlink-inactive');
		$('#instanceActivityStatsExaHideZero a:nth-child(2)').attr('class','customlink');
	});
	
	$('#instanceActivityStatsExaHideZero a:nth-child(2)').click(function(){
		$('#instanceActivityStatsExaTable tbody tr').show();
		$(this).attr('class','customlink-inactive');
		$('#instanceActivityStatsExaHideZero a:first').attr('class','customlink');
	});
	
	$('#instanceActivityStatsExa').append('<table border="1" id="instanceActivityStatsExaTable"></table>');
	$(instanceActivityStatsObj.table).find('thead').clone().appendTo('#instanceActivityStatsExa table');
	$('#instanceActivityStatsExa table').append('<tbody></tbody>');
	$(instanceActivityStatsObj.table).find('tbody tr td:contains("cell")').parent('tr').clone().appendTo('#instanceActivityStatsExa table tbody');
	$(instanceActivityStatsObj.table).find('tbody tr td:contains("EHCC")').parent('tr').clone().appendTo('#instanceActivityStatsExa table tbody');
	$(instanceActivityStatsObj.table).find('tbody tr td:contains("physical read")').parent('tr').clone().appendTo('#instanceActivityStatsExa table tbody');
	$(instanceActivityStatsObj.table).find('tbody tr td:contains("physical write")').parent('tr').clone().appendTo('#instanceActivityStatsExa table tbody');
	
}


function getMemoryInfo(){

	//function hideExtraneousRows(tableObj,sizeFactorColIndex,estColIndex){
	function hideExtraneousRows(sectionName,sizeFactorColName,estColName){
	
		var sectionObj = new Object;
		getSectionByName(sectionName,sectionObj);
		var tableObj = $(sectionObj.table).clone();
		var headerObj = $(sectionObj.header).clone();
			
		var headerCells=new Object;
		getHeaderCells(tableObj,headerCells);
		
		var sizeFactorColIndex=headerCells[sizeFactorColName]+1;
		var estColIndex=headerCells[estColName]+1;

		$(tableObj).find('td').removeClass('awrc').addClass('awrnc');
		var dummyRow = $(tableObj).find('tbody tr:first-child;').clone();
		$(dummyRow).find('td').empty().append('...');
		
		var lastRowHidden = false;
		var lastRowPhysReadFactor = '0';
		var sizeFactor1Shown = false;
		var observationAdded = false;
		
		$(tableObj).find('tbody tr').each(function(){
			var hideIt=true;
			var thisRow = $(this);
			// first row
			if($(this).index() === 0){hideIt=false;}
			// size factor 1
			if(hideIt){
				var theText=$(this).find('td:eq(' + (sizeFactorColIndex) + ')').text().trim();
				if(theText === '1.00'){
					hideIt=false;
					$(this).find('td').addClass('awrc').removeClass('awrnc');
					$(this).addClass('size-factor-1');
					sizeFactor1Shown = true;
					
				}
			}
			
			if(lastRowPhysReadFactor !== $(this).find('td:eq(' + (estColIndex) + ')').text().trim()){
				hideIt=false;
			}
			
			lastRowPhysReadFactor = $(this).find('td:eq('+estColIndex+')').text().trim();
			
			if(hideIt){
				if(!lastRowHidden){
					$(this).after($(dummyRow).clone());
				}
						
				$(this).addClass('hide-me');
				$(this).hide();
				
				
				lastRowHidden = true;		
			}
			else{
				lastRowHidden = false;
				if(parseFloat($(this).find('td:eq('+sizeFactorColIndex+')').text().trim()) > 1.0){
					$(this).closest('table').find('tr.size-factor-1').addClass('size-factor-worse');
					var observationText = 'The <span class="observation-object">'+sectionName+'</span> section indicates that there may be a benefit in adjusting the allocation of this memory component';
					
					var baseObject;
					$(this).closest('table').find('tr.size-factor-1').find('td').each(function(){
						$(this).tipsy({html: true,opacity: 0.9, delayIn: 400,gravity: 'n',title: function() {return observationText;}});
						if($(this).index() === 0){
							$(this).find('td:first-child').addClass('observation');
						}
						
						
						baseObject = $(sectionObj.table).find('tr td:nth-child('+sizeFactorColIndex+'):contains("1.00")');
					});
					
					if(!observationAdded){
						awrRptObservations.push({description:observationText,linkName: $(sectionObj.header).data('anchorElement').attr('name'),obj:baseObject});
						observationAdded = true;
					}
					
				}
			}
		});
		
		$('#memorySummary').append(headerObj);
				$('#memorySummary').append(getJumpLinkFromSection(sectionObj));
		$('#memorySummary').append(tableObj).append('<br />');
			
	}



	hideExtraneousRows('Buffer Pool Advisory','Size Factor','Est Phys Read Factor');
	hideExtraneousRows('PGA Memory Advisory','Size Factr','Estd PGA Cache Hit %');
	hideExtraneousRows('Shared Pool Advisory','SP Size Factr','Est LC Load Time (s)');
	hideExtraneousRows('SGA Target Advisory','SGA Size Factor','Est Physical Reads');
	
}


function hideStatsWithValue(tableObj,columnNumber,statValue){
	$(tableObj).find('tbody tr').each(function(){
		if($(this).find('td:nth-child('+columnNumber+')').text() === statValue){
			$(this).hide();
		}
	});
}


var sqlTextArray=new Object;
var sqlByReadsArray=new Object;
var sqlByGetsArray=new Object;
var sqlByElapsedArray=new Object;
var sqlByExecArray=new Object;
var sqlStatsCombined=new Object;

function getHeaderCells(tableObj,cellObj){
    $(tableObj).find('th').each(function(){
        var x=$.trim($(this).text());
        x=x.replace(/ +/g,' ');

        cellObj[x]=$(this).index();
    });
}




function captureSQlByGets(){
	var sqlGetsTab = $('h3:contains("SQL ordered by Gets")').nextAll("table").eq(0);
	var headerCells=new Object;
	getHeaderCells(sqlGetsTab,headerCells);
	
	var counter=0;
	$(sqlGetsTab).find('tr').each(function(){
		var sqlId=$(this).find('td:eq('+headerCells["SQL Id"]+')').text();

		if(sqlId){
			counter++;
			sqlByGetsArray[sqlId]={'BufferGets':getCellByHeader($(this),headerCells["Buffer Gets"]),
								 'Executions':getCellByHeader($(this),headerCells["Executions"]),
								 'ElapsedTime':getCellByHeader($(this),headerCells["Elapsed Time (s)"]),
								 'GetsPerExec':getCellByHeader($(this),headerCells["Gets per Exec"]),
								 'PctTotalGets':getCellByHeader($(this),headerCells["%Total"]),
								 'SqlText':getCellByHeader($(this),headerCells["SQL Text"]),
								 'Module':getCellByHeader($(this),headerCells["SQL Module"]),
								 'InSQLbyGets':counter};
		}
	});
}


function captureSQlByReads(){
	var sqlReadsTab = $('h3:contains("SQL ordered by Reads")').nextAll("table").eq(0);
	var headerCells=new Object;
	getHeaderCells(sqlReadsTab ,headerCells);
	
	var counter=0;
	$(sqlReadsTab ).find('tr').each(function(){
		var sqlId=$(this).find('td:eq('+headerCells["SQL Id"]+')').text();
		//Physical Reads	Executions	Reads per Exec 	%Total	Elapsed Time (s)	%CPU	%IO	SQL Id	SQL Module	SQL Text
		if(sqlId){
			counter++;
			sqlByReadsArray[sqlId]={'PhysicalReads':getCellByHeader($(this),headerCells["Physical Reads"]),
								 'Executions':getCellByHeader($(this),headerCells["Executions"]),
								 'ReadsPerExec':getCellByHeader($(this),headerCells["Reads per Exec"]),
								 'PctTotalReads':getCellByHeader($(this),headerCells["%Total"]),
								 'ElapsedTime':getCellByHeader($(this),headerCells["Elapsed Time (s)"]),
								 'PctIO':getCellByHeader($(this),headerCells["%IO"]),
								 'SqlText':getCellByHeader($(this),headerCells["SQL Text"]),
								 'Module':getCellByHeader($(this),headerCells["SQL Module"]),
								 'InSQLbyReads':counter};
		}
	});
}


function captureSQlByElapsed(){
	var sqlElapTab = $('h3:contains("SQL ordered by Elapsed Time")').nextAll("table").eq(0);
	var headerCells=new Object;
	getHeaderCells(sqlElapTab ,headerCells);
	
	var counter=0;
	$(sqlElapTab ).find('tr').each(function(){
		var sqlId=$(this).find('td:eq('+headerCells["SQL Id"]+')').text();
		//Elapsed Time (s)	Executions 	Elapsed Time per Exec (s) 	%Total	%CPU	%IO	SQL Id	SQL Module	SQL Text
		if(sqlId){
			counter++;
			sqlByElapsedArray[sqlId]={'ElapsedTime':getCellByHeader($(this),headerCells["Elapsed Time (s)"]),
								 'Executions':getCellByHeader($(this),headerCells["Executions"]),
								 'ElapsedTimePerExec':getCellByHeader($(this),headerCells["Elapsed Time per Exec (s)"]),
								 'PctTotalElapsed':getCellByHeader($(this),headerCells["%Total"]),
								 'SqlText':getCellByHeader($(this),headerCells["SQL Text"]),
								 'Module':getCellByHeader($(this),headerCells["SQL Module"]),
								 'InSQLbyElapsed':counter};
		}
	});
}

function captureSQlByExecutions(){
	var sqlExecTab = $('h3:contains("SQL ordered by Executions")').nextAll("table").eq(0);
	var headerCells=new Object;
	getHeaderCells(sqlExecTab ,headerCells);
	
	var counter=0;
	$(sqlExecTab ).find('tr').each(function(){
		
		var sqlId=$(this).find('td:eq('+headerCells["SQL Id"]+')').text();
		//Executions 	Rows Processed	Rows per Exec	Elapsed Time (s)	%CPU	%IO	SQL Id	SQL Module	SQL Text
		if(sqlId){
			counter++;
			sqlByExecArray[sqlId]={'ElapsedTime':getCellByHeader($(this),headerCells["Elapsed Time (s)"]),
								 'Executions':getCellByHeader($(this),headerCells["Executions"]),
								 'RowsProcessed':getCellByHeader($(this),headerCells["Rows Processed"]),
								 'RowsPerExec':getCellByHeader($(this),headerCells["Rows per Exec"]),
								 'PctTotalElapsed':getCellByHeader($(this),headerCells["%Total"]),
								 'SqlText':getCellByHeader($(this),headerCells["SQL Text"]),
								 'Module':getCellByHeader($(this),headerCells["SQL Module"]),
								 'InSQLbyExecutions':counter};
		}
	});
}










function consolidateSqlStats(){
	captureSQlByGets();
	captureSQlByReads();
	captureSQlByElapsed();
	captureSQlByExecutions();

	sqlStatsCombined = $.extend(true,{},sqlByGetsArray,sqlByElapsedArray,sqlByReadsArray,sqlByExecArray);
}


function intersectArrays(array1,array2){
	var array1_count = 0;
	for (a in array1) { array1_count++; }
	var array2_count = 0;
	for (a in array2) { array2_count++; }

	var theMin = Math.min(array1_count,array2_count);
	var theCount = 0;
	
	for (var i in array1) {
		if(i in array2){
			theCount++;
		}
	}
	
	return ((theCount/theMin)*100).toFixed(1);
	
}



var sqlCrosstabTable = '';

function consolidateSqlIntersectGrid(){
	var sqlGrid_ElapsedInGets = intersectArrays(sqlByElapsedArray,sqlByGetsArray);
	var sqlGrid_ElapsedInReads = intersectArrays(sqlByElapsedArray,sqlByReadsArray);
	var sqlGrid_ElapsedInExecs = intersectArrays(sqlByElapsedArray,sqlByExecArray);
	
	var sqlGrid_ReadsInGets = intersectArrays(sqlByReadsArray,sqlByGetsArray);
	var sqlGrid_ReadsInExecs = intersectArrays(sqlByReadsArray,sqlByExecArray);
	
	var sqlGrid_GetsInExecs = intersectArrays(sqlByGetsArray,sqlByExecArray);
	//var sqlGrid_ReadsInExecs = intersectArrays(sqlByReadsArray,sqlByExecArray);
	
	/*
				Elapsed	Reads	Gets	Executions
	Elapsed
	Reads
	Gets
	Executions
	*/

	sqlCrosstabTable  = '<div id="sqlCrosstabTableContainer"><div id="sqlCrosstabTableTitle">Percent Intersection of SQL Stats</div>';
	sqlCrosstabTable += '<table id="sqlCrosstabTable" cellspacing="0" cellpadding="0"><thead><tr>';
	sqlCrosstabTable += '<th class="blank"><br /></th><th>Reads</th><th>Gets</th><th>Executions</th></tr></thead><tbody>';
	
	sqlCrosstabTable += '<tr><td class="row-title">Elapsed</td><td>'+sqlGrid_ElapsedInReads+'</td><td>'+sqlGrid_ElapsedInGets+'</td><td>'+sqlGrid_ElapsedInExecs+'</td></tr>';
	sqlCrosstabTable += '<tr><td class="row-title">Reads</td><td><br /></td><td>'+sqlGrid_ReadsInGets+'</td><td>'+sqlGrid_ReadsInExecs+'</td></tr>';
	sqlCrosstabTable += '<tr><td class="row-title">Gets</td><td><br /></td><td><br /></td><td>'+sqlGrid_GetsInExecs+'</td></tr>';
	
	sqlCrosstabTable += '</tbody></table></div>';
	
	
}






function generateSQLsummaryTable(){
	function determineSizeUnit(column,returnObj){
		var rowCounter=0;
		var rowSum=0;
		for (var i in sqlStatsCombined) {
			var rowVal = eval('sqlStatsCombined[i].'+column);
			if(typeof rowVal !== 'undefined'){
				rowVal=rowVal.replace(/\,/g,'');
				rowVal = parseFloat(rowVal);
			}
			if(!isNaN(rowVal)){
				rowCounter++;
				rowSum+=rowVal;
			}
			
		}
		
		var rowAvg = (convertGetsToBytes(rowSum)/rowCounter);
		
		if(rowAvg>1073741824){
			//return (y/1024/1024/1024).toFixed(1)+' GB';
			returnObj.unit = 'GB';
			returnObj.divisor = 1073741824;
			return true;
		}
		else if(rowAvg>1048576){			
			//return (y/1024/1024).toFixed(1)+' MB';
			returnObj.unit = 'MB';
			returnObj.divisor = 1048576;
			return true;
		}
		else{
			returnObj.unit = 'KB';
			returnObj.divisor = 1024;
			return true;
		}
		
	}
	
	var physicalReadsUnitObj = new Object;
	determineSizeUnit('PhysicalReads',physicalReadsUnitObj);
	
	var logicalReadsUnitObj = new Object;
	determineSizeUnit('BufferGets',logicalReadsUnitObj);


	var headerRow='';
	$('#sqlStatsCombinedDiv').remove();
	$('#customSummary').append('<div id="sqlStatsCombinedDiv"></div>');
	$('#sqlStatsCombinedDiv').append('<table id="sqlStatsCombined" class="" cellpadding="0" cellspacing="0"></table>');
	headerRow += '<th>SQL ID</th>';
	
	headerRow += '<th>SQL by Elapsed</th>';
	headerRow += '<th>SQL by Reads</th>';
	headerRow += '<th>SQL by Gets</th>';
	headerRow += '<th>SQL by Executions</th>';
	
	headerRow += '<th>Elapsed Time (s)</th>';
	headerRow += '<th>Elapsed Per Exec</th>';
	headerRow += '<th>Executions</th>';
	headerRow += '<th>Phyical Reads ('+physicalReadsUnitObj.unit+')</th>';
	headerRow += '<th>Buffer Gets ('+logicalReadsUnitObj.unit+')</th>';
	
	headerRow += '<th>% Total Elapsed</th>';
	headerRow += '<th>% Total Reads</th>';
	headerRow += '<th>% Total Gets</th>';
	
	headerRow += '<th>Module</th>';
	headerRow += '<th>SQL Text</th>';
	
	
	
	$('#sqlStatsCombined').append('<thead><tr>'+headerRow+'</tr></thead><tbody></tbody>');

	function formatSqlCell(data,cssClass,title){
		
		if(data){
			var theClass='';
			var theTitle='';
			if(cssClass){
				theClass=' class="'+cssClass+'"';
			}
			if(title){
				theTitle=' title="'+title+'" ';
			}
			return '<td'+theClass+theTitle+'>'+data+'</td>';
		}
		else{
			return '<td> </td>';
		}
	}

	
	
	for (var i in sqlStatsCombined) {
		var row='<tr>'+formatSqlCell(i,'sqlid sqlidlink');
		
		row += formatSqlCell(sqlStatsCombined[i].InSQLbyElapsed,'sqlcenter');
		row += formatSqlCell(sqlStatsCombined[i].InSQLbyReads,'sqlcenter');
		row += formatSqlCell(sqlStatsCombined[i].InSQLbyGets,'sqlcenter');
		row += formatSqlCell(sqlStatsCombined[i].InSQLbyExecutions,'sqlcenter');
		
		row += formatSqlCell(sqlStatsCombined[i].ElapsedTime);
		row += formatSqlCell(sqlStatsCombined[i].ElapsedTimePerExec);
		row += formatSqlCell(sqlStatsCombined[i].Executions);
		
		
		
		//Physical Reads
		if(typeof sqlStatsCombined[i].PhysicalReads !== 'undefined'){
			var physicalReadBytes = convertGetsToBytes(sqlStatsCombined[i].PhysicalReads);
			var physicalReadsConverted = (physicalReadBytes/physicalReadsUnitObj.divisor).toFixed(1);			
			row += formatSqlCell(physicalReadsConverted,null,'reads: '+sqlStatsCombined[i].PhysicalReads);
		}
		else{
			row +=formatSqlCell(null,null);
		}
		
		// Buffer Gets
		if(typeof sqlStatsCombined[i].BufferGets !== 'undefined'){
			var logicalReadBytes = convertGetsToBytes(sqlStatsCombined[i].BufferGets);
			var logicalReadsConverted = (logicalReadBytes/logicalReadsUnitObj.divisor).toFixed(1);			
			row += formatSqlCell(logicalReadsConverted,null,'gets: '+sqlStatsCombined[i].BufferGets);
		}
		else{
			row +=formatSqlCell(null,null);
		}
		
		row += formatSqlCell(sqlStatsCombined[i].PctTotalElapsed);
		row += formatSqlCell(sqlStatsCombined[i].PctTotalReads);
		row += formatSqlCell(sqlStatsCombined[i].PctTotalGets);
		
		
		var moduleText = sqlStatsCombined[i].Module;
		var moduleTitle = '';
		if(moduleText.length > 15){
			moduleText = moduleText.substr(0,14)+'...'
			moduleTitle = ' title="'+sqlStatsCombined[i].Module+'"';
		}
		row += formatSqlCell('<div'+moduleTitle+'>'+moduleText+'</div>','tiny');
		
		var sqlText = sqlStatsCombined[i].SqlText;
		if(sqlText.length > 15){
			sqlText = sqlText.substr(0,14)+'...'
		}
		
		var sqlTextLink='<div>'+sqlText+'</div>';
		//var sqlTextLink='<a onclick="showSqlTextPopup(\''+i+'\');return;">'+sqlStatsCombined[i].SqlText+'</a>';
		//row += formatSqlCell(sqlStatsCombined[i].SqlText,'tiny awrsqltext');
		row += formatSqlCell(sqlTextLink,'tiny awrsqltext');
		
		$('#sqlStatsCombined tbody').append(row);
		 
	}
	
	
	consolidateSqlIntersectGrid();
	
	$('#sqlStatsCombinedDiv').append(sqlCrosstabTable);
	
	//$('#sqlStatsCombined').dataTable({"bJQueryUI": true,"bPaginate": false,"bDestroy": true,"bInfo": false});
}


function linkSqlFullText(){
	$('#sqlStatsCombined tbody tr td.awrsqltext div,#sqlStatsCombined tbody tr td:first-child').each(function (){
		
		var theDiv = $(this);
		var sqlId=$(this).closest('tr').find('td:first-child').text();
		
		$(theDiv).click(function(){
			showSqlTextPopup(sqlId);
		});
	});
}

function addTableFilterPlugin(titleArray){
	var sectionObj = new Object;
	getSection(titleArray,sectionObj);
	var rowCount = $(sectionObj.table).find('tr').length;

	if(rowCount >= 30){
		$(sectionObj.table).tableFilter();
		$(sectionObj.table).addClass("tablesorter");
		$(sectionObj.table).tablesorter(); 
	}
	
	if(rowCount >= 15){
		$(sectionObj.table).addClass("tablesorter");
		$(sectionObj.table).tablesorter(); 
	}
}

function addTablePlugins(tableObj){	
	var rowCount = $(tableObj).find('tr').length;

	if(rowCount >= 30){
		$(tableObj).tableFilter();
		$(tableObj).addClass("tablesorter");
		$(tableObj).tablesorter(); 
	}
}

// used for standard vertical tables with 1 row of headers
function fixTableOne(headingText,newTableId){
	tableObj=$('h3:contains("'+headingText+'")').nextAll("table").eq(0);
	$(tableObj).attr('id',newTableId);
	var headRow = $(tableObj).find('th').parent('tr');
	$(headRow).remove();
	$(tableObj).prepend('<thead></thead>');
	$(tableObj).find('thead').append(headRow);
}



function fixTableIfBroken(theTable){
	//$(':topLevelTextElement:contains("SGA Target Advisory")').each(function(){
		//var theTable = $(this).data('tableElement');
		profile('fixTableIfBroken');
		if(!$(theTable).find('thead').length){
			if($(theTable).find('tbody tr th:first-child').length){
				$(theTable).prepend('<thead></thead>');
				
				// find each row in tbody that has th, rip it out, put it in thead
				$(theTable).find('tbody tr').has('th').each(function(){
					var headRow = $(this);
					$(headRow).remove();
					$(theTable).find('thead').append(headRow);
				});
				
				$(theTable).find('thead tr td').addClass('column-header-blank');
				
				$(theTable).find('thead tr th[colspan]').each(function(){
					var theText = $(this).text();
					var theColspan = $(this).attr('colspan');
					$(this).replaceWith('<td class="header-colspan" colspan="'+theColspan+'">'+theText+'</td>');
				});
			
				
			}
		}
		profileEnd('fixTableIfBroken');
	//});
}
	
	

jQuery.expr[':'].topLevelTextElement = function(element, index) {
	//$('h2:topLevelTextElement').each(function(){console.log($(this).text());});
     // if there is only one child, and it is a text node, and the parent of the element is <body>
     if (element.childNodes.length == 1 && element.firstChild.nodeType == 3) {
		if(element.parentNode.nodeName == 'BODY'){
			return jQuery.trim(element.innerHTML).length > 0;
		}
     }
     return false;
};


function associateHeadersWithTables(){
	profile('associateHeadersWithTables');
	$(':topLevelTextElement').each(function(){
		
		var okToContinue = true;
		if($(this).text().indexOf("No data exists") > 0){
			okToContinue = false;
		}
		
		if(okToContinue){
			var headerElement = $(this);
			var i=0;
			var currentElement = headerElement;
			
			var tableElement;
			var tableFound = false;
			
			var anchorElement;
			var anchorFound = false;
			
			for (i=0;i<=10;i++){
				try {
					currentElement=$(currentElement).nextAll().eq(0);
					
					if (typeof $(currentElement)  == "undefined") {
						break;
					}
					
					if($(currentElement).get(0).nodeName == 'H2' || $(currentElement).get(0).nodeName == 'H3'){
						break;
					}
					
					if($(currentElement).get(0).nodeName == 'TABLE'){
						tableElement = $(currentElement);
						okToContinue = false;
						tableFound = true;
						break;
					}
					
					if($(currentElement).get(0).nodeName == 'P'){
						$(currentElement).find('table').each(function(){
							tableElement = $(this);
							okToContinue = false;
							tableFound = true;
							return true;
						});
					}
					
					if (!okToContinue){
						break;
					}
				}
				catch (e) {
					break;
				}
			}
			
			$(headerElement).prevAll("p").eq(0).each(function(){
				if ($(this).has('a')){
					anchorElement = $(this).find('a').eq(0);
					anchorFound = true;
					return true;
				}
			
			});
			
			if(tableFound){
				headerId = convertHeaderNameToId($(headerElement).text());
				tableId = headerId+'-table';
				
				$(headerElement).data('tableElement',$(tableElement)).addClass('custom-awr-header').attr('id',headerId);
				$(tableElement).data('headerElement',headerElement).attr('border','0').addClass('custom-awr-table').attr('id',tableId);
				
				
				if(anchorFound){$(headerElement).data('anchorElement',$(anchorElement));}
				
				
				//time('fixTableIfBroken');
				fixTableIfBroken($(tableElement));
				//timeEnd('fixTableIfBroken');
				addCsvOptionToTable($(tableElement));
				
			}
		} // okToContinue
	});
	
	// add class to non-tagged-tables
	
	//time('add-custom-awr-table');
	$('table:not(.custom-awr-table)').addClass('custom-awr-table-non-tagged');
	//timeEnd('add-custom-awr-table');
	profileEnd('associateHeadersWithTables');
}



function showConvertNumberPopup(cellObj){
	cellText = $(cellObj).text();
	var colNum = $(cellObj).prevAll().length;
	var headerObj = $(cellObj).parents('table').find('th').eq(colNum);
	var rowHeader = $(cellObj).parent('tr').find('td:first-child');
	
	
	$("#statdesc").dialog('option', 'title', 'Convert Number');
	$("#statdesc").empty().append('<table class="number-convert-table" cellspacing="" cellpadding="0"><thead><tr><th><br /></th><th>'+$(headerObj).text()+'</th></tr></thead>'+
								  '<tbody><tr><td>'+$(rowHeader).text()+'</td><td>'+cellText+'</td></tr></tbody></table><br />'+
	
									'The number '+cellText+' is in: <br />'+
									'<a href="#" class="convert-number-link">Reads / Gets</a> '+
									'<a href="#" class="convert-number-link">Bytes</a> '+
									'<a href="#" class="convert-number-link">Seconds</a> '
								  );
	$("#statdesc").find('a.convert-number-link').click(function(){
		convertNumberTo($(this));
		return false;
	});	
	
	$("#statdesc").append('<div id="numberConvertsionContainer"></div>');
	$("#statdesc").dialog("open");
}

function addToolTipTopSQL(){
	$('.custom-awr-header:contains("SQL ordered by")').each(function(){
		var headerObj = $(this);
		var tableObj = $(this).data('tableElement');
		
		$(this).data('tableElement');
		var sqlIdCol=0;
		
		$(tableObj).find('th').each(function(){
			var headText = $(this).text();
			var colNum = $(this).prevAll().length+1;
			
			if(headText.indexOf('(s)') >=0){
				$(tableObj).find('tr').each(function(){
					$(this).find('td:nth-child('+colNum+')').each(function(){
						addSmartNumberToCell($(this),'seconds');
					});
				});
			}
			
			if(headText.toLowerCase().indexOf('reads') >=0 || headText.toLowerCase().indexOf('gets') >=0 ){
				$(tableObj).find('tr').each(function(){
					$(this).find('td:nth-child('+colNum+')').each(function(){
						addSmartNumberToCell($(this),'gets');
					});
				});
			}
			
			
			if(headText.toLowerCase().indexOf('sql id') >=0){
				sqlIdCol=colNum;
			}
			
			
			if(headText.toLowerCase().indexOf('sql text') >=0){
			
				$(tableObj).find('tr').each(function(){
					$(this).find('td:nth-child('+colNum+')').each(function(){
			
						$(this).wrapInner('<div class="awr-custom-sqltext"></div>');
							$(this).find('div').click(function(){
								var sqlId = $(this).closest('tr').find('td:nth-child('+sqlIdCol+')').text();
								showSqlTextPopup(sqlId);
						});
					});
				});
			}
					
		});
	
	});
	
}


function addToolTipInstanceActivity(){
	
	function addToolTipToRowLocal(cellObj){
		cellText = $(cellObj).text().trim();
		
		if(/ bytes/i.test(cellText)){
			$(cellObj).siblings().each(function(){
				//addSmartNumberToCell($(this),'bytes');
				addSmartNumberToCell($(this),'bytes');
			});
		}
		else if(/reads|gets|blocks/i.test(cellText)){
			$(cellObj).siblings().each(function(){
				//addSmartNumberToCell($(this),'gets');
				addSmartNumberToCell($(this),'gets');
			});
			
		}
	}

	var instanceActivityStatsObj = new Object;
	getSectionByName('Instance Activity Stats',instanceActivityStatsObj);
	$(instanceActivityStatsObj.table).find('tr td:first-child').each(function(){
		addToolTipToRowLocal($(this));
	});
	
	$('#instanceActivityStatsExaTable').find('tr td:first-child').each(function(){
		addToolTipToRowLocal($(this));
	});
	
}


function addTooltipToCellsNeedTooltip(){
	$('.needs-tooltip').each(function(){
		addSmartNumberToCell($(this),$(this).data('units'));
		$(this).removeClass('needs-tooltip');
	});
}


function cycleSmartNumber(cellObj){
	var returnObj = new Object;
	
	originalUnits = $(cellObj).data('original-units');
	originalText = $(cellObj).data('original-text');
	currentUnits = $(cellObj).data('current-units');
	
	// called recursively (kind of) below
	function cycleStorageUnits(){
		var storageUnitArr = ['B','KB','MB','GB','TB'];
		var theBytes='';
		
		// showing orginial text
		if(currentUnits === originalUnits){
			if(/reads|gets|blocks/i.test(originalUnits)){
				theBytes = convertGetsToBytes(originalText);
				convertBytesToUnit(theBytes,'B',returnObj);	
			}
			else{
				theBytes = originalText;
				convertBytesToUnit(theBytes,'KB',returnObj);	
			}
			
		}
		
		// showing TB, cycle to original text
		else if(currentUnits === 'TB'){
			returnObj.formatted = originalText;
			returnObj.newUnits = originalUnits;
			returnObj.number = cleanNumber(originalText);
		}
		else{
			// B,KB,MB,GB
			newArrIndex = storageUnitArr.findIndex(currentUnits)+1;
			theBytes = convertGetsToBytes(originalText);
			convertBytesToUnit(theBytes,storageUnitArr[newArrIndex],returnObj);
		}
		
		
	}
	
	
	if(/seconds|minutes/i.test(originalUnits)){
		if(currentUnits === 'time'){
			$(cellObj).text(originalText);
			$(cellObj).data('current-units',originalUnits);
			$(cellObj).attr('title','original: '+$(cellObj).data('original-text')+', click to cycle through units');
			$(cellObj).closest('tr').find('td:first-child span').removeClass('smart-cell-title-strike-through');
		}else{
			$(cellObj).text(convertTimeUnits(originalText,originalUnits));
			$(cellObj).data('current-units','time');
			$(cellObj).attr('title','units: hh:mm:ss, original: '+$(cellObj).data('original-text')+', click to cycle through units');
			$(cellObj).closest('tr').find('td:first-child span').addClass('smart-cell-title-strike-through');
		}
		
		return true;
	}
	else if(/reads|gets|blocks|bytes/i.test(originalUnits)){
		// loop here
		// i=<6 where 6 is the maximum number of units to cycle through (b>kb>mb>gb>tb>original)
		for (var i=0; i<=6; i++) {
			cycleStorageUnits();
			if(returnObj.number > 0){
				break;
			}
			else{
				currentUnits = returnObj.newUnits;
			}
		} // end loop here
		
		$(cellObj).text(returnObj.formatted);
		$(cellObj).data('current-units',returnObj.newUnits);
		if(returnObj.newUnits === originalUnits){
			$(cellObj).closest('tr').find('td:first-child span').removeClass('smart-cell-title-strike-through');
		}else{
			$(cellObj).closest('tr').find('td:first-child span').addClass('smart-cell-title-strike-through');
		}
		return true;
		
	}

}


function getSmartNumber(cellObj,unitType,returnObj){
	var theNumber = $(cellObj).text().replace(/\,/g,'');

	
	if(/seconds|minutes/i.test(unitType)){
		var theNewNumber = parseFloat(theNumber);
		if(unitType === 'seconds'){theNewNumber = (theNewNumber/60);}
		if(theNewNumber >= 70){
			returnObj.text = convertTimeUnits(theNumber,unitType);
			returnObj.newUnits = 'time';
			$(cellObj).closest('tr').find('td:first-child span').addClass('smart-cell-title-strike-through');
			return true;
		}else{
			returnObj.text = $(cellObj).text();
			returnObj.newUnits = $(cellObj).data('original-units');
			$(cellObj).closest('tr').find('td:first-child span').removeClass('smart-cell-title-strike-through');
			return true;
		}
		
	}
	else if(/gets|reads|blocks|bytes/i.test(unitType)){
		convertStorageUnits(theNumber,unitType,returnObj);
		$(cellObj).closest('tr').find('td:first-child span').addClass('smart-cell-title-strike-through');
	}
	else{
		return $(cellObj).text();
	}
}


function addSmartNumberToCell(cellObj,unitType){
	if(typeof $(cellObj).data('original-units') === 'undefined'){
		$(cellObj).data('original-units',unitType);
		$(cellObj).data('original-text',$(cellObj).text().trim());
		var theTitleCell = $(cellObj).closest('tr').find('td:first-child');

		if($(theTitleCell).find('span').length){
		}
		else{
			var theTitleText = $(theTitleCell).text().replace(/(reads|gets|blocks|bytes|writes)/gi,'<span class="smart-cell-title">$1</span>');
			$(theTitleCell).empty().append(theTitleText);
		}
	}
	else{
	}
	
	var returnObj = new Object;
	getSmartNumber(cellObj,unitType,returnObj);
	$(cellObj).data('current-units',returnObj.newUnits);
	$(cellObj).text(returnObj.text);
	var timeUnits = '';
	if(returnObj.newUnits === 'time'){
		timeUnits = 'units: hh:mm:ss, '
	}
	$(cellObj).attr('title',timeUnits+'original: '+$(cellObj).data('original-text')+', click to cycle through units');
	$(cellObj).addClass('smart-number');
	$(cellObj).click(function(){ cycleSmartNumber(cellObj);});
}

function getOriginalText(cellObj){
	if(typeof $(cellObj).data('original-text') === 'undefined'){
		return $(cellObj).data('original-text');
	}
	else{
		return $(cellObj).text();
	}
}

function getCellContentsToolTip(cellObj,unitType){
	var theNumber = $(cellObj).text().replace(/\,/g,'');

	if(unitType==='seconds'){
		var timeObj = secondsToTime(theNumber);
		return 'Time in h:m:s =  '+
				timeObj.h+':'+timeObj.m+':'+timeObj.s;
	}
	else if(unitType==='minutes'){
		var timeObj = secondsToTime(theNumber*60);
		return 'Time in h:m:s =  '+
				timeObj.h+':'+timeObj.m+':'+timeObj.s;
	}
	else if(unitType==='gets'){
		var theBytes = convertGetsToBytes(theNumber);
		var theSize = bytePrettyPrint(theBytes);
		return 'Size :  '+theSize;
	}
	else if(unitType==='bytes'){
		var theSize = bytePrettyPrint(theNumber);
		return 'Size :  '+theSize;
	}
	else{
		return $(cellObj).text();
	}
}






function checkObservations(){
	function checkReportBasics(){
	
		// report time period
		if(awrRpt.ElapsedMin > 65){
			var elapsedObj = $("td:first-child:contains('Elapsed:')").first().next('td').next('td');
			var observationText = 'Report periods greater than 60 minutes are not reccomended. The longer the report, the more "averages" will mask the details. '+
								  'Often the best strategy is to generate a report for a short period of time, say 15 minutes, during a "busy" period of time';
			awrRptObservations.push({description:observationText,obj:elapsedObj});
			$(elapsedObj).addClass('observation');
		}
	
		
		//soft parse
		var softParseObj = $("table:lt(20) td:contains('Soft Parse %:')").first().next('td');
		
		var softParsePct = parseFloat($(softParseObj).text().trim());
		if(softParsePct < 99){
			var observationTextParse = 'Excessive hard parsing, consider binding';
			awrRptObservations.push({description:observationTextParse,obj:softParseObj});
			$(softParseObj).addClass('observation');		
		}
		
		// db time
		if(awrRpt.DbTimePerSecPerCPU <= 0.2){
			var DbTimePerSecPerCPUObj = $("td:first-child:contains('DB Time per Second per CPU')").first().next('td');
			$(DbTimePerSecPerCPUObj).addClass('observation');
			var observationTextDbTimePerCpu = '<span class="observation-object">DB Time per Second per CPU = '+awrRpt.DbTimePerSecPerCPU+'</span>. '+
											  ' Any number less than 1 indicates less DB Time than available CPU time. This does not appear to be a particularly busy database';
			awrRptObservations.push({description:observationTextDbTimePerCpu,obj: DbTimePerSecPerCPUObj});
		}
		else if(awrRpt.DbTimePerSecPerCPU > 1){
			var DbTimePerSecPerCPUObj = $("td:first-child:contains('DB Time per Second per CPU')").first().next('td');
			$(DbTimePerSecPerCPUObj).addClass('observation');
			var observationTextDbTimePerCpu = '<span class="observation-object">DB Time per Second per CPU = '+awrRpt.DbTimePerSecPerCPU+'</span>. '+
											  'Any number greater than 1 indicates more DB Time than available CPU time.  This potentionally indicates insufficient CPU or a large number of waits on other events such as I/O.';
			awrRptObservations.push({description:observationTextDbTimePerCpu,obj: DbTimePerSecPerCPUObj});
		}
		
		
			
	}


	function checkInitParameters(){
		var initSectionObj = new Object;
		getSectionByName('init.ora Parameters',initSectionObj);
		
		$(initSectionObj.table).find('tr').each(function(){
			var cellText = $(this).find('td:first-child').text().trim();
			if(/^_/.test(cellText)){
				$(this).find('td:first-child').addClass('observation');
				var observationText = 'Hidden or Undocumented parameters ( <span class="observation-object">'+cellText+'</span> ) should only be used when instructed to do so by Oracle Support';
				awrRptObservations.push({description:observationText,linkName: $(initSectionObj.header).data('anchorElement').attr('name'),obj:$(this).find('td:first-child')});
			}
		});
			
	}
	
	function checkSqlHints(){
		var sqlTextSectionObj = new Object;
		getSectionByName('Complete List of SQL Text',sqlTextSectionObj);
		
		$(sqlTextSectionObj.table).find('tr').each(function(){
			var cellText = $(this).find('td:nth-child(2)').text().trim();
			if(/\/\*\+/.test(cellText)){
				if(/dbms_sqltune|obj#|v\$|NO_SQL_TUNE|privilege#|grantee#/gi.test(cellText)){
					// do nothing, this is sys sql
				}
				else{
					var ruleText = cellText.match(/\/\*\+.+?\*\//)[0];
					var sqlId = $(this).find('td:first-child').text().trim();
					$(this).find('td:first-child').addClass('observation');
					var observationText = 'Hints ( <span class="observation-object">'+ruleText+'</span> ) found in SQL ID:  <span class="observation-object observation-sql-id">'+sqlId+'</span>.';
					if(/ rule /.test(ruleText)){
						observationText += ' "rule" hints are not supported in 10g+. ';
					}
					observationText += ' In general, many Oracle experts advise against using hints whenever possible. ';
										
					awrRptObservations.push({description:observationText,linkName: $(sqlTextSectionObj.header).data('anchorElement').attr('name'),obj:$(this).find('td:first-child')});
				}
			}
		});
			
	}
	
	function addObservationIcons(){
		$('td.observation').each(function(){
			$(this).wrapInner('<div class="doclink-wrapper" />');
			$(this).find('div').append('<span class="observation-icon" />');
		});
	}
	
	
	function addObservationIcon(obj,text){
			$(obj).wrapInner('<div class="doclink-wrapper" />');
			$(obj).find('div').append('<span class="observation-icon" />');
			$(obj).find('span.observation-icon').tipsy({html:true,opacity: 0.9, delayIn: 400,gravity: 'nw',title: function() {return text;}});
			$(obj).css('padding-left','20px');
	}
	
	
	
	checkReportBasics();
	checkInitParameters();
	//checkSqlHints();
	//addObservationIcons();

	if(awrRptObservations.length > 0){
		
		$('#jquitoptabs ul').append('<li><a href="#customObservations">Observations ('+awrRptObservations.length+')</a></li>');
		$('#jquitoptabs').append('<div id="customObservations"></div>');
		$('#customObservations').append('<ol></ol>');
		for (var i=0; i<awrRptObservations.length; i++) {
			var jumpLink ="";
			if(typeof awrRptObservations[i].linkName !== 'undefined' && awrRptObservations[i].linkName.length > 0){
				jumpLink	= ' <a href="#'+awrRptObservations[i].linkName+'" class="awr observation-jump-link">Jump to Section</a>';
			}
			$('#customObservations ol').append('<li><div class="observation-text">'+awrRptObservations[i].description+jumpLink+'</div></li>');
			
			if(typeof awrRptObservations[i].obj !== 'undefined'){
				addObservationIcon(awrRptObservations[i].obj,'Observation '+(i+1)+': '+awrRptObservations[i].description);
			}
		}
		
		
		$('span.observation-sql-id').each(function(){
			$(this).click(function(){
				showSqlTextPopup($(this).text().trim());
			});
		});
		
	}
	
}
