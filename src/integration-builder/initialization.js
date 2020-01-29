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
                    // 1st version of OneTrust required a selection from group1, group2, etc
                    if (key.indexOf('group') >= 0) {
                        key = key.replace(/\D/g, '');
                    }

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

module.exports = {
    initialization: initialization
};
