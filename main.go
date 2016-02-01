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
		Port      string                            `json:"port"`
		Databases map[string]map[string]interface{} `json:"databases"`
		Debug     bool                              `json:"debug"`
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

	resultCount struct {
		TotalCount *int32 `json:"totalCount"`
	}

	facetCount struct {
		Facet *string `json:"facet"`
		Count *int32  `json:"count"`
	}

	urlKeyValue struct {
		Key   string
		Value []string
	}

	byDate []resultObject
)

var webConfig = databaseConfig()

var db, err = sql.Open("mysql", "***REMOVED***@/digging?max_statement_time=50")

var idCountMap = map[string]string{
	"passageIDCount": "passageidentcount",
}

var fullTextFields = map[string]bool{
	"author":             true,
	"sourceauthor":       true,
	"targetauthor":       true,
	"title":              true,
	"sourcetitle":        true,
	"targettitle":        true,
	"matchcontext":       true,
	"sourcematchcontext": true,
	"targetmatchcontext": true,
}

var sortKeyMap = map[string][]string{
	"-1": []string{""},
	"0":  []string{"passageidentcount DESC", "sourceauthor", "sourcetitle"},
	"1":  []string{"targetdate", "targetauthor"},
	"2":  []string{"sourcedate", "sourceauthor"},
	"3":  []string{"targetauthor"},
	"4":  []string{"targetauthor"},
}

var queryOperatorSlice = map[string]string{
	" AND ": " +",
	" OR ":  " ?",
	" NOT ": " -",
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

func buildFullTextCondition(param string, value string) (paramValue string) {
	for operator, symbol := range queryOperatorSlice {
		value = strings.Replace(value, operator, symbol, -1)
	}
	if strings.HasPrefix(value, "NOT ") {
		value = strings.Replace(value, "NOT ", "", 1)
		value = strings.Replace(value, "-", "", -1)
		// If starting string is NOT, link the rest with implied AND NOTs
		valueArray := strings.Split(value, " ")
		queryList := make([]string, 1)
		for pos, v := range valueArray {
			if v == " " {
				continue
			}
			condition := fmt.Sprintf("NOT MATCH(%s) AGAINST('%s' IN BOOLEAN MODE)", param, v)
			if pos != 0 {
				condition = "AND " + condition
			}
			queryList = append(queryList, condition)
		}
		paramValue = strings.Join(queryList, " ")
	} else {
		valueArray := strings.Split(value, " ")
		queryList := make([]string, 1)
		for pos, v := range valueArray {
			if v == " " {
				continue
			}
			var condition string
			var link string
			if strings.HasPrefix(v, "+") {
				link = "AND "
				v = strings.Replace(v, "+", "", 1)
				condition = fmt.Sprintf("MATCH(%s) AGAINST('%s' IN BOOLEAN MODE)", param, v)
			} else if strings.HasPrefix(v, "-") {
				link = "AND "
				v = strings.Replace(v, "-", "", 1)
				condition = fmt.Sprintf("NOT MATCH(%s) AGAINST('%s' IN BOOLEAN MODE)", param, v)
			} else if strings.HasPrefix(v, "?") {
				link = "OR"
				v = strings.Replace(v, "?", "", 1)
				condition = fmt.Sprintf("MATCH(%s) AGAINST('%s' IN BOOLEAN MODE)", param, v)
			} else {
				link = "AND "
				condition = fmt.Sprintf("MATCH(%s) AGAINST('%s' IN BOOLEAN MODE)", param, v)
			}
			if pos != 0 {
				condition = link + condition
			}
			queryList = append(queryList, condition)
		}
		paramValue = strings.Join(queryList, " ")
	}
	return paramValue
}

func buildQuery(queryStringMap map[string][]string, duplicatesID string) string {
	var params []string
	var values []interface{}
	for param, v := range queryStringMap {
		for _, value := range v {
			if value != "" {
				if param != "sorting" {
					var paramValue string
					if param == "duplicates" {
						paramValue = fmt.Sprintf("passageident!=%s", duplicatesID)
					} else if param == "bible" {
						if value == "ignore" {
							paramValue = fmt.Sprintf("authorident!=1")
						} else if value == "only" {
							paramValue = fmt.Sprintf("authorident=1")
						} else {
							continue
						}
					} else if _, ok := fullTextFields[param]; ok {
						paramValue = buildFullTextCondition(param, value)
					} else if strings.HasSuffix(param, "_exact") {
						param = strings.Replace(param, "_exact", "", 1)
						fmt.Println(param)
						paramValue = fmt.Sprintf(`%s="%s"`, param, value)
					} else {
						dateRange := strings.Split(value, "-")
						if len(dateRange) == 2 {
							paramValue = fmt.Sprintf("%s BETWEEN %s AND %s", param, dateRange[0], dateRange[1])
						} else {
							paramValue = fmt.Sprintf("%s='%s'", param, value)
						}
					}
					params = append(params, paramValue)
					values = append(values, value)
				}
			}
		}
	}
	queryConditions := strings.Join(params, " AND ")
	return queryConditions
}

func findCommonPlaces(c *echo.Context) error {
	passageID := c.Param("passageID")
	dbname := c.Param("dbname")
	query := "SELECT sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcedatabasename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetdatabasename FROM " + dbname + " WHERE passageident=?"
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
	continued := false
	var offset int
	if _, ok := queryStringMap["offset"]; ok {
		offset, _ = strconv.Atoi(queryStringMap["offset"][0])
		delete(queryStringMap, "offset")
		continued = true
	}
	duplicatesID := webConfig.Databases[dbname]["duplicatesID"].(string)
	query := "SELECT sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcedatabasename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetdatabasename, passageident, passageidentcount FROM " + dbname + " WHERE "
	sorting := strings.Join(sortKeyMap[queryStringMap["sorting"][0]], ", ")
	query += buildQuery(queryStringMap, duplicatesID)
	var err error
	var rows *sql.Rows
	if !continued {
		if queryStringMap["sorting"][0] == "-1" {
			query += " LIMIT 20"
		} else {
			query += fmt.Sprintf(" ORDER BY %s LIMIT 20", sorting)
		}
		fmt.Printf("query is:%s\n", query)
		rows, err = db.Query(query)
	} else {
		if queryStringMap["sorting"][0] == "-1" {
			query += fmt.Sprintf(" LIMIT %d, 40", offset)
		} else {
			query += fmt.Sprintf(" ORDER BY %s LIMIT %d, 40", sorting, offset)
		}

		fmt.Printf("query is:%s\n", query)
		rows, err = db.Query(query)
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

func fulltextCount(c *echo.Context) error {
	queryStringMap, _ := url.ParseQuery(c.Request().URL.RawQuery)
	dbname := c.Param("dbname")
	delete(queryStringMap, "dbname")
	duplicatesID := webConfig.Databases[dbname]["duplicatesID"].(string)
	query := "SELECT COUNT(*) FROM " + dbname + " WHERE "
	query += buildQuery(queryStringMap, duplicatesID)
	var row *sql.Row
	row = db.QueryRow(query)
	var totalCount *int32
	err := row.Scan(&totalCount)
	if err != nil {
		c.Error(err)
		return c.JSON(200, resultCount{totalCount})
	}
	result := resultCount{totalCount}
	return c.JSON(200, result)
}

func fulltextFacet(c *echo.Context) error {
	queryStringMap, _ := url.ParseQuery(c.Request().URL.RawQuery)
	dbname := c.Param("dbname")
	delete(queryStringMap, "dbname")
	duplicatesID := webConfig.Databases[dbname]["duplicatesID"].(string)
	facetType := queryStringMap["facet"][0]
	delete(queryStringMap, "facet")
	condition := buildQuery(queryStringMap, duplicatesID)
	var query string
	if facetType == "sourcedate" || facetType == "targetdate" {
		query = fmt.Sprintf("SELECT CONCAT(decade, '-', decade + 9) AS year, COUNT(*) FROM (SELECT floor(`%s` / 10) * 10 AS decade FROM %s WHERE %s) t GROUP BY decade ORDER BY COUNT(*) DESC LIMIT 100", facetType, dbname, condition)
	} else {
		query = fmt.Sprintf("SELECT %s, COUNT(*) FROM "+dbname+" WHERE ", facetType)
		query += condition
		query += fmt.Sprintf(" GROUP BY %s ORDER BY COUNT(*) DESC LIMIT 100", facetType)
	}

	fmt.Println(query)

	var err error
	var rows *sql.Rows
	rows, err = db.Query(query)
	if err != nil {
		var emptyResults []fullTextResultObject
		c.Error(err)
		return c.JSON(200, fullTextResults{emptyResults})
	}

	defer rows.Close()

	var results []facetCount
	for rows.Next() {
		var facet *string
		var totalCount *int32
		newErr := rows.Scan(&facet, &totalCount)
		if newErr != nil {
			c.Error(newErr)
		}
		results = append(results, facetCount{facet, totalCount})
	}
	return c.JSON(200, results)
}

func getTopic(c *echo.Context) error {
	dbname := c.Param("dbname") + "_topics"
	topicID := c.Param("topicID")
	topic, _ := strconv.Atoi(topicID)
	queryStringMap, _ := url.ParseQuery(c.Request().URL.RawQuery)
	continued := false
	var offset int
	if _, ok := queryStringMap["offset"]; ok {
		offset, _ = strconv.Atoi(queryStringMap["offset"][0])
		delete(queryStringMap, "offset")
		continued = true
	}
	query := "SELECT author, title, date, leftcontext, matchcontext, rightcontext, passageident, passageidentcount, topic_weight FROM " + dbname + " WHERE "
	condition := buildQuery(queryStringMap, "")
	fmt.Println("RAw query", c.Request().URL.RawQuery)
	if condition != "" {
		query += fmt.Sprintf(" %s AND ", condition)
	}
	query += fmt.Sprintf("topic=%d AND matchsize > 10 ORDER BY topic_weight DESC", topic)

	if continued {
		query += fmt.Sprintf(" LIMIT %d, 100", offset)
	} else {
		query += " LIMIT 50"
	}
	fmt.Println(query)
	rows, err := db.Query(query)

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

func getTopicCount(c *echo.Context) error {
	dbname := c.Param("dbname") + "_topics"
	topicID := c.Param("topicID")
	topic, _ := strconv.Atoi(topicID)
	query := ""
	query += "SELECT COUNT(*) FROM " + dbname + " WHERE topic=? AND matchsize > 10"
	fmt.Printf("query is:%s %d \n", query, topic)
	var row *sql.Row
	row = db.QueryRow(query, topic)
	var totalCount *int32
	err := row.Scan(&totalCount)
	if err != nil {
		c.Error(err)
		fmt.Println(err)
	}
	result := resultCount{totalCount}
	return c.JSON(200, result)
}

func getTopicFacet(c *echo.Context) error {
	dbname := c.Param("dbname") + "_topics"
	topicID := c.Param("topicID")
	topic, _ := strconv.Atoi(topicID)
	queryStringMap, _ := url.ParseQuery(c.Request().URL.RawQuery)
	facetType := queryStringMap["facet"][0]
	delete(queryStringMap, "facet")
	var query string
	if facetType == "date" {
		query += fmt.Sprintf("SELECT CONCAT(decade, '-', decade + 9) AS year, COUNT(*) FROM (SELECT floor(`%s` / 10) * 10 AS decade FROM %s WHERE topic=? AND matchsize > 10) t GROUP BY decade ORDER BY COUNT(*) DESC LIMIT 100", facetType, dbname)
	} else {
		query += fmt.Sprintf("SELECT %s, COUNT(*) FROM %s WHERE topic=? AND matchsize > 10 GROUP BY %s ORDER BY COUNT(*) DESC LIMIT 100", facetType, dbname, facetType)
	}

	fmt.Printf("facet query is:%s %d\n", query, topic)

	var err error
	var rows *sql.Rows
	rows, err = db.Query(query, topic)
	if err != nil {
		var emptyResults []fullTextResultObject
		c.Error(err)
		return c.JSON(200, fullTextResults{emptyResults})
	}

	defer rows.Close()

	var results []facetCount
	for rows.Next() {
		var facet *string
		var totalCount *int32
		newErr := rows.Scan(&facet, &totalCount)
		if newErr != nil {
			c.Error(newErr)
		}
		results = append(results, facetCount{facet, totalCount})
	}
	return c.JSON(200, results)
}

func getWordDistribution(c *echo.Context, dbname string, topic string) string {
	dbname += "_topic_words"
	query := fmt.Sprintf("SELECT words FROM %s WHERE topic=?", dbname)
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
	queryStringMap, _ := url.ParseQuery(c.Request().URL.RawQuery)
	var offset int
	continued := false
	if _, ok := queryStringMap["offset"]; ok {
		offset, _ = strconv.Atoi(queryStringMap["offset"][0])
		delete(queryStringMap, "offset")
		continued = true
	}
	query := fmt.Sprintf("SELECT author, title, date, leftcontext, matchcontext, rightcontext, passageident, passageidentcount FROM %s WHERE ", dbname)
	query += buildQuery(queryStringMap, "")

	if !continued {
		query += " LIMIT 40"
	} else {
		query += fmt.Sprintf(" LIMIT %d, 40", offset)
	}

	fmt.Println(query)
	rows, err := db.Query(query)
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

func searchInCommonplaceCount(c *echo.Context) error {
	dbname := c.Param("dbname") + "_topics"
	queryStringMap, _ := url.ParseQuery(c.Request().URL.RawQuery)
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE ", dbname)
	query += buildQuery(queryStringMap, "")
	fmt.Println(query, queryStringMap)
	var row *sql.Row
	row = db.QueryRow(query)
	var totalCount *int32
	err := row.Scan(&totalCount)
	if err != nil {
		c.Error(err)
		fmt.Println(err)
	}
	result := resultCount{totalCount}
	return c.JSON(200, result)
}

func commonplaceFacet(c *echo.Context) error {
	queryStringMap, _ := url.ParseQuery(c.Request().URL.RawQuery)
	dbname := c.Param("dbname") + "_topics"
	facetType := queryStringMap["facet"][0]
	delete(queryStringMap, "facet")
	condition := buildQuery(queryStringMap, "")
	var query string
	if facetType == "date" {
		query = fmt.Sprintf("SELECT CONCAT(decade, '-', decade + 9) AS year, COUNT(*) FROM (SELECT floor(`%s` / 10) * 10 AS decade FROM %s WHERE %s) t GROUP BY decade ORDER BY COUNT(*) DESC LIMIT 100", facetType, dbname, condition)
	} else {
		query = fmt.Sprintf("SELECT %s, COUNT(*) FROM "+dbname+" WHERE ", facetType)
		query += condition
		query += fmt.Sprintf(" GROUP BY %s ORDER BY COUNT(*) DESC LIMIT 100", facetType)
	}

	fmt.Println(query)

	var err error
	var rows *sql.Rows
	rows, err = db.Query(query)
	if err != nil {
		var emptyResults []fullTextResultObject
		c.Error(err)
		return c.JSON(200, fullTextResults{emptyResults})
	}

	defer rows.Close()

	var results []facetCount
	for rows.Next() {
		var facet *string
		var totalCount *int32
		newErr := rows.Scan(&facet, &totalCount)
		if newErr != nil {
			c.Error(newErr)
		}
		results = append(results, facetCount{facet, totalCount})
	}
	return c.JSON(200, results)
}

func exportConfig(c *echo.Context) error {
	return c.JSON(200, webConfig)
}

func index(c *echo.Context) error {
	var empty interface{}
	if webConfig.Debug {
		c.Response().Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Response().Header().Set("Pragma", "no-cache")
		c.Response().Header().Set("Expires", "0")
	}
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
	e.Get("/passage/:dbname/:passageID", index)
	e.Get("/query/:dbname/search", index)
	e.Get("/topic/:dbname/:topicID", index)
	e.Get("/commonplace/:dbname/search", index)
	// API calls
	e.Get("/api/:dbname/commonplaces/:passageID", findCommonPlaces)
	e.Get("/api/:dbname/fulltext", fullTextQuery)
	e.Get("/api/:dbname/fulltextcount", fulltextCount)
	e.Get("/api/:dbname/fulltextfacet", fulltextFacet)
	e.Get("/api/:dbname/topic/:topicID", getTopic)
	e.Get("/api/:dbname/topicFacet/:topicID", getTopicFacet)
	e.Get("/api/:dbname/topicCount/:topicID", getTopicCount)
	e.Get("/api/:dbname/searchincommonplace", searchInCommonplace)
	e.Get("/api/:dbname/searchincommonplacecount", searchInCommonplaceCount)
	e.Get("/api/:dbname/commonplacefacet", commonplaceFacet)
	// Export config
	e.Get("/config/config.json", exportConfig)

	e.Run(":" + webConfig.Port)
}
