package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"text/template"

	_ "github.com/go-sql-driver/mysql"
	"github.com/labstack/echo"
	mw "github.com/labstack/echo/middleware"
)

type (
	localTemplate struct {
		templates *template.Template
	}

	config struct {
		Port      string                   `json:"port"`
		Databases []map[string]interface{} `json:"databases"`
		Debug     bool                     `json:"debug"`
	}

	resultObject struct {
		Author       string         `json:"author"`
		Title        string         `json:"title"`
		Date         int32          `json:"date"`
		LeftContext  string         `json:"leftContext"`
		RightContext string         `json:"rightContext"`
		MatchContext string         `json:"matchContext"`
		PhiloID      string         `json:"philoID"`
		DatabaseName string         `json:"databaseName"`
		PassageID    string         `json:"passageID"`
		OtherTitles  map[string]int `json:"otherTitles,omitempty"`
	}

	results struct {
		Commonplace resultObject   `json:"commonplace"`
		PassageList []resultObject `json:"passageList"`
		TitleList   []resultObject `json:"titleList"`
	}

	fullTextResultObject struct {
		Author             *string `json:"sourceAuthor"`
		Title              *string `json:"sourceTitle"`
		Date               *int32  `json:"sourceDate"`
		LeftContext        *string `json:"sourceLeftContext"`
		MatchContext       *string `json:"sourceMatchContext"`
		RightContext       *string `json:"sourceRightContext"`
		PhiloID            *string `json:"philoID"`
		DatabaseName       *string `json:"databasename"`
		TargetAuthor       *string `json:"targetAuthor"`
		TargetTitle        *string `json:"targetTitle"`
		TargetDate         *int32  `json:"targetDate"`
		TargetLeftContext  *string `json:"targetLeftContext"`
		TargetMatchContext *string `json:"targetMatchContext"`
		TargetRightContext *string `json:"targetRightContext"`
		TargetPhiloID      *string `json:"targetPhiloID"`
		TargetDatabaseName *string `json:"targetDatabaseName"`
		PassageID          *int32  `json:"passageID"`
		PassageIDCount     *int32  `json:"passageIDCount"`
	}

	fullTextResults struct {
		FullTextList []fullTextResultObject `json:"fullList"`
	}

	topicPassages struct {
		Author            *string  `json:"author"`
		Title             *string  `json:"title"`
		Date              *int32   `json:"date"`
		LeftContext       *string  `json:"leftContext"`
		MatchContext      *string  `json:"matchContext"`
		RightContext      *string  `json:"rightContext"`
		PassageIdent      *int32   `json:"passageID"`
		PassageIdentCount *int32   `json:"passageIDCount"`
		TopicWeight       *float32 `json:"topicWeight"`
	}

	topicResults struct {
		Passages []topicPassages `json:"passages"`
		Words    string          `json:"words"`
	}

	wordDistribution struct {
		Words *string `json:"words"`
	}

	commonplaceFullTextResult struct {
		Author            *string `json:"author"`
		Title             *string `json:"title"`
		Date              *int32  `json:"date"`
		LeftContext       *string `json:"leftContext"`
		MatchContext      *string `json:"matchContext"`
		RightContext      *string `json:"rightContext"`
		PassageIdent      *int32  `json:"passageID"`
		PassageIdentCount *int32  `json:"passageIDCount"`
	}

	urlKeyValue struct {
		Key   string
		Value []string
	}

	byDate []resultObject
)

var webConfig = databaseConfig()

var db, err = sql.Open("mysql", "***REMOVED***@/digging")

var idCountMap = map[string]string{
	"passageIDCount": "passageidentcount",
}

var fullTextFields = map[string]bool{
	"sourceauthor":       true,
	"targetauthor":       true,
	"sourcetitle":        true,
	"targettitle":        true,
	"sourcematchcontext": true,
	"targetmatchcontext": true,
}

var sortKeyMap = map[string][]string{
	"-1": []string{""},
	"0":  []string{"passageidentcount desc", "sourceauthor", "sourcetitle"},
	"1":  []string{"targetdate", "targetauthor"},
	"2":  []string{"sourcedate", "sourceauthor"},
	"3":  []string{"targetauthor"},
	"4":  []string{"targetauthor"},
}

var queryOperatorSlice = map[string]string{
	" AND ": " +",
	" OR ":  " ",
	"NOT ":  " -",
}

func (slice byDate) Len() int {
	return len(slice)
}

func (slice byDate) Less(i, j int) bool {
	return slice[i].Date < slice[j].Date
}

func (slice byDate) Swap(i, j int) {
	slice[i], slice[j] = slice[j], slice[i]
}

func (t *localTemplate) Render(w io.Writer, name string, data interface{}) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func logOutput() *os.File {
	f, err := os.OpenFile("app.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
	if err != nil {
		fmt.Println(err)
	}
	return f
}

func parseQuery(value string) string {
	for operator, symbol := range queryOperatorSlice {
		value = strings.Replace(value, operator, symbol, -1)
	}
	return value
}

func findCommonPlaces(c *echo.Context) error {
	passageID := c.Param("passageID")
	dbname := c.Param("dbname")
	query := "select sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcedatabasename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetdatabasename from " + dbname + " where passageident=?"
	fmt.Printf("query is:%s\n", query)
	fmt.Println(passageID)
	rows, err := db.Query(query, passageID)
	if err != nil {
		c.Error(err)
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
		var philoID string
		var targetPhiloID string
		var databaseName string
		var targetDatabaseName string
		err := rows.Scan(&author, &title, &date, &leftContext, &matchContext, &rightContext, &philoID, &databaseName, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetPhiloID, &targetDatabaseName)
		if err != nil {
			fmt.Println(err)
		}
		otherTitles := make(map[string]int, 0)
		sourceObject := resultObject{author, title, date, leftContext, rightContext, matchContext, philoID, databaseName, passageID, otherTitles}
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
		targetObject := resultObject{targetAuthor, targetTitle, targetDate, targetLeftContext, targetRightContext, targetMatchContext, targetPhiloID, targetDatabaseName, passageID, targetOtherTitles}
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
	return c.JSON(200, fullResults)
}

func fullTextQuery(c *echo.Context) error {
	queryStringMap, _ := url.ParseQuery(c.Request().URL.RawQuery)
	dbname := c.Param("dbname")
	delete(queryStringMap, "dbname")
	// var language string
	var duplicatesID string
	for _, value := range webConfig.Databases {
		if dbname == value["dbname"] {
			// language = value["language"].(string)
			duplicatesID = value["duplicatesID"].(string)
			break
		}
	}

	query := "select sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcedatabasename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetdatabasename, passageident, passageidentcount from " + dbname + " where "
	sorting := strings.Join(sortKeyMap[queryStringMap["sorting"][0]], ", ")
	currentPositionParam := make(map[string][]interface{})
	var params []string
	var values []interface{}
	continued := false
	for param, v := range queryStringMap {
		for _, value := range v {
			if value != "" {
				if param != "sorting" && !strings.HasPrefix(param, "last_") {
					var paramValue string
					if param == "duplicates" {
						paramValue = fmt.Sprintf("passageident!=%s", duplicatesID)
					} else if param == "bible" {
						paramValue = fmt.Sprintf("authorident!=1")
					} else if _, ok := fullTextFields[param]; ok {
						value = parseQuery(value)
						paramValue = fmt.Sprintf("MATCH(%s) AGAINST('%s' IN BOOLEAN MODE)", param, value)
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
				} else if strings.HasPrefix(param, "last_") {
					continued = true
					field := strings.Replace(param, "last_", "", 1)
					// field = parameterMap[field]
					if field == "passageIDCount" {
						field = "passageidentcount"
					}
					currentPositionParam["fields"] = append(currentPositionParam["fields"], field)
					currentPositionParam["values"] = append(currentPositionParam["values"], value)
				}
			}
		}
	}
	query += strings.Join(params, " and ")
	var err error
	var rows *sql.Rows
	if !continued {
		if queryStringMap["sorting"][0] == "-1" {
			query += " limit 20"
		} else {
			query += fmt.Sprintf(" order by %s limit 20", sorting)
		}
		fmt.Printf("query is:%s\n", query)
		rows, err = db.Query(query)
	} else {
		var fieldList []string
		for _, value := range currentPositionParam["fields"] {
			fieldList = append(fieldList, value.(string))
		}
		fields := strings.Join(fieldList, ", ")
		var placeholders []string
		for _ = range currentPositionParam["values"] {
			placeholder := "?"
			placeholders = append(placeholders, placeholder)
		}
		placeholderString := strings.Join(placeholders, ", ")
		if queryStringMap["sorting"][0] == "0" {
			query += fmt.Sprintf(" and (%s) < (%s) order by %s limit 40", fields, placeholderString, sorting)
		} else {
			query += fmt.Sprintf(" and (%s) > (%s) order by %s limit 40", fields, placeholderString, sorting)
		}
		fmt.Printf("query is:%s\n", query)
		rows, err = db.Query(query, currentPositionParam["values"]...)
	}
	if err != nil {
		var emptyResults []fullTextResultObject
		c.Error(err)
		return c.JSON(200, fullTextResults{emptyResults})
	}

	defer rows.Close()

	var results fullTextResults
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
		var philoID string
		var targetphiloID string
		var databaseName string
		var targetDatabaseName string
		var passageID int32
		var passageIDCount int32
		err := rows.Scan(&author, &title, &date, &leftContext, &matchContext, &rightContext, &philoID, &databaseName, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetphiloID, &targetDatabaseName, &passageID, &passageIDCount)
		if err != nil {
			var emptyResults []fullTextResultObject
			c.Error(err)
			return c.JSON(200, fullTextResults{emptyResults})
		}
		sourceResults := fullTextResultObject{&author, &title, &date, &leftContext, &matchContext, &rightContext, &philoID, &databaseName, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetphiloID, &targetDatabaseName, &passageID, &passageIDCount}
		results.FullTextList = append(results.FullTextList, sourceResults)
	}

	if len(results.FullTextList) == 0 {
		var emptyResults []fullTextResultObject
		return c.JSON(200, fullTextResults{emptyResults})
	}
	return c.JSON(200, results)
}

func getTopic(c *echo.Context) error {
	dbname := c.Param("dbname") + "_topics"
	topicID := c.Param("topicID")
	topic, _ := strconv.Atoi(topicID)
	lastTopicWeightParam := c.Query("topicWeight")
	var lastTopicWeight float64
	var firstQuery bool
	if lastTopicWeightParam != "" {
		lastTopicWeight, _ = strconv.ParseFloat(lastTopicWeightParam, 32)
		firstQuery = false
	} else {
		firstQuery = true
	}
	fmt.Println(firstQuery)
	query := ""
	var queryParams []interface{}
	if firstQuery {
		query += "select author, title, date, leftcontext, matchcontext, rightcontext, passageident, passageidentcount, topic_weight from " + dbname + " where topic=? and matchsize > 10 order by topic_weight desc limit 50"
		queryParams = append(queryParams, topic)
		fmt.Printf("query is:%s %d\n", query, topic)
	} else {
		query += "select author, title, date, leftcontext, matchcontext, rightcontext, passageident, passageidentcount, topic_weight from " + dbname + " where topic=? and matchsize > 10 and topic_weight < ? order by topic_weight desc limit 100"
		queryParams = append(queryParams, topic, lastTopicWeight)
		fmt.Printf("query is:%s %d %f\n", query, topic, lastTopicWeight)
	}
	rows, err := db.Query(query, queryParams...)

	fmt.Println(topic)
	if err != nil {
		var emptyResults topicResults
		c.Error(err)
		return c.JSON(200, emptyResults)
	}

	defer rows.Close()

	var topicPassage []topicPassages
	for rows.Next() {
		var author string
		var title string
		var date int32
		var leftContext string
		var rightContext string
		var matchContext string
		var passageID int32
		var passageIDCount int32
		var topicWeight float32
		scanErr := rows.Scan(&author, &title, &date, &leftContext, &matchContext, &rightContext, &passageID, &passageIDCount, &topicWeight)
		if scanErr != nil {
			c.Error(scanErr)
		}
		topicPassage = append(topicPassage, topicPassages{&author, &title, &date, &leftContext, &matchContext, &rightContext, &passageID, &passageIDCount, &topicWeight})
	}
	words := getWordDistribution(c, c.Param("dbname"), topicID)
	results := topicResults{topicPassage, words}
	return c.JSON(200, results)
}

func getWordDistribution(c *echo.Context, dbname string, topic string) string {
	dbname += "_topic_words"
	query := fmt.Sprintf("select words from %s where topic=?", dbname)
	var words string
	err := db.QueryRow(query, topic).Scan(&words)
	if err != nil {
		c.Error(err)
		words = ""
	}
	words = strings.Replace(words, "{", "", 1)
	words = strings.Replace(words, "}", "", 1)
	words = strings.Replace(words, ",", ", ", -1)
	return words
}

func searchInCommonplace(c *echo.Context) error {
	dbname := c.Param("dbname") + "_topics"
	queryTerms := parseQuery(c.Query("query_terms"))
	lastAuthor := c.Param("last_author")
	lastDate := c.Param("last_date")
	query := fmt.Sprintf("select author, title, date, leftcontext, matchcontext, rightcontext, passageident, passageidentcount from %s where ", dbname)
	var queryParams []interface{}
	if lastAuthor != "" {
		queryParams = append(queryParams, lastDate, lastAuthor, queryTerms)
		query += "(date, author) > (?, ?) and match(matchcontext) against(? IN BOOLEAN MODE) order by date, author asc limit 100"
	} else {
		queryParams = append(queryParams, queryTerms)
		query += "match(matchcontext) against(? IN BOOLEAN MODE) order by date, author limit 40"
	}

	fmt.Println(query, queryParams)
	rows, err := db.Query(query, queryParams...)
	if err != nil {
		var emptyResults topicResults
		c.Error(err)
		c.JSON(200, emptyResults)
	}

	defer rows.Close()

	var commonPlaceResults []commonplaceFullTextResult
	for rows.Next() {
		var author string
		var title string
		var date int32
		var leftContext string
		var rightContext string
		var matchContext string
		var passageID int32
		var passageIdentCount int32
		scanErr := rows.Scan(&author, &title, &date, &leftContext, &matchContext, &rightContext, &passageID, &passageIdentCount)
		if scanErr != nil {
			c.Error(scanErr)
		}
		commonPlaceResults = append(commonPlaceResults, commonplaceFullTextResult{&author, &title, &date, &leftContext, &matchContext, &rightContext, &passageID, &passageIdentCount})
	}
	return c.JSON(200, commonPlaceResults)
}

func exportConfig(c *echo.Context) error {
	return c.JSON(200, webConfig)
}

func index(c *echo.Context) error {
	var empty interface{}
	return c.Render(200, "index.html", empty)
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

	e := echo.New()

	e.HTTP2(true)

	e.Use(mw.Logger())
	e.SetLogOutput(logOutput())
	e.SetDebug(webConfig.Debug)

	e.Use(mw.Recover())
	e.Use(mw.Gzip())

	indexTemplate := &localTemplate{
		// Cached templates
		templates: template.Must(template.ParseFiles("public/index.html")),
	}
	e.SetRenderer(indexTemplate)

	// Static files
	e.Static("/public/", "public")
	e.Static("/components/", "public/components")
	e.Static("/css/", "public/css")

	e.Index("public/index.html")

	// Routes
	// e.Get("/", index)
	e.Get("/passage/:dbname/:passageID", index)
	e.Get("/query/:dbname/search", index)
	e.Get("/topic/:dbname/:topicID", index)
	e.Get("/commonplace/:dbname/search", index)
	// API calls
	e.Get("/api/:dbname/commonplaces/:passageID", findCommonPlaces)
	e.Get("/api/:dbname/fulltext", fullTextQuery)
	e.Get("/api/:dbname/topic/:topicID", getTopic)
	e.Get("/api/:dbname/searchincommonplace", searchInCommonplace)
	// Export config
	e.Get("/config/config.json", exportConfig)

	e.Run(":" + webConfig.Port)
}
