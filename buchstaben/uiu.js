// ui utils
var uiu = (function() {
'use strict';

function qsEach(selector, func, container) {
	if (!container) {
		container = document;
	}
	var nodes = container.querySelectorAll(selector);
	for (var i = 0;i < nodes.length;i++) {
		func(nodes[i], i);
	}
}

function qs(selector, container) {
	if (! container) {
		container = document;
	}

	/*@DEV*/
	var all_nodes = container.querySelectorAll(selector);
	if (all_nodes.length !== 1) {
		throw new Error(all_nodes.length + ' nodes matched by qs ' + selector);
	}
	/*/@DEV*/

	var node = container.querySelector(selector);
	if (! node) {
		report_problem.silent_error('Expected to find qs  ' + selector + ' , but no node matching.');
		return;
	}
	return node;
}

function empty(node) {
	var last;
	while ((last = node.lastChild)) {
		node.removeChild(last);
	}
}

function remove(node) {
	empty(node);
	node.parentNode.removeChild(node);
}

function remove_qsa(qs, container) {
	qsEach(qs, remove, container);
}

function text(node, str) {
	empty(node);
	node.appendChild(node.ownerDocument.createTextNode(str));
}

function text_qs(selector, str) {
	text(qs(selector), str);
}

function ns_el(parent, ns, tagName, attrs, text) {
	var doc = parent ? parent.ownerDocument : document;
	var el = doc.createElementNS(ns, tagName);
	if (attrs) {
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
	}
	if ((text !== undefined) && (text !== null)) {
		el.appendChild(doc.createTextNode(text));
	}
	if (parent) {
		parent.appendChild(el);
	}
	return el;
}

function el(parent, tagName, attrs, text) {
	var doc = parent ? parent.ownerDocument : document;
	var el = doc.createElement(tagName);
	if (attrs) {
		if (typeof attrs === 'string') {
			attrs = {
				'class': attrs,
			};
		}
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
	}
	if ((text !== undefined) && (text !== null)) {
		el.appendChild(doc.createTextNode(text));
	}
	if (parent) {
		parent.appendChild(el);
	}
	return el;
}

// From https://plainjs.com/javascript/attributes/adding-removing-and-testing-for-classes-9/
var hasClass, addClass, removeClass;
if (typeof document != 'undefined') {
	if ('classList' in document.documentElement) {
		hasClass = function(el, className) {
			return el.classList.contains(className);
		};
		addClass = function(el, className) {
			el.classList.add(className);
		};
		removeClass = function(el, className) {
			el.classList.remove(className);
		};
	} else {
		hasClass = function (el, className) {
			return new RegExp('\\b'+ className+'\\b').test(el.className);
		};
		addClass = function (el, className) {
			if (!hasClass(el, className)) {
				el.className += ' ' + className;
			}
		};
		removeClass = function (el, className) {
			el.className = el.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
		};
	}
}

function addClass_qs(selector, className) {
	return addClass(qs(selector), className);
}

function removeClass_qs(selector, className) {
	return removeClass(qs(selector), className);
}

function setClass(el, className, enabled) {
	if (enabled) {
		addClass(el, className);
	} else {
		removeClass(el, className);
	}
}

function closest(el, cb) {
	while (el) {
		if (cb(el)) {
			return el;
		}
		el = el.parentNode;
	}
}

function closest_class(el, className) {
	return closest(el, function(node) {
		// nodeType != 1: not an element (i.e. document)
		return (node.nodeType === 1) && hasClass(node, className);
	});
}

return {
	addClass: addClass,
	addClass_qs: addClass_qs,
	closest: closest,
	closest_class: closest_class,
	empty: empty,
	el: el,
	hasClass: hasClass,
	ns_el: ns_el,
	qs: qs,
	qsEach: qsEach,
	remove: remove,
	remove_qsa: remove_qsa,
	removeClass: removeClass,
	removeClass_qs: removeClass_qs,
	setClass: setClass,
	text: text,
	text_qs: text_qs,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = require('./report_problem');

	module.exports = uiu;
}
/*/@DEV*/
