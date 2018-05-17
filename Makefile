JSFILES=invitations.js

default: lint

install-libs:
	test -e libs/.completed || $(MAKE) force-install-libs

force-install-libs:
	mkdir -p libs
	wget https://code.jquery.com/jquery-2.1.4.min.js -O libs/jquery.min.js
	wget https://raw.githubusercontent.com/janl/mustache.js/master/mustache.min.js -O libs/mustache.min.js
	wget https://raw.githubusercontent.com/phihag/excel-builder.js/dist/dist/excel-builder.dist.min.js -O libs/excel-builder.dist.min.js
	wget https://fastcdn.org/FileSaver.js/1.1.20151003/FileSaver.min.js -O libs/FileSaver.min.js
	wget https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js -O libs/jszip.min.js
	wget https://raw.githubusercontent.com/SheetJS/js-xlsx/master/dist/xlsx.core.min.js -O libs/xlsx.core.min.js
	wget https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js -O libs/d3.min.js
	touch libs/.completed

lint: eslint

eslint:
	eslint ${JSFILES}

clean:
	rm -rf -- libs

.PHONY: default lint eslint install-libs force-install-libs
