/*eslint-env node, mocha */

"use strict";

exports.author = function(req, res, next) {
    var db = req.db;
    var queryFields = ["passageident=?", "sourceauthor=?", "sourcetitle!=?"];
    var queryValues = [req.query.passageident, req.query.author, req.query.not_title];
    console.log(queryValues);
    var firstQuery = "select * from commonlitlangext where " + queryFields.join(" and ");
    db.getConnection(function(err, connection) {
        if (err) {
            return next(err);
        }
        var titles = {};
        var query = connection.query( firstQuery, queryValues);
        console.log(query.sql);
        query.on("error", function(error) {
            return next(error);
        });
        query.on("field", function(field) {
            console.log(field);
        });
        query.on("result", function(row) {
            var key = row.sourcetitle + "_" + row.sourcedate;
            if (!(key in titles)) {
                titles[key] = {
                    title: row.sourcetitle,
                    author: row.sourceauthor,
                    date: row.sourcedate,
                    leftContext: row.sourceleftcontext,
                    matchContext: row.sourcematchcontext,
                    rightContext: row.sourcerightcontext,
                    contextLink: row.sourcecontextlink,
                    passageId: row.passageident
                };
            }
        });
        query.on("end", function() {
            //console.log(titles)
            queryFields = ["passageident=?", "targetauthor=?", "targettitle!=?"];
            queryValues = [req.query.passageident, req.query.author, req.query.not_title];
            var secondQuery = "select * from commonlitlangext where " + queryFields.join(" and ");
            db.getConnection(function(newErr, newConnection) {
                if (newErr) {
                    return next(newErr);
                }
                var newQuery = newConnection.query( secondQuery, queryValues);
                console.log(newQuery.sql);
                newQuery.on("error", function(newError) {
                    return next(newError);
                });
                newQuery.on("field", function(newField) {
                    console.log(newField);
                });
                newQuery.on("result", function(newRow) {
                    var key = newRow.targettitle + "_" + newRow.targetdate;
                    if (!(key in titles)) {
                        titles[key] = {
                            title: newRow.targettitle,
                            author: newRow.targetauthor,
                            date: newRow.targetdate,
                            leftContext: newRow.targetleftcontext,
                            matchContext: newRow.targetmatchcontext,
                            rightContext: newRow.targetrightcontext,
                            contextLink: newRow.targetcontextlink,
                            passageId: newRow.passageident
                        };
                    }
                });
                newQuery.on("end", function() {
                    var titleList = Object.keys(titles).map(function (key) { return titles[key]; });
                    titleList.sort(function(a, b) {
                        var x = a.date;
                        var y = b.date;
                        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    });
                    res.json(titleList);
                });
                newConnection.release();
            });
        });
        connection.release();
    });
};
