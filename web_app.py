"Web API for CommonplacesCultures"


import json
import re
from typing import Optional
from collections import namedtuple

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

# FastAPI application server
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/public", StaticFiles(directory="public"), name="public")
app.mount("/components", StaticFiles(directory="public/components"), name="components")
app.mount("/css", StaticFiles(directory="public/css"), name="css")
app.mount("/img", StaticFiles(directory="public/img"), name="img")

with open("config.json") as config_file:
    CONFIG = json.load(config_file)

SORT_KEY_MAP = {
    -1: [""],
    0: ["passageidentcount DESC", "sourceauthor", "sourcetitle"],
    1: ["targetdate", "targetauthor"],
    2: ["sourcedate", "sourceauthor"],
    3: ["targetauthor"],
    4: ["targetauthor"],
}
FULL_TEXT_FIELDS = {
    "author",
    "sourceauthor",
    "targetauthor",
    "title",
    "sourcetitle",
    "targettitle",
    "matchcontext",
    "sourcematchcontext",
    "targetmatchcontext",
    "sourcemodulename",
    "targetmodulename",
}
BOOLEAN_ARGS = re.compile(r"""(NOT \w+)|("[^"]+")|(\w+)""")
QUERY_CONDITION = namedtuple("QueryConditions", ["joiner", "field", "operator", "value"])


def add_to_condition(query_conditions, joiner, field, operator):
    """Update query condition"""
    if not query_conditions:
        query_conditions = f"{field} {operator} %s"
    elif joiner in ("AND", "OR"):
        query_conditions += f" {joiner} {field} {operator} %s"
    else:
        query_conditions += f" AND {field} {operator} %s"
    return query_conditions


def build_query(request: Request):
    """Build SQL query"""
    query_conditions = ""
    query_values = []
    for param, value in request.query_params.items():
        if param in ("duplicates", "facet", "offset"):
            continue  # TODO fix duplicates?
        if value != "":
            if param != "sorting":
                # if param == "duplicates":  TODO
                #     param_value =
                if param == "bible":
                    if value == "ignore":
                        query_conditions = add_to_condition(
                            query_conditions, joiner="", field="authorident", operator="!="
                        )
                        query_values.append(value)
                    elif value == "only":
                        query_conditions = add_to_condition(
                            query_conditions,
                            joiner="",
                            field="authorident",
                            operator="=",
                        )
                        query_values.append(value)
                    else:
                        continue
                elif param in FULL_TEXT_FIELDS:
                    if "OR" in value:
                        if query_conditions:
                            query_conditions += " AND"
                        query_conditions += f" ({param} ~* %s"
                        values = value.split(" OR ")
                        first_value = values.pop()
                        query_values.append(fr"\m{first_value}\M")
                        for query_value in values:
                            query_conditions += f" OR {param} ~* %s"
                            query_values.append(fr"\m{query_value}\M")
                        query_conditions += ")"
                    else:
                        for not_query, quoted_query, regular_query in BOOLEAN_ARGS.findall(value):
                            if quoted_query:
                                if query_conditions:
                                    query_conditions += " AND"
                                query_conditions += f" {param}=%s"
                                query_values.append(quoted_query[1:-1])
                            else:
                                if not_query != "":
                                    query_value = not_query
                                else:
                                    query_value = regular_query
                                if query_value.startswith("NOT "):
                                    if query_conditions:
                                        query_conditions += " AND"
                                    query_conditions += f" {param} !~* %s"
                                    split_value = " ".join(query_value.split()[1:]).strip()
                                    query_values.append(fr"\m{split_value}\M")
                                else:
                                    if query_conditions:
                                        query_conditions += " AND"
                                    query_conditions += f" {param} ~* %s"
                                    query_values.append(fr"\m{query_value}\M")
                else:
                    value = value.replace('"', "")
                    if "-" in value:
                        date_range = [int(i) for i in value.split("-")]
                        if query_conditions:
                            query_conditions += " AND "
                        query_conditions += f" {param} BETWEEN %s AND %s"
                        query_values.extend(date_range)
                    else:
                        query_conditions = add_to_condition(query_conditions, joiner="", field=param, operator="=")
                        query_values.append(value)
    return query_conditions, tuple(query_values)


@app.get("/")
@app.get("/nav/{dbname}")
@app.get("/nav/{dbname}/passage/{passage_id}")
@app.get("/nav/{dbname}/query/search")
@app.get("/nav/{dbname}/topic/{topicID}")
@app.get("/nav/{dbname}/commonplace/search")
def index(dbname="ecco"):
    """Index file for app"""
    if dbname is None:
        dbname = "ecco"
    with open("public/index.html") as index_file:
        index_html = index_file.read()
        index_html = index_html.replace(r"{{ .title }}", "Commonplace Cultures")
        index_html = index_html.replace(r"{{ .dbSelected }}", dbname)
    return HTMLResponse(index_html)


@app.get("/api/{dbname}/commonplaces/{passage_id}")
def find_common_places(dbname: str, passage_id: int):
    """Retrieve commonplaces"""
    filtered_authors = {}
    filtered_titles = {}
    with psycopg2.connect(
        database=CONFIG["database"], user=CONFIG["user"], password=CONFIG["password"], host="localhost"
    ) as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            f"SELECT sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcemodulename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetmodulename, authorident FROM {dbname} WHERE passageident=%s",
            (passage_id,),
        )
        for row in cursor:
            source_author = row["sourceauthor"].replace("<fs/>", "; ")
            source_title = row["sourcetitle"].replace("<fs/>", "; ")
            target_author = row["targetauthor"].replace("<fs/>", "; ")
            target_title = row["targettitle"].replace("<fs/>", "; ")
            if source_author not in filtered_authors:
                filtered_authors[source_author] = {
                    "author": source_author,
                    "title": source_title,
                    "date": row["sourcedate"],
                    "leftContext": row["sourceleftcontext"],
                    "rightContext": row["sourcerightcontext"],
                    "matchContext": row["sourcematchcontext"],
                    "philoID": row["sourcephiloid"],
                    "databaseName": row["sourcemodulename"],
                    "passageID": passage_id,
                    "authorident": row["authorident"],
                }
            else:
                if (
                    filtered_authors[source_author]["date"] > row["sourcedate"]
                    or filtered_authors[source_author]["date"] == row["sourcedate"]
                    and len(filtered_authors[source_author]["matchContext"]) < len(row["sourcematchcontext"])
                ):
                    filtered_authors[source_author] = {
                        "author": source_author,
                        "title": source_title,
                        "date": row["sourcedate"],
                        "leftContext": row["sourceleftcontext"],
                        "rightContext": row["sourcerightcontext"],
                        "matchContext": row["sourcematchcontext"],
                        "philoID": row["sourcephiloid"],
                        "databaseName": row["sourcemodulename"],
                        "passageID": passage_id,
                        "authorident": row["authorident"],
                    }
            if source_title not in filtered_titles:
                filtered_titles[source_title] = {
                    "author": source_author,
                    "title": source_title,
                    "date": row["sourcedate"],
                    "leftContext": row["sourceleftcontext"],
                    "rightContext": row["sourcerightcontext"],
                    "matchContext": row["sourcematchcontext"],
                    "philoID": row["sourcephiloid"],
                    "databaseName": row["sourcemodulename"],
                    "passageID": passage_id,
                    "authorident": row["authorident"],
                }
            else:
                if filtered_titles[source_title]["date"] > row["sourcedate"]:
                    filtered_titles[source_title] = {
                        "author": source_author,
                        "title": source_title,
                        "date": row["sourcedate"],
                        "leftContext": row["sourceleftcontext"],
                        "rightContext": row["sourcerightcontext"],
                        "matchContext": row["sourcematchcontext"],
                        "philoID": row["sourcephiloid"],
                        "databaseName": row["sourcemodulename"],
                        "passageID": passage_id,
                        "authorident": row["authorident"],
                    }
            # Process target results
            if target_author not in filtered_authors:
                filtered_authors[target_author] = {
                    "author": target_author,
                    "title": target_title,
                    "date": row["targetdate"],
                    "leftContext": row["targetleftcontext"],
                    "rightContext": row["targetrightcontext"],
                    "matchContext": row["targetmatchcontext"],
                    "philoID": row["targetphiloid"],
                    "databaseName": row["targetmodulename"],
                    "passageID": passage_id,
                    "authorident": row["authorident"],
                }
            else:
                if (
                    filtered_authors[target_author]["date"] > row["targetdate"]
                    or filtered_authors[target_author]["date"] == row["targetdate"]
                    and len(filtered_authors[target_author]["matchContext"]) < len(row["targetmatchcontext"])
                ):
                    filtered_authors[target_author] = {
                        "author": target_author,
                        "title": target_title,
                        "date": row["targetdate"],
                        "leftContext": row["targetleftcontext"],
                        "rightContext": row["targetrightcontext"],
                        "matchContext": row["targetmatchcontext"],
                        "philoID": row["targetphiloid"],
                        "databaseName": row["targetmodulename"],
                        "passageID": passage_id,
                        "authorident": row["authorident"],
                    }
            if target_title not in filtered_titles:
                filtered_titles[target_title] = {
                    "author": target_author,
                    "title": target_title,
                    "date": row["targetdate"],
                    "leftContext": row["targetleftcontext"],
                    "rightContext": row["targetrightcontext"],
                    "matchContext": row["targetmatchcontext"],
                    "philoID": row["targetphiloid"],
                    "databaseName": row["targetmodulename"],
                    "passageID": passage_id,
                    "authorident": row["authorident"],
                }
            else:
                if filtered_titles[target_title]["date"] > row["targetdate"]:
                    filtered_titles[target_title] = {
                        "author": target_author,
                        "title": target_title,
                        "date": row["targetdate"],
                        "leftContext": row["targetleftcontext"],
                        "rightContext": row["targetrightcontext"],
                        "matchContext": row["targetmatchcontext"],
                        "philoID": row["targetphiloid"],
                        "databaseName": row["targetmodulename"],
                        "passageID": passage_id,
                        "authorident": row["authorident"],
                    }
        unique_titles = [value for value in filtered_titles.values()]
        unique_titles.sort(key=lambda x: x["date"])
        unique_authors = []
        results = {}
        for value in filtered_authors.values():
            if value["date"] not in results:
                results[value["date"]] = [value]
            else:
                results[value["date"]].append(value)
        for key, value in results.items():
            unique_authors.append({"date": key, "result": value})
        unique_authors.sort(key=lambda x: x["date"])
        full_results = {"passageList": unique_titles, "titleList": unique_authors}
    return full_results


@app.get("/api/{dbname}/fulltext")
def full_text_query(
    dbname: str,
    sorting: int,
    request: Request,
    offset: Optional[int] = None,
):
    """Full text query"""
    # TODO: replicate duplicate IDS functionality. Can't recall what this does...
    # duplicate_ids =
    query = f"SELECT sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcemodulename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetmodulename, passageident, passageidentcount, authorident FROM {dbname} WHERE "
    sort_fields = ", ".join(SORT_KEY_MAP[sorting])
    query_conditions, query_values = build_query((request))
    print(query_conditions)
    print(query_values)
    query += query_conditions
    if offset is None:
        if sorting == -1:
            query += " LIMIT 40"
        else:
            query += f" ORDER BY {sort_fields} LIMIT 40"
    else:
        if sorting == -1:
            query += f" OFFSET {offset} LIMIT 40"
        else:
            query += f" ORDER BY {sorting} OFFSET {offset} LIMIT 40"
    results = {"fullList": []}
    with psycopg2.connect(
        database=CONFIG["database"], user=CONFIG["user"], password=CONFIG["password"], host="localhost"
    ) as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        print(cursor.mogrify(query, query_values))
        cursor.execute(query, query_values)
        for row in cursor:
            source_author = row["sourceauthor"].replace("<fs/>", "; ")
            source_title = row["sourcetitle"].replace("<fs/>", "; ")
            target_author = row["targetauthor"].replace("<fs/>", "; ")
            target_title = row["targettitle"].replace("<fs/>", "; ")
            results["fullList"].append(
                {
                    "sourceAuthor": source_author,
                    "sourceTitle": source_title,
                    "sourceDate": row["sourcedate"],
                    "sourceLeftContext": row["sourceleftcontext"],
                    "sourceRightContext": row["sourcerightcontext"],
                    "sourceMatchContext": row["sourcematchcontext"],
                    "philoID": row["sourcephiloid"],
                    "databaseName": row["sourcemodulename"],
                    "targetAuthor": target_author,
                    "targetTitle": target_title,
                    "targetDate": row["targetdate"],
                    "targetLeftContext": row["targetleftcontext"],
                    "targetRightContext": row["targetrightcontext"],
                    "targetMatchContext": row["targetmatchcontext"],
                    "targetPhiloID": row["targetphiloid"],
                    "targetmodulename": row["targetmodulename"],
                    "passageID": row["passageident"],
                    "authorident": row["authorident"],
                    "passageIDCount": row["passageidentcount"],
                }
            )
    if len(results["fullList"]) == 0:
        return []
    return results


@app.get("/api/{dbname}/fulltextcount")
def full_text_count(dbname: str, request: Request):
    """Get full text count"""
    # TODO: duplicate ID functionality
    query = f"SELECT COUNT(*) FROM {dbname} WHERE "
    query_conditions, query_values = build_query(request)
    query += query_conditions
    with psycopg2.connect(database=CONFIG["database"], user=CONFIG["user"], password=CONFIG["password"]) as conn:
        cursor = conn.cursor()
        cursor.execute(query, query_values)
        total_count = cursor.fetchone()[0]
    return {"totalCount": total_count}


@app.get("/api/{dbname}/fulltextfacet")
def full_text_facet(dbname: str, facet: str, request: Request):
    """Get full text facet"""
    # TODO: duplicate ID functionality
    query_conditions, query_values = build_query(request)
    if facet.endswith("date"):
        query = f"SELECT CONCAT(decade, '-', decade + 9) AS year, COUNT(*) FROM (SELECT floor({facet} / 10) * 10 AS decade FROM {dbname} WHERE {query_conditions}) t GROUP BY decade ORDER BY COUNT(*) DESC LIMIT 100"
    else:
        query = f"SELECT {facet}, COUNT(*) FROM {dbname} WHERE {query_conditions} GROUP BY {facet} ORDER BY COUNT(*) DESC LIMIT 100"
    results = []
    with psycopg2.connect(database=CONFIG["database"], user=CONFIG["user"], password=CONFIG["password"]) as conn:
        cursor = conn.cursor()
        cursor.execute(query, query_values)
        for row in cursor:
            facet_value, count = row
            results.append({"facet": facet_value, "count": count})
    return results


@app.get("/config/config.json")
def export_config():
    """Export config"""
    return JSONResponse(CONFIG)
