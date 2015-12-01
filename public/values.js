(function() {
    "use strict";

    angular
        .module("DiggingApp")
        .value("sortEnd", {
            keys: []
        })
        .value("sortKeys", {
            keys: {
                "1": {
                    label: "Target date, author",
                    fields: ["targetDate", "targetAuthor"]
                },
                "2": {
                    label: "Source date, author",
                    fields: ["sourceDate", "sourceAuthor"]
                },
                "3": {
                    label: "Target author",
                    fields: ["targetAuthor"]
                },
                "4": {
                    label: "Source author",
                    fields: ["sourceAuthor"]
                }
            }
        });
})();
