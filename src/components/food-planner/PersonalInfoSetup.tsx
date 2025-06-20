
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, User } from "lucide-react";

interface PersonalInfoSetupProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  onComplete: () => void;
}

export function PersonalInfoSetup({ user, onComplete }: PersonalInfoSetupProps) {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!age || !weight || !height || !activityLevel) {
      toast({
        title: "Hiányzó adatok",
        description: "Kérlek töltsd ki az összes mezőt!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          age: parseInt(age),
          weight: parseFloat(weight),
          height: parseFloat(height),
          activity_level: activityLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profil frissítési hiba:', error);
        toast({
          title: "Hiba",
          description: "Nem sikerült menteni az adatokat. Próbáld újra!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sikeres mentés! 🎉",
          description: "Személyes adatok sikeresen mentve!",
        });
        onComplete();
      }
    } catch (error) {
      console.error('Személyes adatok mentési hiba:', error);
      toast({
        title: "Hiba",
        description: "Váratlan hiba történt. Próbáld újra!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Személyes adatok
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Add meg az adataidat a személyre szabott ételtervezéshez
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                  Életkor (év)
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    min="1"
                    max="120"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                  Testsúly (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  min="1"
                  max="300"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                  Magasság (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  min="1"
                  max="250"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity" className="text-sm font-medium text-gray-700">
                  Aktivitási szint
                </Label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                    <SelectValue placeholder="Válaszd ki az aktivitási szinted" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Ülő életmód (irodai munka)</SelectItem>
                    <SelectItem value="lightly_active">Enyhén aktív (heti 1-3 edzés)</SelectItem>
                    <SelectItem value="moderately_active">Mérsékelten aktív (heti 3-5 edzés)</SelectItem>
                    <SelectItem value="very_active">Nagyon aktív (heti 6-7 edzés)</SelectItem>
                    <SelectItem value="extremely_active">Extrém aktív (napi 2x edzés vagy fizikai munka)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !age || !weight || !height || !activityLevel}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {isLoading ? "Mentés..." : "Tovább az ételpreferenciákhoz"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
