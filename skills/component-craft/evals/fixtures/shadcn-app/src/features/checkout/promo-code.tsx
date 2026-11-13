import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PromoCode({ onApply }: { onApply: (code: string) => void }) {
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(new FormData(event.currentTarget).get("code") as string);
      }}
    >
      <Input name="code" aria-label="Promo code" className="h-8 text-xs uppercase" maxLength={12} autoComplete="off" />
      <Button type="submit" className="h-8">
        Apply
      </Button>
    </form>
  );
}
