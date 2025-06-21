
import { useState } from "react";
import { AuthForm } from "./AuthForm";
import { AuthHeader } from "./AuthHeader";

interface ModernAuthFormProps {
  onSuccess: () => void;
}

export function ModernAuthForm({ onSuccess }: ModernAuthFormProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <AuthHeader />
          <AuthForm onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}
