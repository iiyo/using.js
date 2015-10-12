/* global using */

using.modules.module1 = "module1.js";
using.modules.module2 = "module2.js";
using.modules.module3 = "module3.js";

var tests = 9;
var count = 0;


console.log("");
console.log("-------------------------------------------------------------------");
console.log("");
console.log("Starting tests...");
console.log("");


setTimeout(function () {
    console.log("");
    console.log("-------------------------------------------------------------------");
    console.log("");
    console.log(">>>>>> " + count + " of " + tests + " tests run successfully.");
}, 2000);


using().run(function () {
    count += 1;
    console.log("Calling .run() with empty dependecies works.");
});

using("module1").run(function (module1) {
    count += 1;
    console.log("Module 'module1' loaded successfully:", module1);
});

using("module1").run(function (module1) {
    count += 1;
    console.log("Module 'module1' loaded successfully (2):", module1);
});

using("module1", "module2").run(function (module1, module2) {
    count += 1;
    console.log("Module 'module1' and 'module2' loaded successfully:", module1, module2);
});

using("module3").run(function (module3) {
    count += 1;
    console.log("Module 'module3', which depends on 'module1' and 'module2', " +
        "loaded successfully:", module3);
});

using("module3::foo").run(function (foo) {
    count += 1;
    console.log("Property 'foo' of module 'module3' loaded successfully:", foo);
});

using("module3::foo::bar").run(function (bar) {
    count += 1;
    console.log("Property 'bar' of 'foo' of module 'module3' loaded successfully:", bar);
});

using("ajax:data.json").run(function (conn) {
    count += 1;
    console.log("File loaded successfully via AJAX:", conn.responseText);
});

using("ajax:data.json", "ajax:data.json").run(function (conn, conn2) {
    count += 1;
    console.log("File loaded successfully via AJAX twice:", conn.responseText, conn.responseText);
});
