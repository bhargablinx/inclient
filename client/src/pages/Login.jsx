import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import Loading from "@/components/Loading";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/features/auth/authThunk";

export default function Login() {
    const { register, handleSubmit } = useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { loading, error } = useSelector((state) => state.auth);

    const onSubmit = async (formData) => {
        const result = await dispatch(loginUser(formData));
        if (loginUser.fulfilled.match(result)) {
            // Honour the ?redirect= param set by InvitationResponse for unauthenticated users.
            const redirectTo = searchParams.get("redirect") || "/dashboard";
            navigate(redirectTo, { replace: true });
        }
    };

    if (loading) return <Loading />;

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            </div>

            <div
                className="
                    w-full
                    max-w-md
                    rounded-3xl
                    border
                    bg-card/70
                    p-8
                    shadow-xl
                    backdrop-blur-xl
                    animate-in
                    fade-in
                    zoom-in-95
                    duration-500
                "
            >
                {/* Logo */}
                <div className="mb-8 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <span className="text-xl font-bold">I</span>
                    </div>
                </div>

                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome Back
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Sign in to continue managing your invoices
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-8 space-y-5"
                >
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>

                        <Input
                            {...register("email", { required: true })}
                            type="email"
                            placeholder="you@example.com"
                            className="h-11 transition-all duration-200 focus-visible:ring-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>

                        <Input
                            {...register("password", { required: true })}
                            type="password"
                            placeholder="••••••••"
                            className="h-11 transition-all duration-200 focus-visible:ring-2"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center">
                            {error}
                        </p>
                    )}

                    <Button
                        size="lg"
                        className="
                            w-full
                            shadow-lg
                            shadow-primary/20
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:shadow-xl
                        "
                    >
                        Sign In
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                        to="/signup"
                        className="font-medium text-primary hover:underline"
                    >
                        Create Account
                    </Link>
                </p>
            </div>
        </main>
    );
}
