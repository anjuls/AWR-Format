var awrRpt=new Object;

if ($("title:contains('AWR')").length){
	if ($('h1:contains("WORKLOAD REPOSITORY")').length){
		
		if ($('h1:contains("WORKLOAD REPOSITORY")').text().indexOf('RAC') > 0){
			awrRpt.racReport='YES';
		}
		else{
			awrRpt.racReport='NO';
		}
	}
		
	
}
else{

}