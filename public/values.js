(function() {
    "use strict";

    angular
        .module("DiggingApp")
        .value("commonplaceSortEnd", {
            last_date: "",
            last_author: ""
        })
        .value("sortEnd", {
            keys: []
        })
        .value("sortKeys", {
            keys: {
                "-1": {
                    label: "No Sorting",
                    fields: [""]
                },
                "0": {
                    label: "Commonplace Probability",
                    fields: ["passageIDCount"]
                },
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
