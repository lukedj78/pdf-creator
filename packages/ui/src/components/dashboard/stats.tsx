import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight01Icon, Calendar01Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@workspace/ui/lib/utils";

type DashboardMetric = {
  label: string;
  value: string;
  percentage: string;
  isPositive?: boolean;
};

type MainDashboardData = {
  title: string;
  description: string;
  metrics: DashboardMetric[];
};

type StatItem = {
  title: string;
  value: string;
  percentage: string;
  icon: IconSvgElement;
  isPositive?: boolean;
};

type StatisticsProps = {
  mainDashboard?: MainDashboardData;
  secondaryStats?: StatItem[];
};

const mainDashboardData: MainDashboardData = {
  title: "Analytics Dashboard",
  description: "Check all the statistics",
  metrics: [
    { label: "Earnings", value: "$27,850", percentage: "+18%", isPositive: true },
    { label: "Expense", value: "$18,453", percentage: "-5%", isPositive: false },
  ],
};

const secondaryStatsData: StatItem[] = [
  { title: "Weekly Sales", value: "$4,587", percentage: "+18%", icon: Calendar01Icon, isPositive: true },
  { title: "Purchase Orders", value: "230", percentage: "+18%", icon: ShoppingBag01Icon, isPositive: true },
];

export function Statistics({
  mainDashboard = mainDashboardData,
  secondaryStats = secondaryStatsData,
}: StatisticsProps) {
  return (
    <div className="lg:py-20 sm:py-16 py-8 w-full">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 xl:px-16 w-full">
        <div className="grid grid-cols-12 gap-6 h-full">
          <div className="col-span-12 xl:col-span-6 h-full shadow-xs">
            <Card className="p-0 ring-0 border rounded-xl relative h-full">
              <CardContent className="p-0">
                <div className="ps-6 py-4 flex flex-col gap-9 justify-between">
                  <div>
                    <p className="text-lg font-medium text-card-foreground">{mainDashboard.title}</p>
                    <p className="text-xs font-normal text-muted-foreground">{mainDashboard.description}</p>
                  </div>
                  <div className="flex flex-wrap xs:flex-nowrap gap-6">
                    {mainDashboard.metrics.map((metric, index) => (
                      <div key={index} className="flex items-center gap-6 w-full sm:w-auto">
                        <div>
                          <p className="text-xs font-normal text-muted-foreground">{metric.label}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-2xl font-medium text-card-foreground">{metric.value}</p>
                            <Badge className={cn("font-normal text-muted-foreground", metric.isPositive ? "bg-teal-400/10" : "bg-red-500/10")}>
                              {metric.percentage}
                            </Badge>
                          </div>
                        </div>
                        {index < mainDashboard.metrics.length - 1 && (
                          <Separator orientation="vertical" className="h-12 hidden sm:block" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <img
                  src="https://images.shadcnspace.com/assets/backgrounds/stats-01.webp"
                  alt="user-img"
                  width={211}
                  height={168}
                  className="absolute bottom-0 right-0 hidden sm:block"
                />
              </CardContent>
            </Card>
          </div>
          {secondaryStats.map((stat, index) => (
            <div key={index} className="col-span-12 sm:col-span-6 xl:col-span-3">
              <Card className="p-6 ring-0 border rounded-xl shadow-xs">
                <CardContent className="p-0 flex items-start justify-between">
                  <div className="flex flex-col gap-5 justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-medium text-card-foreground">{stat.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-medium text-card-foreground">{stat.value}</p>
                        <Badge className={cn("font-normal text-muted-foreground", stat.isPositive !== false ? "bg-teal-400/10" : "bg-red-500/10")}>
                          {stat.percentage}
                        </Badge>
                      </div>
                    </div>
                    <Button variant={"outline"} className="flex items-center gap-1.5 w-fit rounded-lg px-4 h-9 shadow-xs cursor-pointer">
                      <span>See Report</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                    </Button>
                  </div>
                  <div className="p-3 rounded-full outline">
                    <HugeiconsIcon icon={stat.icon} size={20} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Statistics;
