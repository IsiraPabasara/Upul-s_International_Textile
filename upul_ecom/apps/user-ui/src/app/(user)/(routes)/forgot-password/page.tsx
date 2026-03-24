'use client'
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type FormData = {
    email: string;
    password: string;
}

const ForgotPassword = () => {
    const [step, setStep] = useState<"email" | "otp" | "reset">("email");
    const [serverError, setServerError] = useState<string | null>(null);
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null); // Track focus
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [canResend, setCanResend] = useState(true);
    const [timer, setTimer] = useState(60);
    const [passwordVisible, setPasswordVisible] = useState(false);
    
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!canResend && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [canResend, timer]);

    const requestOtpMutation = useMutation({
        mutationFn: async ({ email }: { email: string }) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/forgot-password-user`, { email });
            return response.data;
        },
        onSuccess: (_, { email }) => {
            setUserEmail(email);
            setStep("otp");
            setServerError(null);
            setCanResend(false);
            setTimer(60);
        },
        onError: (error: AxiosError) => {
            setServerError((error.response?.data as any)?.message || "Failed to send OTP.");
        }
    });

    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/verify-forgot-password-user`, { email: userEmail, otp: otp.join("") });
            return response.data;
        },
        onSuccess: () => {
            setStep("reset");
            setServerError(null);
        },
        onError: () => setServerError("Invalid OTP. Please try again.")
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async ({ password }: { password: string }) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/reset-password-user`, { email: userEmail, newPassword: password });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Password reset successfully!");
            router.push("/login");
        },
        onError: () => setServerError("Could not reset password.")
    });

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 3) inputRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className='w-full min-h-[70vh] bg-white flex flex-col items-center justify-center font-sans py-20'>
            <div className='w-full max-w-[450px] px-8'>

                {step === "email" && (
                    <>
                        <div className="mb-14 text-center">
                            <h2 className='text-2xl tracking-[0.4em] uppercase mb-6 text-black font-semibold'>Reset</h2>
                            <p className='text-[13px] text-black/60 tracking-wide font-medium'>Enter your email to receive a reset code:</p>
                        </div>
                        <form onSubmit={handleSubmit((data) => requestOtpMutation.mutate({ email: data.email }))}>
                            <input type='email' placeholder='E-mail'
                                className={`w-full p-4 border outline-none text-sm placeholder:text-black/40 transition-colors font-medium mb-2 ${errors.email ? 'border-red-500' : 'border-black focus:border-black'}`}
                                {...register("email", { required: "Email is required" })}
                            />
                            {errors.email && <p className='text-red-500 text-[10px] font-bold uppercase tracking-widest'>{String(errors.email.message)}</p>}
                            
                            <button type='submit' disabled={requestOtpMutation.isPending}
                                className="relative w-full py-4 mt-10 text-xs tracking-[0.3em] uppercase font-black text-white border-2 border-black overflow-hidden group transition-colors duration-500 bg-black hover:text-black">
                                <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                                <span className="relative z-10">{requestOtpMutation.isPending ? "Sending..." : "Send Code"}</span>
                            </button>
                        </form>
                    </>
                )}

                {step === "otp" && (
                    <div className="text-center">
                        <div className="mb-14">
                            <h2 className='text-2xl tracking-[0.4em] uppercase mb-6 text-black font-semibold'>Verify</h2>
                            <p className='text-[13px] text-black/60 tracking-wide font-medium'>Enter the 4-digit code sent to your email.</p>
                        </div>
                        <div className='flex justify-center gap-4 mb-10'>
                            {otp.map((digit, index) => (
                                <input 
                                    key={index} 
                                    type='text' 
                                    ref={(el) => { if (el) inputRefs.current[index] = el; }}
                                    maxLength={1} 
                                    value={digit}
                                    onFocus={() => setFocusedIndex(index)}
                                    onBlur={() => setFocusedIndex(null)}
                                    className={`w-14 h-14 text-center border outline-none text-lg font-bold transition-all duration-200 
                                        ${focusedIndex === index 
                                            ? 'border-black border-2 scale-105 shadow-sm' 
                                            : 'border-black/20 text-black/60'
                                        } 
                                        ${digit && focusedIndex !== index ? 'border-black/40' : ''}`}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                />
                            ))}
                        </div>
                        <button onClick={() => verifyOtpMutation.mutate()} disabled={verifyOtpMutation.isPending}
                            className="relative w-full py-4 text-xs tracking-[0.3em] uppercase font-black text-white border-2 border-black overflow-hidden group transition-colors duration-500 bg-black hover:text-black">
                            <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                            <span className="relative z-10">{verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}</span>
                        </button>
                        <div className='mt-10'>
                            {canResend ? (
                                <button onClick={() => requestOtpMutation.mutate({ email: userEmail! })} className='text-[11px] text-black font-bold uppercase tracking-widest underline underline-offset-4'>Resend Code</button>
                            ) : (
                                <p className='text-[11px] text-black/40 uppercase tracking-widest font-bold'>Resend in {timer}s</p>
                            )}
                        </div>
                    </div>
                )}

                {step === "reset" && (
                    <>
                        <div className="mb-14 text-center">
                            <h2 className='text-2xl tracking-[0.4em] uppercase mb-6 text-black font-semibold'>New Password</h2>
                            <p className='text-[13px] text-black/60 tracking-wide font-medium'>Set your new account password:</p>
                        </div>
                        <form onSubmit={handleSubmit((data) => resetPasswordMutation.mutate({ password: data.password }))}>
                            <div className="relative mb-2">
                                <input type={passwordVisible ? "text" : "password"} placeholder='New Password'
                                    className={`w-full p-4 border outline-none text-sm placeholder:text-black/40 transition-colors font-medium ${errors.password ? 'border-red-500' : 'border-black focus:border-black'}`}
                                    {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 characters" } })}
                                />
                                <button type='button' onClick={() => setPasswordVisible(!passwordVisible)} className='absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors'>
                                    {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className='text-red-500 text-[10px] font-bold uppercase tracking-widest'>{String(errors.password.message)}</p>}
                            
                            <button type='submit' disabled={resetPasswordMutation.isPending}
                                className="relative w-full py-4 mt-10 text-xs tracking-[0.3em] uppercase font-black text-white border-2 border-black overflow-hidden group transition-colors duration-500 bg-black hover:text-black">
                                <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                                <span className="relative z-10">{resetPasswordMutation.isPending ? "Updating..." : "Update Password"}</span>
                            </button>
                        </form>
                    </>
                )}

                <div className="mt-8 text-center space-y-4">
                    {serverError && (
                        <div className="p-3 border border-red-500 bg-red-50">
                            <p className='text-red-600 text-[11px] font-black uppercase tracking-widest'>{serverError}</p>
                        </div>
                    )}
                    <Link href="/login" className='block text-[11px] text-black font-bold uppercase tracking-widest hover:text-black/50 transition-colors underline underline-offset-4 decoration-black'>
                        ← Back to Login
                    </Link>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    input {
                        font-size: 16px !important;
                    }
                }
            `}</style>
        </div>
    )
}

export default ForgotPassword;