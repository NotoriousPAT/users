define([
	"./core",
	"./var/strundefined",
	"./var/rnotwhite",
	"./var/hasOwn",
	"./var/slice",
	"./user/support",
	"./data/var/data_priv",

	"./core/init",
	"./data/accepts",
	"./selector"
], function( jQuery, strundefined, rnotwhite, hasOwn, slice, support, data_priv ) {

var
	rkeyUser = /^key/,
	rmouseUser = /^(?:mouse|pointer|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing users -- not part of the public interface.
 * Props to Dean Edwards' addUser library for many of the ideas.
 */
jQuery.user = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, userHandle, tmp,
			users, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.get( elem );

		// Don't attach users to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's user structure and main handler, if this is the first
		if ( !(users = elemData.users) ) {
			users = elemData.users = {};
		}
		if ( !(userHandle = elemData.handle) ) {
			userHandle = elemData.handle = function( e ) {
				// Discard the second user of a jQuery.user.trigger() and
				// when an user is called after a page has unloaded
				return typeof jQuery !== strundefined && jQuery.user.triggered !== e.type ?
					jQuery.user.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple users separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If user changes its type, use the special user handlers for the changed type
			special = jQuery.user.special[ type ] || {};

			// If selector defined, determine special user api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.user.special[ type ] || {};

			// handleObj is passed to all user handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the user handler queue if we're the first
			if ( !(handlers = users[ type ]) ) {
				handlers = users[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special users handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, userHandle ) === false ) {
					if ( elem.addEventListener ) {
						elem.addEventListener( type, userHandle, false );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which users have ever been used, for user optimization
			jQuery.user.global[ type ] = true;
		}

	},

	// Detach an user or set of users from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			users, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.hasData( elem ) && data_priv.get( elem );

		if ( !elemData || !(users = elemData.users) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all users (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in users ) {
					jQuery.user.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.user.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = users[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching users
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic user handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special user handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeUser( elem, type, elemData.handle );
				}

				delete users[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( users ) ) {
			delete elemData.handle;
			data_priv.remove( elem, "users" );
		}
	},

	trigger: function( user, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			userPath = [ elem || document ],
			type = hasOwn.call( user, "type" ) ? user.type : user,
			namespaces = hasOwn.call( user, "namespace" ) ? user.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do users on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.user.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match user type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.User object, Object, or just an user type string
		user = user[ jQuery.expando ] ?
			user :
			new jQuery.User( type, typeof user === "object" && user );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		user.isTrigger = onlyHandlers ? 2 : 3;
		user.namespace = namespaces.join(".");
		user.namespace_re = user.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the user in case it is being reused
		user.result = undefined;
		if ( !user.target ) {
			user.target = elem;
		}

		// Clone any incoming data and prepend the user, creating the handler arg list
		data = data == null ?
			[ user ] :
			jQuery.makeArray( data, [ user ] );

		// Allow special users to draw outside the lines
		special = jQuery.user.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine user propagation path in advance, per W3C users spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				userPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				userPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the user path
		i = 0;
		while ( (cur = userPath[i++]) && !user.isPropagationStopped() ) {

			user.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( data_priv.get( cur, "users" ) || {} )[ user.type ] && data_priv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && jQuery.acceptData( cur ) ) {
				user.result = handle.apply( cur, data );
				if ( user.result === false ) {
					user.pruserDefault();
				}
			}
		}
		user.type = type;

		// If nobody prusered the default action, do it now
		if ( !onlyHandlers && !user.isDefaultPrusered() ) {

			if ( (!special._default || special._default.apply( userPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the user.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO user when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Pruser re-triggering of the same user, since we already bubbled it above
					jQuery.user.triggered = type;
					elem[ type ]();
					jQuery.user.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return user.result;
	},

	dispatch: function( user ) {

		// Make a writable jQuery.User from the native user object
		user = jQuery.user.fix( user );

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = slice.call( arguments ),
			handlers = ( data_priv.get( this, "users" ) || {} )[ user.type ] || [],
			special = jQuery.user.special[ user.type ] || {};

		// Use the fix-ed jQuery.User rather than the (read-only) native user
		args[0] = user;
		user.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, user ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.user.handlers.call( this, user, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !user.isPropagationStopped() ) {
			user.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !user.isImmediatePropagationStopped() ) {

				// Triggered user must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound user (both can have no namespace).
				if ( !user.namespace_re || user.namespace_re.test( handleObj.namespace ) ) {

					user.handleObj = handleObj;
					user.data = handleObj.data;

					ret = ( (jQuery.user.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (user.result = ret) === false ) {
							user.pruserDefault();
							user.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, user );
		}

		return user.result;
	},

	handlers: function( user, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = user.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!user.button || user.type !== "click") ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.disabled !== true || user.type !== "click" ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	// Includes some user props shared by KeyUser and MouseUser
	props: "altKey bubbles cancelable ctrlKey currentTarget userPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( user, original ) {

			// Add which for key users
			if ( user.which == null ) {
				user.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return user;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( user, original ) {
			var userDoc, doc, body,
				button = original.button;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( user.pageX == null && original.clientX != null ) {
				userDoc = user.target.ownerDocument || document;
				doc = userDoc.documentElement;
				body = userDoc.body;

				user.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				user.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !user.which && button !== undefined ) {
				user.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return user;
		}
	},

	fix: function( user ) {
		if ( user[ jQuery.expando ] ) {
			return user;
		}

		// Create a writable copy of the user object and normalize some properties
		var i, prop, copy,
			type = user.type,
			originalUser = user,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseUser.test( type ) ? this.mouseHooks :
				rkeyUser.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		user = new jQuery.User( originalUser );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			user[ prop ] = originalUser[ prop ];
		}

		// Support: Cordova 2.5 (WebKit) (#13255)
		// All users should have a target; Cordova deviceready doesn't
		if ( !user.target ) {
			user.target = document;
		}

		// Support: Safari 6.0+, Chrome<28
		// Target should not be a text node (#504, #13143)
		if ( user.target.nodeType === 3 ) {
			user.target = user.target.parentNode;
		}

		return fixHook.filter ? fixHook.filter( user, originalUser ) : user;
	},

	special: {
		load: {
			// Pruser triggered image.load users from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native user if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native user so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( user ) {
				return jQuery.nodeName( user.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( user ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( user.result !== undefined && user.originalUser ) {
					user.originalUser.returnValue = user.result;
				}
			}
		}
	},

	simulate: function( type, elem, user, bubble ) {
		// Piggyback on a donor user to simulate a different one.
		// Fake originalUser to avoid donor's stopPropagation, but if the
		// simulated user prusers default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.User(),
			user,
			{
				type: type,
				isSimulated: true,
				originalUser: {}
			}
		);
		if ( bubble ) {
			jQuery.user.trigger( e, null, elem );
		} else {
			jQuery.user.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrusered() ) {
			user.pruserDefault();
		}
	}
};

jQuery.removeUser = function( elem, type, handle ) {
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle, false );
	}
};

jQuery.User = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.User) ) {
		return new jQuery.User( src, props );
	}

	// User object
	if ( src && src.type ) {
		this.originalUser = src;
		this.type = src.type;

		// Users bubbling up the document may have been marked as prusered
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrusered = src.defaultPrusered ||
				src.defaultPrusered === undefined &&
				// Support: Android<4.0
				src.returnValue === false ?
			returnTrue :
			returnFalse;

	// User type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the user object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming user doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.User is based on DOM3 Users as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Users-20030331/ecma-script-binding.html
jQuery.User.prototype = {
	isDefaultPrusered: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	pruserDefault: function() {
		var e = this.originalUser;

		this.isDefaultPrusered = returnTrue;

		if ( e && e.pruserDefault ) {
			e.pruserDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalUser;

		this.isPropagationStopped = returnTrue;

		if ( e && e.stopPropagation ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalUser;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && e.stopImmediatePropagation ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Create mouseenter/leave users using mouseover/out and user-time checks
// Support: Chrome 15+
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.user.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( user ) {
			var ret,
				target = this,
				related = user.relatedTarget,
				handleObj = user.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				user.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				user.type = fix;
			}
			return ret;
		}
	};
});

// Support: Firefox, Chrome, Safari
// Create "bubbling" focus and blur users
if ( !support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( user ) {
				jQuery.user.simulate( fix, user.target, jQuery.user.fix( user ), true );
			};

		jQuery.user.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = data_priv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				data_priv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = data_priv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					data_priv.remove( doc, fix );

				} else {
					data_priv.access( doc, fix, attaches );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( user ) {
				// Can use an empty set, since user contains the info
				jQuery().off( user );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.user.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.pruserDefault && types.handleObj ) {
			// ( user )  dispatched jQuery.User
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.user.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.user.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.user.trigger( type, data, elem, true );
		}
	}
});

return jQuery;
});
