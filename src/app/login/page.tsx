import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome back"
            description="Click the button below to log in or sign up."
        >
            <div className="space-y-4">
                <Button asChild className="w-full">
                    <Link href="/api/auth/login">Login / SignUp</Link>
                </Button>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="underline">
                    Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                    Privacy Policy
                </Link>
                .
            </p>
        </AuthLayout>
    );
}
