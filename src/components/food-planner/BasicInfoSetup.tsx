
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Calendar, Weight, Ruler, Activity } from "lucide-react";

interface BasicInfoSetupProps {
  user: any;
  onComplete: () => void;
}

export function BasicInfoSetup({ user, onComplete }: BasicInfoSetupProps) {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
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
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sikeres mentés! ✅",
        description: "Az alapadataid sikeresen elmentve!",
      });

      onComplete();
    } catch (error) {
      console.error('Alapadatok mentési hiba:', error);
      toast({
        title: "Mentési hiba",
        description: "Nem sikerült elmenteni az adatokat. Próbáld újra!",
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
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Alapadatok megadása
            </CardTitle>
            <p className="text-gray-600">
              Add meg az alapadataidat a személyre szabott javaslatok érdekében
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                  Életkor (év)
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    min="16"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                  Testsúly (kg)
                </Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    min="30"
                    max="300"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                  Magasság (cm)
                </Label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    min="120"
                    max="250"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity" className="text-sm font-medium text-gray-700">
                  Aktivitási szint
                </Label>
                <div className="relative">
                  <Activity className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                  <Select value={activityLevel} onValueChange={setActivityLevel}>
                    <SelectTrigger className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Válassz aktivitási szintet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Ülő életmód (kevés mozgás)</SelectItem>
                      <SelectItem value="lightly_active">Enyhén aktív (1-3 nap/hét)</SelectItem>
                      <SelectItem value="moderately_active">Mérsékelten aktív (3-5 nap/hét)</SelectItem>
                      <SelectItem value="very_active">Nagyon aktív (6-7 nap/hét)</SelectItem>
                      <SelectItem value="extremely_active">Rendkívül aktív (2x naponta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isLoading || !age || !weight || !height || !activityLevel}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {isLoading ? "Mentés..." : "Folytatás"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
