/* eslint-disable no-undef */

var initialization = {
    name: 'OneTrust',
    moduleId: 134,
    consentMapping: [],
    getConsentGroupIds: function() {
        return window.OnetrustActiveGroups ? window.OnetrustActiveGroups.split(',') : [];
    },

    parseConsentMapping: function(rawConsentMapping) {
        var _consentMapping = {};
        if (rawConsentMapping) {
            var parsedMapping = JSON.parse(rawConsentMapping.replace(/&quot;/g, '\"'));
            parsedMapping.forEach(function(mapping) {
                _consentMapping[mapping.value] = mapping.map;
            });
        }

        return _consentMapping;
    },

    initForwarder: function(forwarderSettings) {
        var self = this;
        self.consentMapping = self.parseConsentMapping(forwarderSettings.consentGroups);

        // Wrap exisitng OptanonWrapper in case customer is using
        // it for something custom so we can hijack
        var OptanonWrapperWrapper = window.OptanonWrapper;

        window.OptanonWrapper = function () {
            if (window.Optanon && window.Optanon.OnConsentChanged) {
                window.Optanon.OnConsentChanged(function() {
                    self.createConsentEvents();
                });
            }

            // Run original OptanonWrapper()
            OptanonWrapperWrapper();
        };
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
                for (var key in this.consentMapping) {
                    var consentPurpose = this.consentMapping[key];
                    var boolean;

                    // removes all non-digits
                    // 1st version of OneTrust required a selection from group1, group2, etc
                    if (key.indexOf('group') >= 0) {
                        key = key.replace(/\D/g, '');
                    }

                    if (this.getConsentGroupIds().indexOf(key) > -1) {
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

module.exports = {
    initialization: initialization
};
