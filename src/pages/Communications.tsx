import React from "react";
import { MessagesSquare } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { CommunicationsHub } from "../components/CommunicationsHub";

export function Communications() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader
        icon={MessagesSquare}
        title="Communications Hub"
        subtitle="Message every contractor on active and scheduled work, in one place."
      />
      <CommunicationsHub scope="all" />
    </div>
  );
}
