import React from "react";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/career";

interface RoleDetailsProps {
  selectedRole: Role | null;
  roles: Role[];
  onRoleSelect: (role: Role) => void;
}

const RoleDetails: React.FC<RoleDetailsProps> = ({
  selectedRole,
  roles,
  onRoleSelect,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recommended Roles</h3>
        <div className="space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`p-3 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${selectedRole?.id === role.id ? "bg-accent text-accent-foreground" : ""}`}
              onClick={() => onRoleSelect(role)}
            >
              <div className="font-medium">{role.title}</div>
              <div className="text-sm text-muted-foreground">
                {role.industry}
              </div>
              <div className="text-sm mt-1">
                Match Score:{" "}
                <span className="font-medium">{role.matchScore}/10</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedRole ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{selectedRole.title}</h3>
            <p>{selectedRole.description}</p>

            <div className="space-y-2">
              <div className="font-medium">Why This Fits:</div>
              <p className="text-sm">
                Your experience and skills align well with this role's
                requirements.
              </p>

              <div className="font-medium mt-2">Skill Gaps:</div>
              <p className="text-sm">
                Consider developing skills in advanced data analysis and project
                management.
              </p>

              <div className="font-medium mt-2">Salary Range:</div>
              <p className="text-sm">
                {selectedRole.averageSalary.currency}
                {selectedRole.averageSalary.min.toLocaleString()} -
                {selectedRole.averageSalary.currency}
                {selectedRole.averageSalary.max.toLocaleString()}
              </p>

              <div className="font-medium mt-2">Growth Potential:</div>
              <p className="text-sm">
                {selectedRole.growthPotential}% projected industry growth
              </p>
            </div>

            <div className="mt-4">
              <h4 className="font-medium">Quick Apply:</h4>
              <div className="flex space-x-2 mt-2">
                <Button variant="outline" size="sm">
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm">
                  Indeed
                </Button>
                <Button variant="outline" size="sm">
                  Glassdoor
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Select a role to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleDetails;
