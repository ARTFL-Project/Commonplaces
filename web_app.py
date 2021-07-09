"Web API for CommonplacesCultures"

import json

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

# from starlette.responses import Response


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
app.mount("/components", StaticFiles(directory="components"), name="components")
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/img", StaticFiles(directory="img"), name="img")

with open("config.json") as config_file:
    CONFIG = json.load(config_file)


@app.get("/")
@app.get("/nav/{dbname}")
@app.get("/nav/{dbname}/passage/{passage_id}")
@app.get("/nav/{dbname}/query/search")
@app.get("/nav/{dbname}/topic/{topicID}")
@app.get("/nav/{dbname}/commonplace/search")
def index(dbname):
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
    with psycopg2.connect(database=CONFIG["database"], user=CONFIG["user"], password=CONFIG["password"]) as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            f"SELECT sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcemodulename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetmodulename, authorident FROM {dbname} WHERE passageident=%s",
            passage_id,
        )
        for row in cursor:
            source_author = row["sourceauthor"].replace("<fs/>", "; ")
            source_title = row["sourcetitle"].replace("<fs/>", "; ")
            target_author = row["targetauthor"].replace("<fs/>", "; ")
            target_title = row["targetitle"].replace("<fs/>", "; ")
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


@app.get("/api/{dbname}/fulltext")
def full_text_query(dbname: str, request: Request):
    """Full text query"""
    passage_id = request.query_params["passageID"]


@app.get("api/{dbname}/fulltextcount")
def full_text_count(dbname: str):
    """Get full text count"""
    pass


@app.get("/api/{dbname}/fulltextfacet")
def full_text_facet(dbname: str):
    """Get full text facet"""
    pass


@app.get("/config/config.json")
def export_config():
    """Export config"""
    return JSONResponse(CONFIG)
