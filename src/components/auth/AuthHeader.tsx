
import { supabase } from "@/integrations/supabase/client";

export function AuthHeader() {
  const getLogoUrl = () => {
    const { data } = supabase.storage.from('logo').getPublicUrl('hormona_logo.png');
    return data.publicUrl;
  };

  return (
    <div className="text-center mb-6 sm:mb-8">
      <div className="flex justify-center mb-4">
        <img 
          src={getLogoUrl()} 
          alt="Hormona Logo" 
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl bg-white/10 p-2 backdrop-blur-sm"
          onError={(e) => {
            // Fallback styling if logo fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Ételtervező
      </h1>
      <p className="text-white/80 text-sm sm:text-base">
        Egészséges étkezés tervezése személyre szabottan
      </p>
    </div>
  );
}
