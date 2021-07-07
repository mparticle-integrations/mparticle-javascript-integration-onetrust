/* eslint-disable no-undef */
var CONSENT_REGULATIONS = {
    GDPR: 'gdpr',
    CCPA: 'ccpa'
};
var CCPA_PURPOSE = 'data_sale_opt_out';

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

            // TODO: [67837] Revise this to use an actual 'regulation' mapping if UI ever returns this
            parsedMapping.forEach(function(mapping) {
                var purpose = mapping.map;
                _consentMapping[mapping.value] = {
                    purpose: purpose,
                    regulation: purpose === CCPA_PURPOSE ? CONSENT_REGULATIONS.CCPA : CONSENT_REGULATIONS.GDPR 
                };
            });
        }

        return _consentMapping;
    },

    initForwarder: function(forwarderSettings) {
        var self = this;
        self.consentMapping = self.parseConsentMapping(forwarderSettings.consentGroups);

        // Wrap exisitng OptanonWrapper in case customer is using
        // it for something custom so we can hijack
        var OptanonWrapperCopy = window.OptanonWrapper;

        window.OptanonWrapper = function () {
            if (window.Optanon && window.Optanon.OnConsentChanged) {
                window.Optanon.OnConsentChanged(function() {
                    self.createConsentEvents();
                });
            }

            // Run original OptanonWrapper()
            OptanonWrapperCopy();
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
                    var consentPurpose = this.consentMapping[key].purpose;
                    var regulation = this.consentMapping[key].regulation;
                    var consentBoolean = false;

                    // removes all non-digits
                    // 1st version of OneTrust required a selection from group1, group2, etc
                    if (key.indexOf('group') >= 0) {
                        key = key.replace(/\D/g, '');
                    }

                    consentBoolean = (this.getConsentGroupIds().indexOf(key) > -1);

                    // At present, only CCPA and GDPR are known regulations
                    // Using a switch in case a new regulation is added in the future
                    switch (regulation) {
                        case CONSENT_REGULATIONS.CCPA:
                            consent = mParticle.Consent.createCCPAConsent(consentBoolean, Date.now(), consentPurpose, location);
                            consentState.setCCPAConsentState(consent);
                            break;
                        case CONSENT_REGULATIONS.GDPR:
                            consent = mParticle.Consent.createGDPRConsent(consentBoolean, Date.now(), consentPurpose, location);
                            consentState.addGDPRConsentState(consentPurpose, consent);
                            break;
                        default:
                            console.error('Unknown Consent Regulation', regulation);
                    }
                }

                user.setConsentState(consentState);
            }
        }
    }
};

module.exports = {
    initialization: initialization
};
