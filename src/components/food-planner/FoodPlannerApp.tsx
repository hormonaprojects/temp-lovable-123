
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Utensils } from "lucide-react";
import { MealPlanGenerator } from "./MealPlanGenerator";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface FoodPlannerAppProps {
  user: User;
  onLogout: () => void;
}

export function FoodPlannerApp({ user, onLogout }: FoodPlannerAppProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Utensils className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Ételtervező Alkalmazás</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.fullName}</span>
                <Badge variant="secondary" className="text-xs">
                  {user.email}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Kijelentkezés
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">
                Üdvözöljük, {user.fullName}!
              </CardTitle>
              <CardDescription>
                Készítsen személyre szabott éttervet az alábbi eszközzel
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <MealPlanGenerator user={user} />
      </main>
    </div>
  );
}
