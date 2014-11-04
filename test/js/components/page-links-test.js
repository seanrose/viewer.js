module('Component - page-links', {
    setup: function () {
        this.links = [
            {bbox: [690.89, 45.87, 716.15, 63.55], uri: 'http://box.com/'}
        ];
        this.browser = Crocodoc.getUtilityForTest('browser');
        this.scope = Crocodoc.getScopeForTest(this);
        this.utilities = {
            browser: this.browser,
            dom: Crocodoc.getUtilityForTest('dom')
        };
        this.component = Crocodoc.getComponentForTest('page-links', this.scope);
        this.el = this.utilities.dom.create('div');
    }
});

test('init() should create links when called', function () {
    var links = [];
    this.mock(this.component)
        .expects('createLinks')
        .withArgs(links);
    this.component.init(this.el, links);
});

test('init() should create links with a child span element for IE workaround when called', function () {
    this.browser.ie = true;
    this.component.init(this.el, this.links);
    ok(this.utilities.dom.find('.crocodoc-page-link span', this.el), 'span element should exist');
});

test('module should broadcast `linkclick` event with appropriate data when a link is clicked', function () {
    var linkData = this.links[0];

    var click;
    this.utilities.dom.on = function (el, name, fn, a) {
        if (typeof fn === 'string') {
            fn = a;
        }
        click = fn;
    };

    this.browser.ie = false;
    this.mock(this.scope)
        .expects('broadcast')
        .withArgs('linkclick', linkData);
    this.component.init(this.el, this.links);


    var link = this.utilities.dom.find('.crocodoc-page-link', this.el);
    var ev = {
        target: link,
        preventDefault: function () {}
    };

    click(ev);
});
