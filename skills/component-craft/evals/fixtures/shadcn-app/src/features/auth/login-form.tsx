import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Values = { email: string; password: string };

export function LoginForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const { register, handleSubmit, formState } = useForm<Values>({ mode: "onBlur" });
  const emailError = formState.errors.email?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        aria-invalid={emailError ? true : undefined}
        aria-describedby={emailError ? "email-error" : undefined}
        {...register("email", { required: "Enter your email" })}
      />
      {emailError ? (
        <p id="email-error" className="text-sm text-destructive">
          {emailError}
        </p>
      ) : null}
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" autoComplete="current-password" {...register("password", { required: true })} />
      <Button type="submit" variant="primary">
        Sign in
      </Button>
    </form>
  );
}
