// ====================== DO NOT ALTER ANYTHING IN THIS FILE ======================
// =============== REACH OUT TO MPARTICLE IF YOU HAVE ANY QUESTIONS ===============
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
var IdentityHandler = require('../integration-builder/identity-handler');
var Initialization = require('../integration-builder/initialization').initialization;

(function (window) {
    var name = Initialization.name;

    var constructor = function () {
        var self = this,
            isInitialized = false;

        self.name = Initialization.name;

        function initForwarder(settings, service, testMode, trackerId, userAttributes, userIdentities) {

            try {
                Initialization.initForwarder(settings, testMode, userAttributes, userIdentities);
                isInitialized = true;
            } catch (e) {
                console.log('Failed to initialize ' + name + ' - ' + e);
            }
        }

        function onUserIdentified() {
            if (isInitialized) {
                try {
                    IdentityHandler.onUserIdentified();

                    return 'Successfully set user Identity on forwarder ' + name;
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
