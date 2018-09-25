var initialization = {
    name: 'OneTrust',
    initForwarder: function(forwarderSettings, testMode) {
        if (!testMode) {
            var oneTrust = document.createElement('script');
            oneTrust.type = 'text/javascript';
            oneTrust.async = true;
            oneTrust.src = 'https://cdn.cookielaw.org/consent/' + forwarderSettings.apiKey + '.js';

            oneTrust.onload = function() {
                Optanon.OnConsentChanged(function(oneTrustConsentObject) {
                    parseConsent(oneTrustConsentObject, forwarderSettings.consentMapping);
                })
            };
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(oneTrust);
        } else {
            Optanon.OnConsentChanged(function(oneTrustConsentObject) {
                parseConsent(oneTrustConsentObject, forwarderSettings.consentMapping);
            })
        }
        return 'OneTrust successfully loaded';
    }
};

function parseConsent(oneTrustConsentObject, rawConsentMapping) {
    var groupIds = parseConsentForGroupIds(oneTrustConsentObject)

    var consentMapping = parseConsentMapping(rawConsentMapping);

    //to remove once parseConsentMapping function is done
    consentMapping = {
        0: 'nope',
        1: 'alwaysActive',
        2: 'performance',
        3: 'nope',
        4: 'targeting'
    };

    createConsentEvents(groupIds, consentMapping);
}

function parseConsentForGroupIds(oneTrustConsentObject) {
    // groupIds is an array of consent IDs
    if (oneTrustConsentObject && oneTrustConsentObject.detail) {
        return oneTrustConsentObject.detail;
    } else {
        return [];
    }
}

function parseConsentMapping(rawConsentMapping) {
    // var parsedMapping = JSON.parse(rawConsentMapping.replace(/&quot;/g, '\"'));
    // console.log(parsedMapping);
    // return parsedMapping;
}

function createConsentEvents(groupIds, consentMapping) {
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

module.exports = {
    initialization: initialization,
    parseConsent: parseConsent,
    parseConsentMapping: parseConsentMapping,
    parseConsentForGroupIds: parseConsentForGroupIds,
    createConsentEvents: createConsentEvents
};
