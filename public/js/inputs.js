function locationField(textField, idField) {
	var locations = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		limit: 4,
		prefetch: {
			url: '/api/json/locations',
		}
	});

	// kicks off the loading/processing of the 'prefetch' list
	locations.initialize();

	$(textField).typeahead({
		hint: true,
		highlight: true,
		minLength: 1
	}, {
		name: 'locations',
		displayKey: 'name',
		// `ttAdapter` wraps the suggestion engine in an adapter that
		// is compatible with the typeahead jQuery plugin
		source: locations.ttAdapter(),
		templates: {
			suggestion: function(suggestion) {
				return '<p>' + suggestion.name + '<br><small>' + suggestion.address + '</small></p>';
			}
		}
	});

	// Set up event handlers to select a location ID & to deselect it
	function select(evt, suggestion) {
		$(textField).addClass('tt-selected');
		$(idField).val(suggestion.id);
	}

	function deselect(evt) {
		$(textField).removeClass('tt-selected');
		$(idField).val('');
	}

	$(textField)
		.on('typeahead:selected', select)
		.on('typeahead:autocompleted', select)
		.on('keydown', function(evt) {
			// Backspace or Delete
			if (evt.charCode == 0 &&
				(evt.keyCode == 8 || evt.keyCode == 46)) deselect(evt);
		})
		.on('keypress', deselect);

	// Work out if we already have an ID provided and update text field accordingly
	if ($(idField).val() > 0) {
		$(textField).addClass('tt-selected');
	}
}

var dtpOptions = {
	stepping: 5,
	minDate: moment().startOf('day'),
	useCurrent: false,
	sideBySide: true,
	keepInvalid: true,
	keyBinds: false,
	icons: {
		time:     'fa fa-clock-o',
		date:     'fa fa-calendar',
		up:       'fa fa-plus',
		down:     'fa fa-minus',
		previous: 'fa fa-chevron-left',
		next:     'fa fa-chevron-right',
		today:    'fa fa-crosshairs',
		clear:    'fa fa-chevron-trash-o',
		close:    'fa fa-remove'
	}
};

function dateTimeField(id) {
	var dtp = $(id).datetimepicker(dtpOptions).data('DateTimePicker');

	$(id).parent().find(".input-group-addon").click(function() {
		dtp.show();
		return false;
	});

	return dtp;
}
