"use client";

import { Marquee } from "@workspace/ui/components/shared/marquee";

type BrandList = {
  image: string;
  lightimg: string;
  name: string;
};

const LogoCloud = ({ brandList }: { brandList: BrandList[] }) => {
  return (
    <div className="lg:py-20 sm:py-16 py-8 relative overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s] p-0">
        {brandList.map((brand, index) => (
          <div key={index}>
            {brand.image ? (
              <>
                <img
                  src={brand.image}
                  alt={brand.name}
                  className="w-36 h-8 mr-6 lg:mr-20 dark:hidden"
                />
                <img
                  src={brand.lightimg}
                  alt={brand.name}
                  className="hidden dark:block w-36 h-8 mr-12 lg:mr-20"
                />
              </>
            ) : (
              <div className="w-36 h-8 mr-6 lg:mr-20 flex items-center justify-center text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                {brand.name}
              </div>
            )}
          </div>
        ))}
      </Marquee>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
};

export { LogoCloud };
export default LogoCloud;
