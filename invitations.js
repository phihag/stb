
function on_change() {
	console.log('changing');
}

$(function() {
	var currentYear = new Date().getFullYear();
	$('#season_name').val('Saison ' + currentYear + '/' + (currentYear+1));
	on_change();

	$('#dates').on('input', on_change);
	$('#teams').on('input', on_change);
	$('#league_name').on('input', on_change);
	$('#season_name').on('input', on_change);
	$('#abbrev').on('input', on_change);
	$('#stb').on('input', on_change);
});