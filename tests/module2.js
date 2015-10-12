/* global using */

using("ajax:data.json").define("module2", function (conn) {
    return "This is module 2! " + JSON.parse(conn.responseText).some;
});
