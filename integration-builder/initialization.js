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
        consentMapping = parseConsentMapping(forwarderSettings.consentMapping) || {};
        return consentMapping;
    },
    initForwarder: function(forwarderSettings) {
        var self = this;
        self.parseConsentGroupIds();
        if (Optanon && Optanon.OnConsentChanged) {
            Optanon.OnConsentChanged(function() {
                self.parseConsentGroupIds();
                self.createConsentEvents();
            });
        }

        this.parseConsentMapping(forwarderSettings);

    },
    createConsentEvents: function () {
        var location = window.location.href,
            consentState = mParticle.Consent.createConsentState(),
            consent;

        for (var key in consentMapping) {
            var consentName = consentMapping[key];
            var boolean;

            // removes all non-digits
            key = key.replace(/\D/g, '');

            if (groupIds.indexOf(key) > -1) {
                boolean = true;
            } else {
                boolean = false;
            }

            consent = mParticle.Consent.createGDPRConsent(boolean, Date.now(), consentName, location);
            consentState.addGDPRConsentState(consentName, consent);
        }

        var user = mParticle.Identity.getCurrentUser();
        if (user) {
            mParticle.Identity.getCurrentUser().setConsentState(consentState);
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
