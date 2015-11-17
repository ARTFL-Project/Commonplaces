package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx"
)

type config struct {
	Port      string              `json:"port"`
	Databases []map[string]string `json:"databases"`
	Debug     bool                `json:"debug"`
}

type resultObject struct {
	Author       string         `json:"author"`
	Title        string         `json:"title"`
	Date         int32          `json:"date"`
	LeftContext  string         `json:"leftContext"`
	RightContext string         `json:"rightContext"`
	MatchContext string         `json:"matchContext"`
	ContextLink  string         `json:"contextLink"`
	PassageID    string         `json:"passageID"`
	OtherTitles  map[string]int `json:"otherTitles,omitempty"`
}

type results struct {
	Commonplace resultObject   `json:"commonplace"`
	PassageList []resultObject `json:"passageList"`
	TitleList   []resultObject `json:"titleList"`
}

type fullTextResultObject struct {
	AlignmentID        *int32  `json:"alignmentID"`
	Author             *string `json:"author"`
	Title              *string `json:"title"`
	Date               *int32  `json:"date"`
	LeftContext        *string `json:"leftContext"`
	MatchContext       *string `json:"matchContext"`
	RightContext       *string `json:"rightContext"`
	ContextLink        *string `json:"contextLink"`
	TargetAuthor       *string `json:"targetAuthor"`
	TargetTitle        *string `json:"targetTitle"`
	TargetDate         *int32  `json:"targetDate"`
	TargetLeftContext  *string `json:"targetLeftContext"`
	TargetMatchContext *string `json:"targetMatchContext"`
	TargetRightContext *string `json:"targetRightContext"`
	TargetContextLink  *string `json:"targetContextLink"`
	PassageID          *int32  `json:"passageID"`
	PassageIDCount     *int32  `json:"passageIDCount"`
}

type FullTextResults struct {
	Count        int64                  `json:"count"`
	FullTextList []fullTextResultObject `json:"fullList"`
}

type urlKeyValue struct {
	Key   string
	Value []string
}

type byDate []resultObject

func (slice byDate) Len() int {
	return len(slice)
}

func (slice byDate) Less(i, j int) bool {
	return slice[i].Date < slice[j].Date
}

func (slice byDate) Swap(i, j int) {
	slice[i], slice[j] = slice[j], slice[i]
}

var webConfig = databaseConfig()

var defaultConnConfig pgx.ConnConfig
var pool = createConnPool()

var parameterMap = map[string]string{
	"sourceauthor":       "sourceauthor_fulltext",
	"sourcetitle":        "sourcetitle_fulltext",
	"sourcematchcontext": "sourcematchcontext_fulltext",
	"targetauthor":       "targetauthor_fulltext",
	"targettitle":        "targettitle_fulltext",
	"targetmatchcontext": "targetmatchcontext_fulltext",
}

func createConnPool() *pgx.ConnPool {
	defaultConnConfig.Host = "localhost"
	defaultConnConfig.Database = "digging"
	defaultConnConfig.User = "postgres"
	defaultConnConfig.Password = "***REMOVED***"
	config := pgx.ConnPoolConfig{ConnConfig: defaultConnConfig, MaxConnections: 10}
	pool, err := pgx.NewConnPool(config)
	if err != nil {
		fmt.Printf("Unable to create connection pool: %v", err)
	}
	return pool
}

func findCommonPlaces(c *gin.Context) {
	passageID := c.Param("passageID")
	dbname := c.Param("dbname")
	query := "select sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcecontextlink, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetcontextlink from " + dbname + " where passageident=$1"
	fmt.Printf("query is:%s\n", query)
	fmt.Println(passageID)
	rows, err := pool.Query(query, passageID)
	if err != nil {
		c.JSON(200, results{})
	}

	defer rows.Close()

	filteredAuthors := make(map[string]resultObject, 0)
	filteredTitles := make(map[string]resultObject, 0)
	for rows.Next() {
		var author string
		var targetAuthor string
		var title string
		var targetTitle string
		var date int32
		var targetDate int32
		var leftContext string
		var targetLeftContext string
		var rightContext string
		var targetRightContext string
		var matchContext string
		var targetMatchContext string
		var contextLink string
		var targetContextLink string
		err := rows.Scan(&author, &title, &date, &leftContext, &matchContext, &rightContext, &contextLink, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetContextLink)
		if err != nil {
			fmt.Println(err)
		}
		otherTitles := make(map[string]int, 0)
		sourceObject := resultObject{author, title, date, leftContext, rightContext, matchContext, contextLink, passageID, otherTitles}
		if _, ok := filteredAuthors[author]; !ok {
			filteredAuthors[author] = sourceObject
		} else if _, ok := filteredAuthors[author]; ok {
			if filteredAuthors[author].Date > date {
				sourceObject.OtherTitles = filteredAuthors[author].OtherTitles
				filteredAuthors[author] = sourceObject
			} else if filteredAuthors[author].Date == sourceObject.Date && len(filteredAuthors[author].MatchContext) < len(sourceObject.MatchContext) {
				sourceObject.OtherTitles = filteredAuthors[author].OtherTitles
				filteredAuthors[author] = sourceObject
			}
			if filteredAuthors[author].Date != sourceObject.Date {
				filteredAuthors[author].OtherTitles[sourceObject.Title] = 1
			}
		}
		if _, ok := filteredTitles[sourceObject.Title]; !ok {
			filteredTitles[sourceObject.Title] = sourceObject
		} else if filteredTitles[sourceObject.Title].Date > sourceObject.Date {
			filteredTitles[sourceObject.Title] = sourceObject
		}
		// Process target results
		targetOtherTitles := make(map[string]int, 0)
		targetObject := resultObject{targetAuthor, targetTitle, targetDate, targetLeftContext, targetRightContext, targetMatchContext, targetContextLink, passageID, targetOtherTitles}
		if _, ok := filteredAuthors[targetAuthor]; !ok {
			filteredAuthors[targetAuthor] = targetObject
		} else if _, ok := filteredAuthors[targetAuthor]; ok {
			if filteredAuthors[targetAuthor].Date > date {
				targetObject.OtherTitles = filteredAuthors[targetAuthor].OtherTitles
				filteredAuthors[targetAuthor] = targetObject
			} else if filteredAuthors[targetAuthor].Date == targetObject.Date && len(filteredAuthors[targetAuthor].MatchContext) < len(targetObject.MatchContext) {
				targetObject.OtherTitles = filteredAuthors[targetAuthor].OtherTitles
				filteredAuthors[targetAuthor] = targetObject
			}
			if filteredAuthors[targetAuthor].Date != targetObject.Date && len(filteredAuthors[targetAuthor].OtherTitles) > 0 {
				filteredAuthors[targetAuthor].OtherTitles[targetObject.Title] = 1
			}
		}
		if _, ok := filteredTitles[targetTitle]; !ok {
			filteredTitles[targetObject.Title] = targetObject
		} else if filteredTitles[targetTitle].Date > targetObject.Date {
			filteredTitles[targetObject.Title] = targetObject
		}
	}
	var passageList []resultObject
	for _, value := range filteredAuthors {
		passageList = append(passageList, value)
	}
	sort.Sort(byDate(passageList))
	var titleList []resultObject
	for _, value := range filteredTitles {
		titleList = append(titleList, value)
	}
	sort.Sort(byDate(titleList))
	fullResults := results{passageList[0], passageList[1:], titleList}
	c.JSON(200, fullResults)
}

func fullTextQuery(c *gin.Context) {
	queryStringMap, _ := url.ParseQuery(c.Request.URL.RawQuery)
	dbname := c.Param("dbname")
	delete(queryStringMap, "dbname")
	var language string
	for _, value := range webConfig.Databases {
		if dbname == value["dbname"] {
			language = value["language"]
			break
		}
	}

	fmt.Println(queryStringMap)
	query := "select alignment_id, sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcecontextlink, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetcontextlink, passageident, passageidentcount from " + dbname + " where "
	var params []string
	var values []interface{}
	start := 0
	if _, ok := queryStringMap["start"]; ok {
		start, _ = strconv.Atoi(queryStringMap["start"][0])
		delete(queryStringMap, "start")
	}
	for param, v := range queryStringMap {
		for _, value := range v {
			if value != "" && value != "dbname" {
				var paramValue string
				if _, ok := parameterMap[param]; ok {
					param = parameterMap[param]
					paramValue = fmt.Sprintf("%s @@ to_tsquery('%s', '%s')", param, language, value)
				} else {
					dateRange := strings.Split(value, "-")
					if len(dateRange) == 2 {
						paramValue = fmt.Sprintf("%s between %s and %s", param, dateRange[0], dateRange[1])
					} else {
						paramValue = fmt.Sprintf("%s='%s'", param, value)
					}
				}
				params = append(params, paramValue)
				values = append(values, value)
			}
		}
	}
	query += strings.Join(params, " and ")
	query += fmt.Sprintf(" and alignment_id >= %d limit 20", start)
	fmt.Printf("query is:%s\n", query)
	fmt.Println(values)
	rows, err := pool.Query(query)
	if err != nil {
		var emptyResults []fullTextResultObject
		fmt.Println(err)
		c.JSON(200, FullTextResults{0, emptyResults})
	}

	defer rows.Close()

	var results FullTextResults
	for rows.Next() {
		var alignmentID int32
		var author string
		var targetAuthor string
		var title string
		var targetTitle string
		var date int32
		var targetDate int32
		var leftContext string
		var targetLeftContext string
		var rightContext string
		var targetRightContext string
		var matchContext string
		var targetMatchContext string
		var contextLink string
		var targetContextLink string
		var passageID int32
		var passageIDCount int32
		err := rows.Scan(&alignmentID, &author, &title, &date, &leftContext, &matchContext, &rightContext, &contextLink, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetContextLink, &passageID, &passageIDCount)
		if err != nil {
			var emptyResults []fullTextResultObject
			fmt.Println("retrieving results of query failed")
			fmt.Println(err)
			c.JSON(200, FullTextResults{0, emptyResults})
		}
		sourceResults := fullTextResultObject{&alignmentID, &author, &title, &date, &leftContext, &matchContext, &rightContext, &contextLink, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetContextLink, &passageID, &passageIDCount}
		results.FullTextList = append(results.FullTextList, sourceResults)
	}

	countQuery := "select count(*) from eebo where " + strings.Join(params, " and ")
	fmt.Println(countQuery)
	countingErr := pool.QueryRow(countQuery).Scan(&results.Count)
	// var newCount int32
	// countingErr := countRow.Scan(&results.Count)
	if countingErr != nil {
		fmt.Println(countingErr)
	}
	c.JSON(200, results)
}

func index(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", gin.H{
		"title": "Main website",
	})
}

func databaseConfig() config {
	configFile, err := os.Open("config.json")
	if err != nil {
		fmt.Println("opening config file", err.Error())
	}

	var settings config
	jsonParser := json.NewDecoder(configFile)
	if err = jsonParser.Decode(&settings); err != nil {
		fmt.Println("parsing config file", err.Error())
	}
	return settings
}

func main() {

	fmt.Println(webConfig)

	if !webConfig.Debug {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Static files
	router.LoadHTMLFiles("index.html")
	router.Static("public", "./public")
	router.Static("components", "./public/components")
	router.Static("css", "./public/css")
	// Routes
	router.GET("/", index)
	router.GET("/passage/:dbname/:passageID", index)
	router.GET("/query/:dbname/search", index)
	// API calls
	router.GET("/api/:dbname/commonplaces/:passageID", findCommonPlaces)
	router.GET("/api/:dbname/fulltext", fullTextQuery)

	router.Run(":" + webConfig.Port)
}
