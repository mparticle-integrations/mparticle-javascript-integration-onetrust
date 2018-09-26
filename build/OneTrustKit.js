(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* eslint-disable no-undef */

var groupIds = [],
    consentMapping = {};

var initialization = {
    name: 'OneTrust',
    parseConsentGroupIds: function() {
        groupIds = window.OnetrustActiveGroups ? window.OnetrustActiveGroups.split(',') : [];
        return groupIds;
    },
    parseConsentMapping: function(forwarderSettings) {
        consentMapping = parseConsentMapping(forwarderSettings.consentGroups) || {};
        return consentMapping;
    },
    initForwarder: function(forwarderSettings) {
        var self = this;
        this.parseConsentMapping(forwarderSettings);
        self.parseConsentGroupIds();
        if (Optanon && Optanon.OnConsentChanged) {
            Optanon.OnConsentChanged(function() {
                self.parseConsentGroupIds();
                self.createConsentEvents();
            });
        }
    },
    createConsentEvents: function () {
        var location = window.location.href,
            consent,
            user = mParticle.Identity.getCurrentUser(),
            consentState = user.getConsentState();

        if (!consentState) {
            consentState = mParticle.Consent.createConsentState();
        }

        for (var key in consentMapping) {
            var consentPurpose = consentMapping[key];
            var boolean;

            // removes all non-digits
            key = key.replace(/\D/g, '');

            if (groupIds.indexOf(key) > -1) {
                boolean = true;
            } else {
                boolean = false;
            }

            consent = mParticle.Consent.createGDPRConsent(boolean, Date.now(), consentPurpose, location);
            consentState.addGDPRConsentState(consentPurpose, consent);
        }

        if (user) {
            user.setConsentState(consentState);
        }
    }
};

function parseConsentMapping(rawConsentMapping) {
    if (rawConsentMapping) {
        var parsedMapping = JSON.parse(rawConsentMapping.replace(/&quot;/g, '\"'));
        parsedMapping.forEach(function(mapping) {
            consentMapping[mapping.value] = mapping.map;
        });
    }

    return consentMapping;
}

module.exports = {
    initialization: initialization
};

},{}],2:[function(require,module,exports){
//
//  Copyright 2018 mParticle, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
var Initialization = require('./integration-builder/initialization').initialization;

(function (window) {
    var name = Initialization.name;

    var constructor = function () {
        var self = this,
            isInitialized = false,
            forwarderSettings;

        self.name = Initialization.name;

        function initForwarder(settings) {
            forwarderSettings = settings;
            if (!isInitialized) {
                try {
                    Initialization.initForwarder(forwarderSettings, isInitialized);
                    isInitialized = true;
                } catch (e) {
                    console.log('Failed to initialize ' + name + ' - ' + e);
                }

                Initialization.createConsentEvents();
            }
        }

        function onUserIdentified() {
            if (isInitialized) {
                try {
                    Initialization.createConsentEvents();
                } catch (e) {
                    return {error: 'Error setting user identity on forwarder ' + name + '; ' + e};
                }
            }
            else {
                return 'Can\'t set new user identities on forwader  ' + name + ', not initialized';
            }
        }

        this.init = initForwarder;
        this.onUserIdentified = onUserIdentified;
        this.process = function() {

        };
    };

    if (!window || !window.mParticle || !window.mParticle.addForwarder) {
        return;
    }

    window.mParticle.addForwarder({
        name: name,
        constructor: constructor
    });
})(window);

},{"./integration-builder/initialization":1}]},{},[2]);
