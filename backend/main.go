package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// In-memory data stores (replace with DB later)
var weightEntries = make(map[string]float64)           // date string -> weight
var mealEntries = make(map[string][]MealEntry)         // date string -> list of meals

type WeightRequest struct {
	Weight float64 `json:"weight"`
}

type MealRequest struct {
	Name               string  `json:"name"`
	ProteinPerServing  float64 `json:"protein_per_serving"`
	CarbsPerServing    float64 `json:"carbs_per_serving"`
	FatPerServing      float64 `json:"fat_per_serving"`
	CaloriesPerServing float64 `json:"calories_per_serving"`
	Servings           float64 `json:"servings"`
}

type MealEntry struct {
	Name     string  `json:"name"`
	Protein  float64 `json:"protein"`
	Carbs    float64 `json:"carbs"`
	Fat      float64 `json:"fat"`
	Calories float64 `json:"calories"`
	Servings float64 `json:"servings"`
}

func today() string {
	return time.Now().Format("2006-01-02")
}

func main() {
	r := gin.Default()

	// Log weight for today
	r.POST("/weight", func(c *gin.Context) {
		var req WeightRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
			return
		}
		weightEntries[today()] = req.Weight
		c.JSON(http.StatusOK, gin.H{"date": today(), "weight": req.Weight})
	})

	// Log a meal for today (calculation done here!)
	r.POST("/meals", func(c *gin.Context) {
		var req MealRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
			return
		}
		meal := MealEntry{
			Name:     req.Name,
			Protein:  req.ProteinPerServing * req.Servings,
			Carbs:    req.CarbsPerServing * req.Servings,
			Fat:      req.FatPerServing * req.Servings,
			Calories: req.CaloriesPerServing * req.Servings,
			Servings: req.Servings,
		}
		mealEntries[today()] = append(mealEntries[today()], meal)
		c.JSON(http.StatusOK, meal)
	})

	// Get all today's meals & summed totals
	r.GET("/meals/today", func(c *gin.Context) {
		meals := mealEntries[today()]
		var totalProtein, totalCarbs, totalFat, totalCalories float64
		for _, m := range meals {
			totalProtein += m.Protein
			totalCarbs += m.Carbs
			totalFat += m.Fat
			totalCalories += m.Calories
		}
		c.JSON(http.StatusOK, gin.H{
			"meals":         meals,
			"total_protein": totalProtein,
			"total_carbs":   totalCarbs,
			"total_fat":     totalFat,
			"total_calories": totalCalories,
		})
	})

	// Get today's weight
	r.GET("/weight/today", func(c *gin.Context) {
		weight, ok := weightEntries[today()]
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "No weight entry for today"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"date": today(), "weight": weight})
	})

	r.Run() // listen and serve on 0.0.0.0:8080
}
