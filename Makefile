install-libs:
	test -e libs/.completed || $(MAKE) force-install-libs

force-install-libs:
	mkdir -p libs
	wget https://raw.githubusercontent.com/SheetJS/js-xlsx/master/dist/xlsx.min.js -O libs/xlsx.min.js
	wget https://code.jquery.com/jquery-2.1.4.min.js -O libs/jquery.min.js
	touch libs/.completed

.PHONY: install-libs force-install-libs
