import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CareerPathway } from "@/types/career";
import { ArrowUpRight, Clock, DollarSign, AlertTriangle } from "lucide-react";

interface ComparisonMatrixProps {
  pathways: CareerPathway[];
  selectedPathwayId: string | null;
  onPathwaySelect: (pathwayId: string) => void;
}

const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  pathways,
  selectedPathwayId,
  onPathwaySelect,
}) => {
  if (!pathways || pathways.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <span>Pathway Comparison</span>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full ml-2"></div>
      </h3>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableCaption className="text-gray-500 italic">
            Compare different career pathway options and select the best fit for
            your goals
          </TableCaption>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[200px] font-semibold text-gray-700">
                Pathway Type
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Description
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Time Required
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Salary Change
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Risk Level
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pathways.map((pathway) => (
              <TableRow
                key={pathway.id}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedPathwayId === pathway.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                onClick={() => onPathwaySelect(pathway.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: pathway.color }}
                    />
                    <span className="font-semibold text-gray-800">
                      {pathway.type.charAt(0).toUpperCase() +
                        pathway.type.slice(1)}{" "}
                      Move
                    </span>
                    {selectedPathwayId === pathway.id && (
                      <ArrowUpRight className="h-4 w-4 text-blue-500 ml-1" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">
                  {pathway.description}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      {pathway.timeRequired}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 font-medium">
                      {pathway.salaryChangeRange}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-gray-500" />
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(pathway.riskLevel)}`}
                    >
                      {pathway.riskLevel}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end mt-2">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-100"></div>
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-100"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-100"></div>
            <span>High Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get badge color based on risk level
function getRiskBadgeColor(riskLevel: string): string {
  switch (riskLevel) {
    case "Low":
      return "bg-green-100 text-green-800 border border-green-200";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "High":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
}

export default ComparisonMatrix;
