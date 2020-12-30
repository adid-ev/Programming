ion = require '../'
index = require '../compiler'

tests =
    """
    let x = 10
    """: """
    'use strict';
    var x = 10;
    """
    """
    let x = 10
    if foo
        let y = 20
    if bar
        const y = 30
    """: """
    'use strict';
    var x = 10;
    if (foo) {
        var y = 20;
    }
    if (bar) {
        var y = 30;
    }
    """
    """
    export class StampFilter
        stamp: (key, object) ->
            for name, property of key.type.properties if property.stamp
                log(name)
    """: """
    'use strict';
    var ion = require('ion');
    var StampFilter = ion.defineClass({
            name: 'StampFilter',
            stamp: function (key, object) {
                {
                    var _ref = key.type.properties;
                    for (var name in _ref) {
                        var property = _ref[name];
                        if (property.stamp) {
                            log(name);
                        }
                    }
                }
            }
        });
    module.exports = exports = StampFilter;
    """
    """
    let foo = bar(
        1
        2
    )
    .toString(
        "12"
    )
    .split(' ')
    """: """
    'use strict';
    var foo = bar(1, 2).toString('12').split(' ');
    """
    # """
    # template -> alpha ? beta
    # """: null
    """
    ""
        foo
        bar #baz
    """: """
    'use strict';
    'foo\\nbar #baz';
    """
    """
    let object =
        x: 10
        property visible:
            get: -> true
        y: 20
    """: """
    'use strict';
    var object = Object.defineProperties({
            x: 10,
            y: 20
        }, {
            visible: {
                get: function () {
                    return true;
                }
            }
        });
    """
    # """
    # template foo() ->
    # """: null
    """
    return {a:b ? c}
        d
    """: """
    'use strict';
    var ion = require('ion');
    var _ref = { a: b != null ? b : c };
    ion.add(_ref, d);
    return _ref;
    """
    # """
    # template ->
    #     return []
    #         if alpha
    #             alpha
    #         "Beta"
    #         "Charlie"
    #         for x in delta
    #             x
    #             y
    #             z
    # """: null
    """
    template (model) ->
        return (e) ->
            let {listModel} = model

    """: """
    'use strict';
    var ion = require('ion');
    ion.template(function (model) {
        return ion.createRuntime({
            type: 'Template',
            id: null,
            body: [{
                    type: 'ReturnStatement',
                    argument: {
                        type: 'Function',
                        context: true,
                        value: function (_context) {
                            return function (e) {
                                var model = _context.get('model');
                                var _ref = model;
                                var listModel = _ref.listModel;
                            };
                        }
                    },
                    order: '0'
                }],
            bound: false
        }, {
            this: this,
            model: model
        }, null);
    });
    """
    # """
    # JSON.stringify(deep object)
    # """: null
    """
    foo:
        a: 1
    """: {line:1, column:1}
    """
    style.sheets:
        [module.id]: ""
    """: {line:1, column:1}
    # TODO: Fix this bug in the parser.
    # """
    # for let i = 0; i < 100; i += 10
    #     i
    # """: null

    # """
    # template -> {a:1,b:[2,3]}
    # """: """
    # 'use strict';
    # var ion = require('ion');
    # ion.template(function () {
    #     return ion.createRuntime({
    #         type: 'Template',
    #         id: null,
    #         body: [{
    #                 type: 'ReturnStatement',
    #                 argument: {
    #                     type: 'Literal',
    #                     value: {
    #                         a: 1,
    #                         b: [
    #                             2,
    #                             3
    #                         ]
    #                     }
    #                 },
    #                 order: '0'
    #             }],
    #         bound: false
    #     }, { this: this }, null);
    # });
    # """
    # """
    # let input = PaperInput()
    #     "iron-select"(e) ->
    #         console.log('select', e)
    # """: null    

if global.window?
    return

exports.test = ->
    for input, expected of tests
        options = {target:'es5'}
        if expected is null
            index.compile input, ion.patch({loc:false,source:'ionCompilerES5.js', debug:true}, options)
        else if typeof expected is 'object'
            # expected to throw an error
            error = null
            try
                index.compile input, options
            catch e
                error = e
                # check equivalent fields
                for key, value of expected
                    if value isnt e[key]
                        throw new Error "\n#{JSON.stringify e}\n!=\n#{JSON.stringify expected}"
            if not error?
                throw new Error "Expected an error: #{JSON.stringify expected}"
        else
            output = index.compile input, options
            if output.trim() isnt expected.trim()
                console.log '-Output---------------------------------------------'
                console.log output
                throw new Error "\n#{output}\n!=\n#{expected}"
    return
