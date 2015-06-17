install-libs:
	test -e libs/.completed || $(MAKE) force-install-libs

force-install-libs:
	mkdir -p libs
	wget https://raw.githubusercontent.com/SheetJS/js-xlsx/master/dist/xlsx.core.min.js -O libs/xlsx.core.min.js
	wget https://code.jquery.com/jquery-2.1.4.min.js -O libs/jquery.min.js
	wget https://raw.githubusercontent.com/janl/mustache.js/master/mustache.min.js -O libs/mustache.min.js
	wget https://raw.githubusercontent.com/eligrey/FileSaver.js/master/FileSaver.min.js -O libs/FileSaver.min.js
	touch libs/.completed

clean:
	rm -rf -- libs

.PHONY: install-libs force-install-libs
