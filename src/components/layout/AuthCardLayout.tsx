import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardLayoutProps = {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthCardLayout({
  title,
  children,
  footer,
  className,
}: AuthCardLayoutProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-app-canvas p-4 text-left">
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="space-y-2 border-b text-left">
          <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Salary Manager
          </p>
          <CardTitle className="text-base font-medium text-muted-foreground">
            <h1 className="text-base font-medium">{title}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? <CardFooter className="border-t">{footer}</CardFooter> : null}
      </Card>
    </div>
  );
}
