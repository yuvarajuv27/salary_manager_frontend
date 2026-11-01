import { AuthCardLayout } from "@/components/layout/AuthCardLayout";

export default function OnboardingPage() {
  return (
    <AuthCardLayout title="Onboarding">
      <p className="text-sm text-muted-foreground">
        Create your first entity in the next milestone.
      </p>
    </AuthCardLayout>
  );
}
