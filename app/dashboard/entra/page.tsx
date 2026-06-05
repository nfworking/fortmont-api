import {UserInfoCards} from "@/components/entra/cards";
import {GroupInfoCards} from "@/components/entra/groups";
import {ChartAreaInteractive} from "@/components/entra/chart";


export default function EntraPage() {
  return (
    <div className="p-4 col-auto flex flex-row gap-4 md:p-8">
      <UserInfoCards />
        <GroupInfoCards />
    </div>
  );
}