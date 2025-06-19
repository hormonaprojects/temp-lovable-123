
import React, { useState, useEffect } from 'react';
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings } from "lucide-react";
import { UserProfilePage } from "@/components/food-planner/UserProfilePage";
import { fetchDailyMeals } from "@/services/dailyMealQueries";
import { fetchAllRecipes } from "@/services/recipeQueries";
import { DailyMeal, Recipe } from "@/types";
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

interface FoodPlannerAppProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  onLogout: () => void;
}

export function FoodPlannerApp({ user, onLogout }: FoodPlannerAppProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyMeals, setDailyMeals] = useState<DailyMeal[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { toast } = useToast();

  const formattedDate = format(selectedDate, 'yyyy-MM-dd', { locale: hu });
  const displayDate = format(selectedDate, 'yyyy. MMMM dd.', { locale: hu });

  const handleShowProfile = () => {
    setShowUserProfile(true);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch daily meals for the selected date
        const meals = await fetchDailyMeals(user.id, formattedDate);
        setDailyMeals(meals);

        // Fetch all recipes
        const allRecipes = await fetchAllRecipes();
        setRecipes(allRecipes);
      } catch (e: any) {
        console.error("Error loading data:", e);
        setError(e.message || "Failed to load data");
        toast({
          title: "Hiba történt",
          description: "Nem sikerült betölteni az adatokat.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate, user.id, toast, formattedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDatePickerOpen(false);
    }
  };

  // Profile page view
  if (showUserProfile) {
    return (
      <UserProfilePage
        user={user}
        onClose={() => setShowUserProfile(false)}
        onLogout={onLogout}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src="" alt="Profilkép" />
              <AvatarFallback>{user.fullName.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="text-white">
              <h1 className="text-xl font-bold">{user.fullName}</h1>
              <p className="text-sm opacity-80">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleShowProfile} variant="outline" size="sm" className="text-white border-white/50 bg-white/20 hover:bg-white/30 backdrop-blur-sm">
              <Settings className="w-4 h-4 mr-2" />
              Profil
            </Button>
            <Button onClick={onLogout} variant="outline" size="sm" className="text-white border-white/50 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm">Kijelentkezés</Button>
          </div>
        </div>
      </div>

      {/* Date Picker */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={
                "w-[300px] justify-start text-left font-normal bg-white/80 backdrop-blur-sm text-black hover:bg-white/90" +
                (isDatePickerOpen ? " ring-2 ring-purple-500" : "")
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>{displayDate}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 mt-2" align="start" side="bottom">
            <DayPicker
              mode="single"
              locale={hu}
              selected={selectedDate}
              onSelect={handleDateSelect}
              defaultMonth={selectedDate}
              className="border rounded-md shadow-sm"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle>Napi étrend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Betöltés...</p>
            ) : error ? (
              <p>Hiba: {error}</p>
            ) : (
              <div>
                {dailyMeals.length === 0 ? (
                  <p>Nincs étel ehhez a naphoz.</p>
                ) : (
                  <ul>
                    {dailyMeals.map((meal) => (
                      <li key={meal.id}>
                        {meal.recipe_name} - {meal.meal_type}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
