/*
 * ClickToAddress for Woocommerce by Crafty Clicks
 *
 * @author		Crafty Clicks Limited
 * @link		https://craftyclicks.co.uk
 * @copyright	Copyright (c) 2016, Crafty Clicks Limited
 * @license		Licensed under the terms of the MIT license.
 * @version		1.1.1
 */

 jQuery(document).ready(function(){
	var c2a_enabled_countries = countriesByWC();
	var c2a_autocomplete_config = {
		tag:						'woocommerce-1.1.1-users',
		accessToken:				cc_c2a_config.access_token,
		domMode:					'object',
		gfxMode:					"1",
		style:{
			ambient:				cc_c2a_config.ambient,
			accent:					cc_c2a_config.accent
		},
		showLogo:					cc_c2a_config.show_logo,
		texts: {
			default_placeholder:	cc_c2a_config.default_placeholder,
			country_placeholder:	cc_c2a_config.country_placeholder,
			country_button:			cc_c2a_config.country_button,
			generic_error:			cc_c2a_config.generic_error,
			no_results:				cc_c2a_config.no_results
		},
		countryLanguage:			cc_c2a_config.language,
		onResultSelected: function(c2a, elements, address){
			// Set the country
			jQuery(elements.country).val(address.country.iso_3166_1_alpha_2);
			if(address.country.iso_3166_1_alpha_2 == 'GB'){
				var postcode = address.postal_code.substring(0,2);
				if (postcode == 'GY' && jQuery.inArray('GG', c2a_enabled_countries)>-1) {
					jQuery(elements.country).val('GG');
				}
				if (postcode == 'JE' && jQuery.inArray('JE', c2a_enabled_countries)>-1) {
					jQuery(elements.country).val('JE');
				}
				if (postcode == 'IM' && jQuery.inArray('IM', c2a_enabled_countries)>-1) {
					jQuery(elements.country).val('IM');
				}
			}
			jQuery(elements.country).trigger('change');
			// Set the county
			c2a.setCounty(jQuery(elements.county.selector)[0], {
				'code':			address.province_code,
				'name':			address.province_name,
				'preferred':	address.province
			});
			jQuery(elements.county.selector).trigger('change');
			// Reveal the hidden fields
			if(!cc_c2a_config.search_line_1){
				if(cc_c2a_config.hide_fields){
					var form = jQuery(elements.country).closest('.form-table');
					showFields(form, true);
				}
				else jQuery(elements.search).val('');
			}
		},
		onError: function(c2a, elements, address){
			// Reveal the hidden fields
			if(!cc_c2a_config.search_line_1){
				if(cc_c2a_config.hide_fields){
					var form = jQuery(elements.country).closest('.form-table');
					showFields(form, true);
				}
				else jQuery(elements.search).val('');
			}
		},
		countryMatchWith: 'iso_2'
	};
	if(cc_c2a_config.match_countries) c2a_autocomplete_config.enabledCountries = c2a_enabled_countries;
	if(cc_c2a_config.lock_country){
		c2a_autocomplete_config.countrySelector = false;
		c2a_autocomplete_config.onSearchFocus = function(c2a, dom){
			var currentCountry = dom.country.options[dom.country.selectedIndex].value;
			if(currentCountry !== ''){
				var countryCode = getCountryCode(c2a, currentCountry, 'iso_2');
				c2a.selectCountry(countryCode);
			}
		};
	}

	c2a_autocomplete_search = new clickToAddress(c2a_autocomplete_config);

	setInterval(function(){
		// Add lookup to billing form
		if (jQuery('#billing_postcode').length && jQuery('#billing_address_1').attr('cc-applied') != "1") {
			c2a_autocomplete_add_lookup('billing');
		}
		// Add lookup to shipping form
		if (jQuery('#shipping_postcode').length && jQuery('#shipping_address_1').attr('cc-applied') != "1") {
			c2a_autocomplete_add_lookup('shipping');
		}
	}, 200);
 });

function c2a_autocomplete_add_lookup(prefix){
	var dom = {
		line_1:		jQuery('#'+prefix+'_address_1')[0],
		line_2:		jQuery('#'+prefix+'_address_2')[0],
		town:		jQuery('#'+prefix+'_city')[0],
		postcode:	jQuery('#'+prefix+'_postcode')[0],
		county:		jQuery('#'+prefix+'_state')[0],
		country:	jQuery('#'+prefix+'_country')[0]
	};

	jQuery(dom.line_1).attr('cc-applied', "1");
	if(!cc_c2a_config.search_line_1){
		// Add the address search field
		var tmp_html = jQuery(	'<tr>'+
									'<th>'+
										'<label for="'+prefix+'_cc_c2a_search_input" id="crafty_find_label_'+prefix+'">'+
											cc_c2a_config.search_label+
										'</label>'+
									'</th>'+
									'<td>'+
										'<input '+
											'id="'+prefix+'_cc_c2a_search_input" '+
											'class="regular-text cc_c2a_search_input" '+
											'type="text">'+
										'</input>'+
									'</td>'+
								'</tr>');
		tmp_html.insertBefore(jQuery(dom.line_1).closest('tr'));
	}

	if(cc_c2a_config.hide_fields && !cc_c2a_config.search_line_1){
		// Get checkout / account form
		var form = jQuery(dom.line_1).closest('.form-table');
		// Add reveal/hide buttons
		var cc_manual_button = jQuery(	'<br>'+
										'<span class="description cc_c2a_manual">'+
											cc_c2a_config.reveal_button+
										'</span>');
		var cc_hide_button = jQuery(	'<br>'+
										'<span class="description cc_c2a_hide">'+
											cc_c2a_config.hide_button+
										'</span>');
		addCraftyButtonCSS(jQuery(cc_manual_button[1]));
		addCraftyButtonCSS(jQuery(cc_hide_button[1]));
		cc_manual_button.insertAfter(jQuery('#'+prefix+'_cc_c2a_search_input'));
		cc_hide_button.insertAfter(dom.line_1);

		// Mark with an attribute all the dom elements to be hidden
		var domKeys = Object.keys(dom);
		for(var iDom=0; iDom < domKeys.length; iDom++){
			if(!cc_c2a_config.lock_country || domKeys[iDom] != 'country')
				jQuery(dom[domKeys[iDom]]).closest('tr').attr('cc-c2a-hide', 1);
		}

		// Initial setup
		if(jQuery(dom.line_1).val() === '')
			setTimeout(function(){
				form.find('[cc-c2a-hide="1"]').hide();
				cc_manual_button.show();
			}, 250);
		else {
			form.find('.cc_c2a_search_input').closest('tr').hide();
			cc_hide_button.show();
		}

		cc_manual_button.on('click', function(){
			jQuery(this).hide(200);
			cc_hide_button.show(200);
			form.find('.cc_c2a_search_input').closest('tr').hide(200);
			showFields(form, false);
		});
		cc_hide_button.on('click', function(){
			jQuery(this).hide(200);
			cc_manual_button.show(200);
			form.find('.cc_c2a_search_input').closest('tr').show(200);
			form.find('[cc-c2a-hide=1]').hide(200);
		});
		if(cc_c2a_config.lock_country)
			jQuery(dom.country).on('change', function(){
				if(cc_manual_button.is(':visible'))
					form.find('[cc-c2a-hide=1]').hide();
			});
	}
	dom.company = jQuery('#'+prefix+'_company')[0];
	dom.county = {selector: '#'+prefix+'_state'};
	if(!cc_c2a_config.search_line_1){
		dom.search = jQuery('#'+prefix+'_cc_c2a_search_input')[0];
	}
	else {
		dom.search = dom.line_1;
	}
	if(cc_c2a_config.lock_country){
		jQuery(dom.search).closest('tr').before(jQuery(dom.country).closest('tr'));
	}
	c2a_autocomplete_search.attach(dom);
}

function showFields(form, buttons){
	var fieldsToShow = form.find('[cc-c2a-hide="1"]');
	// We need to check that each field exists for this country before showing
	for(var i=0; i<fieldsToShow.length; i++){
		if(jQuery(fieldsToShow[i]).find('input, select').attr('type') != 'hidden')
			jQuery(fieldsToShow[i]).show(200);
	}
	if(!cc_c2a_config.hide_buttons){
		form.find('.cc_c2a_search_input').closest('tr').hide(200);
	}
	// Show / hide the buttons
	if(buttons){
		form.find('.cc_c2a_manual').hide(200);
		if(!cc_c2a_config.hide_buttons){
			form.find('.cc_c2a_hide').show(200);
		}
	}
}

function countriesByWC(){
	var country_elems = [jQuery('#billing_country'), jQuery('#shipping_country')];
	var countryNames = [];
	for(var i=0; i<country_elems.length; i++){
		if(country_elems[i].length){
			jQuery(country_elems[i]).find('option').each(function(index, elem){
				var country_val = jQuery(elem).val();
				if(country_val !== '') countryNames.push(country_val);
			});
		}
	}
	return countryNames;
}

function addCraftyButtonCSS(elem){
	elem.css({
		display:	'none',
		cursor:		'pointer'
	});
}
