
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Scale, Ruler, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/services/profileQueries";

interface PersonalInfoSetupProps {
  userId: string;
  onComplete: () => void;
}

export function PersonalInfoSetup({ userId, onComplete }: PersonalInfoSetupProps) {
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
        description: "Kérjük, töltsd ki az összes mezőt.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile(userId, {
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseInt(height),
        activity_level: activityLevel,
      });

      toast({
        title: "Személyes adatok mentve! ✅",
        description: "Most beállíthatod az ételpreferenciáidat.",
      });

      onComplete();
    } catch (error) {
      console.error("Személyes adatok mentési hiba:", error);
      toast({
        title: "Mentési hiba",
        description: "Hiba történt az adatok mentésekor. Próbáld újra!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activityLevels = [
    { value: "sedentary", label: "Ülő életmód (kevés vagy semmilyen testmozgás)" },
    { value: "lightly_active", label: "Enyhén aktív (könnyű testmozgás/sport 1-3 nap/hét)" },
    { value: "moderately_active", label: "Mérsékelten aktív (mérsékelt testmozgás/sport 3-5 nap/hét)" },
    { value: "very_active", label: "Nagyon aktív (intenzív testmozgás/sport 6-7 nap/hét)" },
    { value: "extra_active", label: "Extra aktív (nagyon intenzív testmozgás & fizikai munka)" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Személyes adatok
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Adj meg néhány alapvető adatot a pontosabb javaslatok érdekében
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Életkor (év)
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  min="1"
                  max="120"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Súly (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  min="1"
                  max="500"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
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
                  max="300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-level" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Aktivitási szint
                </Label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                    <SelectValue placeholder="Válassz aktivitási szintet" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !age || !weight || !height || !activityLevel}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {isLoading ? "Mentés..." : "Tovább az ételpreferenciákhoz"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
