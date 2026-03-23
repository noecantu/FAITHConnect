import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface LoginAccessSectionProps {
  hasUserAccount: boolean;
  email?: string;
  onEmailChange: (value: string) => void;
  onCreateLogin: () => void;
  onSendReset: () => void;
  isLoading: boolean;
}

export function LoginAccessSection({
  hasUserAccount,
  email,
  onEmailChange,
  onCreateLogin,
  onSendReset,
  isLoading
}: LoginAccessSectionProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Login Access</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasUserAccount && (
          <>
            <div className="space-y-2">
              <Label>Email for Login</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="member@example.com"
                disabled={isLoading}
              />
            </div>

            <Button
              className="w-full"
              onClick={onCreateLogin}
              disabled={isLoading || !email}
            >
              {isLoading ? "Creating..." : "Create Login"}
            </Button>
          </>
        )}

        {hasUserAccount && (
          <>
            <p className="text-sm text-muted-foreground">
              This member already has a login.
            </p>

            <Button
              variant="secondary"
              className="w-full"
              onClick={onSendReset}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Password Reset Email"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
