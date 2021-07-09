"""Load Ecco into PG"""

import psycopg2
from psycopg2.extras import execute_values

if __name__ == "__main__":
    with psycopg2.connect(database="commonplaces", user="digging_write", password="martini") as conn:
        cursor = conn.cursor()
        cursor.execute("DROP IF EXIST TABLE ecco")
        cursor.execute(
            """create table ecco (sourceobjectid int, sourceauthor text, sourcetitle text, sourcedate smallint, sourcematchsize smallint, sourceleftcontext text, sourcematchcontext text, sourcerightcontext text, sourcephiloid text, sourcemodulename text, targetobjectid int, targetauthor text, targettitle text, targetdate smallint, targetmatchsize smallint, targetleftcontext text, targetmatchcontext text, targetrightcontext text, targetphiloid text, targetmodulename text, passageident int, passageidentcount int, authorident smallint"""
        )
        with open("ecco_with_fieds") as input_file:
            input_file.readline()  # skip first line
            rows = []
            lines = 0
            for pos, line in enumerate(input_file):
                (
                    sourceobjectid,
                    sourceauthor,
                    sourcetitle,
                    sourcedate,
                    sourcematchsize,
                    sourceleftcontext,
                    sourcematchcontext,
                    sourcerightcontext,
                    sourcephiloid,
                    sourcemodulename,
                    targetobjectid,
                    targetauthor,
                    targettitle,
                    targetdate,
                    targetmatchsize,
                    targetleftcontext,
                    targetmatchcontext,
                    targetrightcontext,
                    targetphiloid,
                    targetmodulename,
                    passageident,
                    passageidentcount,
                    authorident,
                ) = line.split("\t")
                lines += 1
                if lines == 100:
                    execute_values(
                        cursor,
                        """INSERT INTO ecco (sourceobjectid, sourceauthor, sourcetitle, sourcedate, sourcematchsize, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid,sourcemodulename, targetobjectid, targetauthor, targettitle, targetdate, targetmatchsize, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetmodulename,passageident, passageidentcount, authorident) VALUES %s""",
                        rows,
                    )
                    rows = []
                    lines = 0
                if pos == 10000:
                    break
            if lines:
                execute_values(
                    cursor,
                    """INSERT INTO ecco (sourceobjectid, sourceauthor, sourcetitle, sourcedate, sourcematchsize, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid,sourcemodulename, targetobjectid, targetauthor, targettitle, targetdate, targetmatchsize, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetmodulename, passageident, passageidentcount, authorident) VALUES %s""",
                    rows,
                )
                rows = []

            # Create full text search indexes
            for field in [
                "sourceauthor",
                "targetauthor",
                "title",
                "sourcetitle",
                "targetitle",
                "matchcontext",
                "sourcematchcontext",
                "targetmatchcontext",
            ]:
                cursor.execute(f"CREATE INDEX {field}_trigrams_idx ON ecco USING GIN({field} gin_trgm_ops)")

            # Create exact match indexes
            for field in ["sourcemodulename", "targetmodulename"]:
                cursor.execute(f"CREATE INDEX {field}_hash_idx ON ecco USING HASH({field})")

            # Create int indexes
            for field in ["sourcedate", "targetdate"]:
                cursor.execute(f"CREATE INDEX {field}_idx ON ecco USING BTREE({field})")
