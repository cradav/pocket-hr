import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardCardProps {
  title: string;
  description: string;
  content: string;
  buttonText: string;
  onClick: () => void;
}

const DashboardCard = ({
  title,
  description,
  content,
  buttonText,
  onClick,
}: DashboardCardProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <p className="text-sm text-muted-foreground mb-4 flex-grow">
          {content}
        </p>
        <Button onClick={onClick}>{buttonText}</Button>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
