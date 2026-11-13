import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ email, plan, action }: { email: string; plan: string; action: (data: FormData) => void }) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <Label htmlFor="name">Display name</Label>
      <div className="flex gap-2">
        <Input id="name" name="name" defaultValue="" maxLength={40} />
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
      <Label htmlFor="account-email">Email</Label>
      <Input id="account-email" name="email" value={email} readOnly />
      <Label htmlFor="plan">Plan</Label>
      <Input id="plan" value={plan} disabled />
    </form>
  );
}
