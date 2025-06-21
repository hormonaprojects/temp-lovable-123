
import { supabase } from "@/integrations/supabase/client";

interface SetupHeaderProps {
  title: string;
  subtitle: string;
}

export function SetupHeader({ title, subtitle }: SetupHeaderProps) {
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
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl bg-white/20 p-3 backdrop-blur-sm shadow-lg border border-white/30"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
        {title}
      </h1>
      <p className="text-white/80 text-sm sm:text-base">
        {subtitle}
      </p>
    </div>
  );
}
