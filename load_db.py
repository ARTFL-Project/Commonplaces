"""Load Ecco into PG"""

from io import StringIO
from tqdm import tqdm
import psycopg2

if __name__ == "__main__":
    with psycopg2.connect(database="commonplaces", user="digging_write", password="martini", host="localhost") as conn:
        cursor = conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS ecco")
        cursor.execute(
            """create table ecco (sourceobjectid int, sourceauthor text, sourcetitle text, sourcedate smallint, sourcematchsize smallint, sourceleftcontext text, sourcematchcontext text, sourcerightcontext text, sourcephiloid text, sourcemodulename text, targetobjectid int, targetauthor text, targettitle text, targetdate smallint, targetmatchsize smallint, targetleftcontext text, targetmatchcontext text, targetrightcontext text, targetphiloid text, targetmodulename text, passageident int, passageidentcount int, authorident smallint)"""
        )
        with open("ecco_with_fields.tab", encoding="latin-1") as input_file:
            input_file.readline()  # skip first line
            rows = ""
            lines = 0
            for pos, line in tqdm(enumerate(input_file), total=60442025):
                rows += line
                lines += 1
                if lines == 100000:
                    file_obj = StringIO(rows)
                    cursor.copy_from(file_obj, "ecco")
                    rows = ""
                    lines = 0
            if lines:
                file_obj = StringIO(rows)
                cursor.copy_from(file_obj, "ecco")
                rows = ""
                lines = 0
            # Create full text search indexes
            for field in [
                "sourceauthor",
                "targetauthor",
                "sourcetitle",
                "targettitle",
                "sourcematchcontext",
                "targetmatchcontext",
            ]:
                print(f"Indexing {field} with trigram index...", flush=True)
                cursor.execute(f"CREATE INDEX {field}_trigrams_idx ON ecco USING GIN({field} gin_trgm_ops)")

            # Create btree indexes
            for field in [
                "sourceauthor",
                "targetauthor",
                "sourcedate",
                "targetdate",
                "sourcemodulename",
                "targetmodulename",
                "passageident",
            ]:
                print(f"Indexing {field} with b-tree index...", flush=True)
                cursor.execute(f"CREATE INDEX {field}_idx ON ecco USING BTREE({field})")

            # We use a hash index for titles since some fields are too long for a btree index
            cursor.execute("create index sourcetitle_idx on ecco using hash(sourcetitle)")
            cursor.execute("create index targettitle_idx on ecco using hash(targettitle)")
            conn.commit()
