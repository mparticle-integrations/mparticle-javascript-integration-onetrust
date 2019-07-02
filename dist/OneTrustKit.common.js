Object.defineProperty(exports, '__esModule', { value: true });

/* eslint-disable no-undef */

var groupIds = [],
    consentMapping = {};

var initialization = {
    name: 'OneTrust',
    moduleId: 134,
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
        if (window.Optanon && window.Optanon.OnConsentChanged) {
            window.Optanon.OnConsentChanged(function() {
                self.parseConsentGroupIds();
                self.createConsentEvents();
            });
        }
    },
    createConsentEvents: function () {
        if (window.Optanon) {
            var location = window.location.href,
                consent,
                consentState,
                user = mParticle.Identity.getCurrentUser();

            if (user) {
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

                user.setConsentState(consentState);
            }
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

var initialization_1 = {
    initialization: initialization
};

/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
}

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
var Initialization = initialization_1.initialization;

    

    var name = Initialization.name,
        moduleId = Initialization.moduleId;

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

    function getId() {
        return moduleId;
    }

    function register(config) {
        if (!config) {
            window.console.log('You must pass a config object to register the kit ' + name);
            return;
        }

        if (!isObject(config)) {
            window.console.log('\'config\' must be an object. You passed in a ' + typeof config);
            return;
        }

        if (isObject(config.kits)) {
            config.kits[name] = {
                constructor: constructor
            };
        } else {
            config.kits = {};
            config.kits[name] = {
                constructor: constructor
            };
        }
        window.console.log('Successfully registered ' + name + ' to your mParticle configuration');
    }

    if (window && window.mParticle && window.mParticle.addForwarder) {
        window.mParticle.addForwarder({
            name: name,
            constructor: constructor,
            getId: getId
        });
    }

    var oneTrustWrapper = {
        register: register
    };
var oneTrustWrapper_1 = oneTrustWrapper.register;

exports.default = oneTrustWrapper;
exports.register = oneTrustWrapper_1;
