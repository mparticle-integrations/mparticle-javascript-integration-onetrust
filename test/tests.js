/* eslint-disable no-undef*/
describe('OneTrust Forwarder', function () {
    var server = new MockHttpServer(),
        ReportingService = function () {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function (forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function () {
                this.id = null;
                this.event = null;
            };
        },
        reportService = new ReportingService(),

        MockForwarder = function() {
            var self = this;

            this.initForwarderCalled = false;

            this.apiKey = null;
            this.OnConsentChangedCalled = false;
            this.OnConsentChanged = function(fn) {
                if (!self.OnConsentChangedCalled) {
                    self.OnConsentChangedCalled = true;
                } else {
                    fn();
                }
            };
        };

    function configureOneTrustForwarderAndInit() {
        mParticle.configureForwarder({
            name: 'OneTrust',
            settings: {
                consentMapping: '[{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;group1&quot;,&quot;map&quot;:&quot;strictly necessary&quot;},\
                                {&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;group2&quot;,&quot;map&quot;:&quot;performance&quot;},\
                                {&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;group3&quot;,&quot;map&quot;:&quot;functional&quot;},\
                                {&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;group4&quot;,&quot;map&quot;:&quot;targeting&quot;}]'
            },
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });
        mParticle.init('apikey');
    }



    before(function () {
        server.start();
        server.requests = [];
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'testMPID'
            }));
        };
    });

    beforeEach(function() {
        window.Optanon = new MockForwarder();
    });

    it('should properly create consent events on the mParticle user', function(done) {
        window.OnetrustActiveGroups = ',1,2,3';

        configureOneTrustForwarderAndInit();

        var consent = mParticle.persistence.getLocalStorage()

        consent.testMPID.con.gdpr.should.have.length(4);
        consent.testMPID.con.gdpr.should.have.property('alwaysActive');
        consent.testMPID.con.gdpr.should.have.property('nope');
        consent.testMPID.con.gdpr.should.have.property('performance');
        consent.testMPID.con.gdpr.should.have.property('targeting');

        consent.testMPID.con.gdpr.alwaysActive.should.have.property('c', true);
        consent.testMPID.con.gdpr.nope.should.have.property('c', true);
        consent.testMPID.con.gdpr.performance.should.have.property('c', true);
        consent.testMPID.con.gdpr.targeting.should.have.property('c', true);

        done();
    });

});
