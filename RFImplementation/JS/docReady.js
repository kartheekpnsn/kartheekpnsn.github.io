$(document).ready(function() {
	$('input[type="submit"]').attr('disabled', 'disabled');
	$("svg").mouseup(function(){
		if(arr.length > 0) {
			$('input[type="submit"]').removeAttr('disabled');
		}
	});
});