module('Component - resizer', {
    setup: function () {
        var self = this;
        this.frameID = 100;
        this.utilities = {
            support: {
                requestAnimationFrame: function (fn) {
                    setTimeout(fn, 1);
                    return self.frameID;
                },
                cancelAnimationFrame: function () {}
            },
            common: Crocodoc.getUtilityForTest('common'),
            dom: Crocodoc.getUtilityForTest('dom')
        };
        this.scope = Crocodoc.getScopeForTest(this);
        this.component = Crocodoc.getComponentForTest('resizer', this.scope);
        this.clock = sinon.useFakeTimers();
        this.el = this.utilities.dom.create('div');
        this.utilities.dom.appendTo(document.body, this.el);
    },
    teardown: function () {
        // disable fake timers
        this.clock.restore();
        this.component.destroy();
        this.utilities.dom.remove(this.el);
    }
});

test('destroy() should call support.cancelAnimationFrame when called', function () {
    this.component.init(this.utilities.dom.create('div'));

    this.mock(this.utilities.support)
        .expects('cancelAnimationFrame')
        .withArgs(this.frameID);
    this.component.destroy();
});


test('module should fire "resize" event with the proper data when initialized', function () {
    var w = 100, h = 200,
        data = {
            width: w,
            height: h
        };

    this.utilities.dom.css(this.el, data);

    this.mock(this.scope)
        .expects('broadcast')
        .withArgs('resize', sinon.match(data));
    this.component.init(this.el);
});

test('module should fire "resize" event with the proper data when element is resized', function () {
    var w = 100, h = 200,
        data = {
            width: w,
            height: h
        },
        module = this.component;

    this.utilities.dom.css(this.el, {
        width: 0,
        height: 0
    });
    module.init(this.el);
    this.clock.tick(1);

    this.mock(this.scope)
        .expects('broadcast')
        .withArgs('resize', sinon.match(data));

    this.utilities.dom.css(this.el, data);
    this.clock.tick(1);
});

test('onmessage() should trigger a resize message when called', function () {
    var w = 100, h = 200,
        data = {
            width: w,
            height: h
        };
    this.utilities.dom.css(this.el, data);
    this.component.init(this.el);
    this.mock(this.scope)
        .expects('broadcast')
        .withArgs('resize', sinon.match(data));
    this.component.onmessage('layoutchange');
});
