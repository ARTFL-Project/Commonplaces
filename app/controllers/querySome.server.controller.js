/*eslint-env node, mocha */

"use strict";

exports.some = postgres;

function mysql(req, res, next) {
    var db = req.db,
        queryFields = [],
        queryValues = [];
    for (var i in req.query) {
        if (req.query[i] && i !== "passageident") {
            queryFields.push(i + " regexp ?");
            queryValues.push(req.query[i]);
        } else if (req.query[i] && i === "passageident") {
            queryFields.push(i + "=?");
            queryValues.push(req.query[i]);
        }
    }
    var myquery = "select * from kjv01xallgale where " + queryFields.join(" and ");

    db.getConnection(function(err, connection) {
        if (err) {
            return next(err);
        }
        var filteredAuthors = {};
        var filteredTitles = {};
        var query = connection.query(myquery, queryValues);
        console.log(query.sql);
        query.on("error", function(queryErr) {
            return next(queryErr);
        });
        query.on("field", function(field) {
            console.log(field);
        });
        query.on("result", function(row) {
            var sourceObject = {};
            sourceObject.author = row.sourceauthor;
            sourceObject.title = row.sourcetitle;
            sourceObject.date = row.sourcedate;
            sourceObject.leftContext = row.sourceleftcontext;
            sourceObject.matchContext = row.sourcematchcontext;
            sourceObject.rightContext = row.sourcerightcontext;
            sourceObject.contextLink = row.sourcecontextlink;
            sourceObject.passageId = row.passageident;
            if (!(sourceObject.author in filteredAuthors)) {
                filteredAuthors[sourceObject.author] = sourceObject;
                filteredAuthors[sourceObject.author].otherTitles = {};
            } else if (sourceObject.author in filteredAuthors) {
                if (filteredAuthors[sourceObject.author].date > sourceObject.date) {
                    sourceObject.otherTitles = filteredAuthors[sourceObject.author].otherTitles;
                    filteredAuthors[sourceObject.author] = sourceObject;
                } else if (filteredAuthors[sourceObject.author].date === sourceObject.date && filteredAuthors[sourceObject.author].matchContext.length < sourceObject.matchContext.length) {
                    sourceObject.otherTitles = filteredAuthors[sourceObject.author].otherTitles;
                    filteredAuthors[sourceObject.author] = sourceObject;
                }
                if (filteredAuthors[sourceObject.author].date !== sourceObject.date) {
                    filteredAuthors[sourceObject.author].otherTitles[sourceObject.title] = 1;
                }
            }
            if (!(sourceObject.title in filteredTitles) || filteredTitles[sourceObject.title].date > sourceObject.date) {
                filteredTitles[sourceObject.title] = sourceObject;
            }
            var targetObject = {};
            targetObject.author = row.targetauthor;
            targetObject.title = row.targettitle;
            targetObject.date = row.targetdate;
            targetObject.leftContext = row.targetleftcontext;
            targetObject.matchContext = row.targetmatchcontext;
            targetObject.rightContext = row.targetrightcontext;
            targetObject.contextLink = row.targetcontextlink;
            targetObject.passageId = row.passageident;
            if (!(targetObject.author in filteredAuthors)) {
                filteredAuthors[targetObject.author] = targetObject;
                filteredAuthors[targetObject.author].otherTitles = {};
            } else if (targetObject.author in filteredAuthors) {
                if (filteredAuthors[targetObject.author].date > targetObject.date) {
                    targetObject.otherTitles = filteredAuthors[targetObject.author].otherTitles;
                    filteredAuthors[targetObject.author] = targetObject;
                } else if (filteredAuthors[targetObject.author].date === targetObject.date && filteredAuthors[targetObject.author].matchContext.length < targetObject.matchContext.length) {
                    targetObject.otherTitles = filteredAuthors[targetObject.author].otherTitles
                    filteredAuthors[targetObject.author] = targetObject;
                }
                if (filteredAuthors[targetObject.author].date !== targetObject.date) {
                    if (typeof(filteredAuthors[targetObject.author].otherTitles) !== 'undefined') {
                        filteredAuthors[targetObject.author].otherTitles[targetObject.author] = 1;
                    }
                }
            }
            if (!(targetObject.title in filteredTitles) || filteredTitles[targetObject.title].date > targetObject.date) {
                filteredTitles[targetObject.title] = targetObject;
            }
        });
        query.on("end", function() {
            var passageList = Object.keys(filteredAuthors).map(function(key) {
                return filteredAuthors[key];
            });
            passageList.sort(function(a, b) {
                var x = a.date;
                var y = b.date;
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
            var titleList = Object.keys(filteredTitles).map(function(key) {
                return filteredTitles[key];
            });
            titleList.sort(function(a, b) {
                var x = a.date;
                var y = b.date;
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
            res.json({
                passageList: passageList,
                titleList: titleList
            });
        });
        connection.release();
    });
};

function postgres(req, res, next) {
    var db = req.pg,
        queryFields = [],
        queryValues = [],
        count = 1;
    for (var i in req.query) {
        if (req.query[i] && i !== "passageident") {
            queryFields.push(i + " regexp ");
            queryValues.push(req.query[i]);
        } else if (req.query[i] && i === "passageident") {
            queryFields.push(i + "=$" + count);
            queryValues.push(req.query[i]);
        }
        count += 1;
    }
    console.log(queryFields, queryValues)
    var myquery = "select * from kjv01xallgale where " + queryFields.join(" and ");
    var myresults = [];
    db.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        var filteredAuthors = {};
        var filteredTitles = {};
        var query = client.query(myquery, queryValues);
        query.on('error', function(queryError) {
            return next(queryError);
        });
        query.on('row', function(row) {
            var sourceObject = {};
            sourceObject.author = row.sourceauthor;
            sourceObject.title = row.sourcetitle;
            sourceObject.date = row.sourcedate;
            sourceObject.leftContext = row.sourceleftcontext;
            sourceObject.matchContext = row.sourcematchcontext;
            sourceObject.rightContext = row.sourcerightcontext;
            sourceObject.contextLink = row.sourcecontextlink;
            sourceObject.passageId = row.passageident;
            if (!(sourceObject.author in filteredAuthors)) {
                filteredAuthors[sourceObject.author] = sourceObject;
                filteredAuthors[sourceObject.author].otherTitles = {};
            } else if (sourceObject.author in filteredAuthors) {
                if (filteredAuthors[sourceObject.author].date > sourceObject.date) {
                    sourceObject.otherTitles = filteredAuthors[sourceObject.author].otherTitles;
                    filteredAuthors[sourceObject.author] = sourceObject;
                } else if (filteredAuthors[sourceObject.author].date === sourceObject.date && filteredAuthors[sourceObject.author].matchContext.length < sourceObject.matchContext.length) {
                    sourceObject.otherTitles = filteredAuthors[sourceObject.author].otherTitles;
                    filteredAuthors[sourceObject.author] = sourceObject;
                }
                if (filteredAuthors[sourceObject.author].date !== sourceObject.date) {
                    filteredAuthors[sourceObject.author].otherTitles[sourceObject.title] = 1;
                }
            }
            if (!(sourceObject.title in filteredTitles) || filteredTitles[sourceObject.title].date > sourceObject.date) {
                filteredTitles[sourceObject.title] = sourceObject;
            }
            var targetObject = {};
            targetObject.author = row.targetauthor;
            targetObject.title = row.targettitle;
            targetObject.date = row.targetdate;
            targetObject.leftContext = row.targetleftcontext;
            targetObject.matchContext = row.targetmatchcontext;
            targetObject.rightContext = row.targetrightcontext;
            targetObject.contextLink = row.targetcontextlink;
            targetObject.passageId = row.passageident;
            if (!(targetObject.author in filteredAuthors)) {
                filteredAuthors[targetObject.author] = targetObject;
                filteredAuthors[targetObject.author].otherTitles = {};
            } else if (targetObject.author in filteredAuthors) {
                if (filteredAuthors[targetObject.author].date > targetObject.date) {
                    targetObject.otherTitles = filteredAuthors[targetObject.author].otherTitles;
                    filteredAuthors[targetObject.author] = targetObject;
                } else if (filteredAuthors[targetObject.author].date === targetObject.date && filteredAuthors[targetObject.author].matchContext.length < targetObject.matchContext.length) {
                    targetObject.otherTitles = filteredAuthors[targetObject.author].otherTitles
                    filteredAuthors[targetObject.author] = targetObject;
                }
                if (filteredAuthors[targetObject.author].date !== targetObject.date) {
                    if (typeof(filteredAuthors[targetObject.author].otherTitles) !== 'undefined') {
                        filteredAuthors[targetObject.author].otherTitles[targetObject.author] = 1;
                    }
                }
            }
            if (!(targetObject.title in filteredTitles) || filteredTitles[targetObject.title].date > targetObject.date) {
                filteredTitles[targetObject.title] = targetObject;
            }
        });
        query.on('end', function() {
            var passageList = Object.keys(filteredAuthors).map(function(key) {
                return filteredAuthors[key];
            });
            passageList.sort(function(a, b) {
                var x = a.date;
                var y = b.date;
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
            var titleList = Object.keys(filteredTitles).map(function(key) {
                return filteredTitles[key];
            });
            titleList.sort(function(a, b) {
                var x = a.date;
                var y = b.date;
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
            res.json({
                commonplace: passageList[0],
                passageList: passageList.slice(1),
                titleList: titleList
            });
        });

        done();
    });
}
