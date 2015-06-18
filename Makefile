install-libs:
	test -e libs/.completed || $(MAKE) force-install-libs

force-install-libs:
	mkdir -p libs
	wget https://code.jquery.com/jquery-2.1.4.min.js -O libs/jquery.min.js
	wget https://raw.githubusercontent.com/janl/mustache.js/master/mustache.min.js -O libs/mustache.min.js
	wget https://raw.githubusercontent.com/phihag/excel-builder.js/dist/dist/excel-builder.dist.min.js -O libs/excel-builder.dist.min.js
	wget https://raw.githubusercontent.com/eligrey/FileSaver.js/master/FileSaver.min.js -O libs/FileSaver.min.js
	touch libs/.completed

clean:
	rm -rf -- libs

.PHONY: install-libs force-install-libs
