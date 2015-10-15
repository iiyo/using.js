/* global using */

using("module1", "module2").define("module3", function (module1, module2) {
    return {
        module1: module1,
        module2: module2,
        foo: {
            bar: "baz"
        },
        what: "huh?"
    };
});
