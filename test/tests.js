// var kit = require('./integration-builder/initialization');

// var integrationTestBuilder = require('../integration-builder-tests')
/* eslint-disable no-undef*/
describe('OneTrust Forwarder', function () {
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        EventType = {
            Unknown: 0,
            Navigation: 1,
            Location: 2,
            Search: 3,
            Transaction: 4,
            UserContent: 5,
            UserPreference: 6,
            Social: 7,
            Other: 8,
            Media: 9,
            ProductPurchase: 16,
            getName: function () {
                return 'blahblah';
            }
        },
        CommerceEventType = {
            ProductAddToCart: 10,
            ProductRemoveFromCart: 11,
            ProductCheckout: 12,
            ProductCheckoutOption: 13,
            ProductClick: 14,
            ProductViewDetail: 15,
            ProductPurchase: 16,
            ProductRefund: 17,
            PromotionView: 18,
            PromotionClick: 19,
            ProductAddToWishlist: 20,
            ProductRemoveFromWishlist: 21,
            ProductImpression: 22
        },
        ProductActionType = {
            Unknown: 0,
            AddToCart: 1,
            RemoveFromCart: 2,
            Checkout: 3,
            CheckoutOption: 4,
            Click: 5,
            ViewDetail: 6,
            Purchase: 7,
            Refund: 8,
            AddToWishlist: 9,
            RemoveFromWishlist: 10
        },
        IdentityType = {
            Other: 0,
            CustomerId: 1,
            Facebook: 2,
            Twitter: 3,
            Google: 4,
            Microsoft: 5,
            Yahoo: 6,
            Email: 7,
            Alias: 8,
            FacebookCustomAudienceId: 9,
            getName: function () {return 'CustomerID';}
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2
        },
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

            this.initializeCalled = false;


            this.apiKey = null;
            this.OnConsentChangedCalled = false;
            this.OnConsentChanged = function(fn) {
                self.OnConsentChanged = true;
                fn();
            }
        };

    before(function () {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.PromotionType = PromotionActionType;
        mParticle.IdentityType = IdentityType;
        mParticle.CommerceEventType = CommerceEventType;
        mParticle.eCommerce = {};
    });

    beforeEach(function() {
        var oneTrustConsentObject = {
            //
        }
        window.Optanon = new MockForwarder();
        // settings, service, testMode, trackerId, userAttributes, userIdentities, isInitialized
        mParticle.forwarder.init({
            clientKey: '123456',
            appId: 'abcde',
            userIdField: 'customerId'
        }, null, true);
    });

    // it('should parse OneTrust object for group ids', function(done) {
    //     var oneTrustObject = {
    //         detail: ['1', '2', '3', '4']
    //     };
    //     var groupIds = kit.parseConsentForGroupIds(oneTrustObject);
    //     groupIds.should.have.length(4);
    //
    //     groupIds[0].should.equal('1');
    //     groupIds[1].should.equal('2');
    //     groupIds[2].should.equal('3');
    //     groupIds[3].should.equal('4');
    //
    //     done();
    // });
    //
    // it('should parse raw consentMapping object correctly', function(done) {
    //     var rawConsentMapping = '';
    //     var consentMapping = kit.parseConsentMapping(rawConsentMapping);
    //
    //     consentMapping[1].should.equal('performance');
    //     consentMapping[2].should.equal('targeting');
    //     consentMapping[3].should.equal('alwaysActive');
    //     consentMapping[4].should.equal('marketing');
    //
    //     done();
    // });

    it('should properly create consent events on the mParticle user', function(done) {
        window.Forwarder = new MockForwarder();
        window.mParticle.Identity = {
            getCurrentUser: function() {
                return {
                    getMPID: function() {
                        return '123';
                    }};
            }};
            debugger;

        mParticle.forwarder.init({
            clientKey: '123456',
            appId: 'abcde',
            userIdField: 'mpid',
            consentMapping: {}
        }, null, true, null, null, null, null, null, null, null, null, {});


        // window.integration.userId.should.equal('123');

        done();
    });
});
