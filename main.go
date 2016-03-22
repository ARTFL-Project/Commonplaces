package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/contrib/gzip"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

type (
	config struct {
		Port         string                            `json:"port"`
		Databases    map[string]map[string]interface{} `json:"databases"`
		Debug        bool                              `json:"debug"`
		Modules      []string                          `json:"modules"`
		LatinAuthors []string                          `json:"latinAuthors"`
		TopAuthors   []string                          `json:"topAuthors"`
		TopTitles    []string                          `json:"topTitles"`
	}

	resultObject struct {
		Author       string `json:"author"`
		Title        string `json:"title"`
		Date         int32  `json:"date"`
		LeftContext  string `json:"leftContext"`
		RightContext string `json:"rightContext"`
		MatchContext string `json:"matchContext"`
		PhiloID      string `json:"philoID"`
		DatabaseName string `json:"databaseName"`
		PassageID    string `json:"passageID"`
		AuthorIdent  string `json:"authorident"`
	}

	results struct {
		PassageList []resultObject `json:"passageList"`
		TitleList   dateGroup      `json:"titleList"`
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
		Targetmodulename   *string `json:"targetmodulename"`
		PassageID          *int32  `json:"passageID"`
		PassageIDCount     *int32  `json:"passageIDCount"`
		AuthorIdent        *string `json:"authorident"`
	}

	fullTextResults struct {
		FullTextList []fullTextResultObject `json:"fullList"`
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

	resultObjectDate []resultObject

	groupedByDate struct {
		Date   int32          `json:"date"`
		Result []resultObject `json:"result"`
	}

	dateGroup []groupedByDate
)

var webConfig = databaseConfig()

var db, err = sql.Open("mysql", "***REMOVED***:***REMOVED***@/digging?max_statement_time=50")

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
	"sourcemodulename":   true,
	"targetmodulename":   true,
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

func (slice resultObjectDate) Len() int {
	return len(slice)
}

func (slice resultObjectDate) Less(i, j int) bool {
	return slice[i].Date < slice[j].Date
}

func (slice resultObjectDate) Swap(i, j int) {
	slice[i], slice[j] = slice[j], slice[i]
}

func (slice dateGroup) Len() int {
	return len(slice)
}

func (slice dateGroup) Less(i, j int) bool {
	return slice[i].Date < slice[j].Date
}

func (slice dateGroup) Swap(i, j int) {
	slice[i], slice[j] = slice[j], slice[i]
}

func logOutput() *os.File {
	f, err := os.OpenFile("app.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
	if err != nil {
		fmt.Println(err)
	}
	return f
}

func findCommonPlaces(c *gin.Context) {
	passageID := c.Param("passageID")
	dbname := c.Param("dbname")
	query := "SELECT sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcemodulename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetmodulename, authorident FROM " + dbname + " WHERE passageident=?"
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
		var targetmodulename string
		var authorIdent string
		err := rows.Scan(&author, &title, &date, &leftContext, &matchContext, &rightContext, &philoID, &databaseName, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetPhiloID, &targetmodulename, &authorIdent)
		if err != nil {
			c.Error(err)
		}
		author = strings.Replace(author, "<fs/>", "; ", -1)
		title = strings.Replace(title, "<fs/>", "; ", -1)
		targetAuthor = strings.Replace(targetAuthor, "<fs/>", "; ", -1)
		targetTitle = strings.Replace(targetTitle, "<fs/>", "; ", -1)
		if _, ok := filteredAuthors[author]; !ok {
			filteredAuthors[author] = resultObject{author, title, date, leftContext, rightContext, matchContext, philoID, databaseName, passageID, authorIdent}
		} else if _, ok := filteredAuthors[author]; ok {
			if filteredAuthors[author].Date > date {
				filteredAuthors[author] = resultObject{author, title, date, leftContext, rightContext, matchContext, philoID, databaseName, passageID, authorIdent}
			} else if filteredAuthors[author].Date == date && len(filteredAuthors[author].MatchContext) < len(matchContext) {
				filteredAuthors[author] = resultObject{author, title, date, leftContext, rightContext, matchContext, philoID, databaseName, passageID, authorIdent}
			}
		}
		if _, ok := filteredTitles[title]; !ok {
			filteredTitles[title] = resultObject{author, title, date, leftContext, rightContext, matchContext, philoID, databaseName, passageID, authorIdent}
		} else if filteredTitles[title].Date > date {
			filteredTitles[title] = resultObject{author, title, date, leftContext, rightContext, matchContext, philoID, databaseName, passageID, authorIdent}
		}
		// Process target results
		if _, ok := filteredAuthors[targetAuthor]; !ok {
			filteredAuthors[targetAuthor] = resultObject{targetAuthor, targetTitle, targetDate, targetLeftContext, targetRightContext, targetMatchContext, targetPhiloID, targetmodulename, passageID, authorIdent}
		} else if _, ok := filteredAuthors[targetAuthor]; ok {
			if filteredAuthors[targetAuthor].Date > date {
				filteredAuthors[targetAuthor] = resultObject{targetAuthor, targetTitle, targetDate, targetLeftContext, targetRightContext, targetMatchContext, targetPhiloID, targetmodulename, passageID, authorIdent}
			} else if filteredAuthors[targetAuthor].Date == targetDate && len(filteredAuthors[targetAuthor].MatchContext) < len(targetMatchContext) {
				filteredAuthors[targetAuthor] = resultObject{targetAuthor, targetTitle, targetDate, targetLeftContext, targetRightContext, targetMatchContext, targetPhiloID, targetmodulename, passageID, authorIdent}
			}
		}
		if _, ok := filteredTitles[targetTitle]; !ok {
			filteredTitles[targetTitle] = resultObject{targetAuthor, targetTitle, targetDate, targetLeftContext, targetRightContext, targetMatchContext, targetPhiloID, targetmodulename, passageID, authorIdent}
		} else if filteredTitles[targetTitle].Date > targetDate {
			filteredTitles[targetTitle] = resultObject{targetAuthor, targetTitle, targetDate, targetLeftContext, targetRightContext, targetMatchContext, targetPhiloID, targetmodulename, passageID, authorIdent}
		}
	}
	var uniqueTitles []resultObject
	for _, value := range filteredTitles {
		uniqueTitles = append(uniqueTitles, value)
	}
	sort.Sort(resultObjectDate(uniqueTitles))
	var uniqueAuthors dateGroup
	var resultMap = make(map[int32][]resultObject, 1)
	for _, value := range filteredAuthors {
		if _, ok := resultMap[value.Date]; !ok {
			resultMap[value.Date] = []resultObject{value}
		} else {
			resultMap[value.Date] = append(resultMap[value.Date], value)
		}
	}
	for key, value := range resultMap {
		uniqueAuthors = append(uniqueAuthors, groupedByDate{key, value})
	}
	sort.Sort(uniqueAuthors)
	fullResults := results{uniqueTitles, uniqueAuthors}
	c.JSON(200, fullResults)
}

func buildFullTextCondition(param string, value string) (paramValue string) {
	for operator, symbol := range queryOperatorSlice {
		value = strings.Replace(value, operator, symbol, -1)
	}
	value = strings.Replace(value, "(", "", -1)
	value = strings.Replace(value, ")", "", -1)
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
						if strings.HasPrefix(value, `"`) {
							paramValue = fmt.Sprintf("%s=%s", param, value)
						} else {
							paramValue = buildFullTextCondition(param, value)
						}
					} else {
						value = strings.Replace(value, `"`, "", -1)
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

func fullTextQuery(c *gin.Context) {
	queryStringMap, _ := url.ParseQuery(c.Request.URL.RawQuery)
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
	query := "SELECT sourceauthor, sourcetitle, sourcedate, sourceleftcontext, sourcematchcontext, sourcerightcontext, sourcephiloid, sourcemodulename, targetauthor, targettitle, targetdate, targetleftcontext, targetmatchcontext, targetrightcontext, targetphiloid, targetmodulename, passageident, passageidentcount, authorident FROM " + dbname + " WHERE "
	sorting := strings.Join(sortKeyMap[queryStringMap["sorting"][0]], ", ")
	query += buildQuery(queryStringMap, duplicatesID)
	var err error
	var rows *sql.Rows
	if !continued {
		if queryStringMap["sorting"][0] == "-1" {
			query += " LIMIT 40"
		} else {
			query += fmt.Sprintf(" ORDER BY %s LIMIT 40", sorting)
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
		// var emptyResults []fullTextResultObject
		c.Error(err)
		// c.JSON(200, fullTextResults{emptyResults})
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
		var targetmodulename string
		var passageID int32
		var passageIDCount int32
		var authorIdent string
		err := rows.Scan(&author, &title, &date, &leftContext, &matchContext, &rightContext, &philoID, &databaseName, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetphiloID, &targetmodulename, &passageID, &passageIDCount, &authorIdent)
		if err != nil {
			// var emptyResults []fullTextResultObject
			c.Error(err)
			// c.JSON(200, fullTextResults{emptyResults})
		}
		author = strings.Replace(author, "<fs/>", "; ", -1)
		title = strings.Replace(title, "<fs/>", "; ", -1)
		targetAuthor = strings.Replace(targetAuthor, "<fs/>", "; ", -1)
		targetTitle = strings.Replace(targetTitle, "<fs/>", "; ", -1)
		sourceResults := fullTextResultObject{&author, &title, &date, &leftContext, &matchContext, &rightContext, &philoID, &databaseName, &targetAuthor, &targetTitle, &targetDate, &targetLeftContext, &targetMatchContext, &targetRightContext, &targetphiloID, &targetmodulename, &passageID, &passageIDCount, &authorIdent}
		results.FullTextList = append(results.FullTextList, sourceResults)
	}

	if len(results.FullTextList) == 0 {
		var emptyResults []fullTextResultObject
		c.JSON(200, fullTextResults{emptyResults})
	} else {
		c.JSON(200, results)
	}
}

func fulltextCount(c *gin.Context) {
	queryStringMap, _ := url.ParseQuery(c.Request.URL.RawQuery)
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
		c.JSON(200, resultCount{totalCount})
	}
	result := resultCount{totalCount}
	c.JSON(200, result)
}

func fulltextFacet(c *gin.Context) {
	queryStringMap, _ := url.ParseQuery(c.Request.URL.RawQuery)
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
		c.JSON(200, fullTextResults{emptyResults})
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
	c.JSON(200, results)
}

func exportConfig(c *gin.Context) {
	c.JSON(200, webConfig)
}

func index(c *gin.Context) {
	if webConfig.Debug {
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
	}
	dbname := c.Param("dbname")
	if dbname == "" {
		dbname = "ecco"
	}
	c.HTML(http.StatusOK, "index.html", gin.H{
		"title":      "Commonplace Cultures",
		"dbSelected": dbname,
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

	// Set-up log file
	outputFile := "app.log"
	f, _ := os.Create(outputFile)
	defer f.Close()
	gin.DefaultWriter = f

	router := gin.Default()
	router.Use(gzip.Gzip(gzip.BestSpeed))

	// Static files
	router.Static("public", "./public")
	router.Static("components", "./public/components")
	router.Static("css", "./public/css")
	router.Static("img", "./public/img")
	router.LoadHTMLFiles("public/index.html")

	// Routes
	router.GET("/", index)
	mainNav := router.Group("/nav/")
	mainNav.GET("/:dbname", index)
	mainNav.GET("/:dbname/passage/:passageID", index)
	mainNav.GET("/:dbname/query/search", index)
	mainNav.GET("/:dbname/topic/:topicID", index)
	mainNav.GET("/:dbname/commonplace/search", index)

	// API calls
	api := router.Group("/api/")
	api.GET("/:dbname/commonplaces/:passageID", findCommonPlaces)
	api.GET("/:dbname/fulltext", fullTextQuery)
	api.GET("/:dbname/fulltextcount", fulltextCount)
	api.GET("/:dbname/fulltextfacet", fulltextFacet)

	// Export config
	router.GET("/config/config.json", exportConfig)

	router.Run(":" + webConfig.Port)
}
