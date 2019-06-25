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
        if (config.kits) {
            config.kits[name] = {
                constructor: constructor
            };
        }
    }

    if (!window || !window.mParticle || !window.mParticle.addForwarder) {
        return;
    }

    window.mParticle.addForwarder({
        name: name,
        constructor: constructor,
        getId: getId
    });

    module.exports = {
        register: register
    };
})(window);
