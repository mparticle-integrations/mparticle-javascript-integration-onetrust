/* eslint-disable no-undef */

var groupIds = [],
    consentMapping = null;

var initialization = {
    name: 'OneTrust',
    parseConsentGroupIds: function() {
        groupIds = window.OnetrustActiveGroups ? window.OnetrustActiveGroups.split(',') : [];
        return groupIds;
    },
    parseConsentMapping: function(forwarderSettings) {
        consentMapping = parseConsentMapping(forwarderSettings.consentMapping);
        return consentMapping;
    },
    initForwarder: function(forwarderSettings) {
        var self = this;
        self.parseConsentGroupIds();
        if (Optanon && Optanon.OnConsentChanged) {
            Optanon.OnConsentChanged(function() {
                console.log('onconsentchanged triggered - new groupids', groupIds)
                self.parseConsentGroupIds();
                self.createConsentEvents();
            });
        }

        this.parseConsentMapping(forwarderSettings);
        //to remove once parseConsentMapping function is done
        consentMapping = {
            0: 'nope',
            1: 'alwaysActive',
            2: 'performance',
            3: 'nope',
            4: 'targeting'
        };
    },
    createConsentEvents: function () {
        var location = window.location.href,
            consentState = mParticle.Consent.createConsentState(),
            consent;

        for (var key in consentMapping) {
            var name = consentMapping[key];
            var boolean;
            if (groupIds.indexOf(key) > -1) {
                boolean = true;
            } else {
                boolean = false;
            }

            consent = mParticle.Consent.createGDPRConsent(boolean, Date.now(), name, location);
            consentState.addGDPRConsentState(name, consent);
        }

        var user = mParticle.Identity.getCurrentUser();
        if (user) {
            mParticle.Identity.getCurrentUser().setConsentState(consentState);
        }
    }
};

function parseConsentMapping(rawConsentMapping) {
    // console.log(rawConsentMapping);
    // var parsedMapping = JSON.parse(rawConsentMapping.replace(/&quot;/g, '\"'));
    // console.log(parsedMapping);
    // return parsedMapping;
}

module.exports = {
    initialization: initialization
};
