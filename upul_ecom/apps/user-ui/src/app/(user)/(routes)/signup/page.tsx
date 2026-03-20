'use client'
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import axios from 'axios'
import toast from 'react-hot-toast';

type FormData = {
    firstname: string;
    lastname: string;
    email: string;
    phonenumber: string; 
    password: string;
}

const Signup = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [canResend, setCanResend] = useState(true);
    const [timer, setTimer] = useState(60);
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null); // NEW: Track active box
    const [userData, setUserData] = useState<FormData | null>(null);
    
    const router = useRouter();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
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

    const signupMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/register`, data);
            return response.data;
        },
        onSuccess: (_, formData) => {
            setUserData(formData);
            setShowOtp(true);
            setCanResend(false);
            setTimer(60);
            setServerError(null);
            if (showOtp) {
                setSuccessMessage("OTP has been resent successfully.");
                setTimeout(() => setSuccessMessage(null), 5000);
            }
        },
        onError: (error: any) => {
            setServerError(error.response?.data?.message || "Something went wrong.");
        }
    });

    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            if (!userData) return;
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/verify-user`, {
                ...userData,
                otp: otp.join(""),
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Account verified successfully!");
            router.push("/login");
        },
        onError: (error: any) => {
            setServerError(error.response?.data?.message || "Invalid verification code.");
        }
    });

    const onSubmit = (data: FormData) => {
        setServerError(null);
        signupMutation.mutate(data);
    };

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
                
                <div className="mb-14 text-center">
                    <h2 className='text-2xl tracking-[0.4em] uppercase mb-6 text-black font-semibold'>
                        {showOtp ? "Verify" : "Signup"}
                    </h2>
                    <p className='text-[13px] text-black/60 tracking-wide font-medium'>
                        {showOtp ? "Enter the code sent to your email:" : "Create your account below:"}
                    </p>
                </div>

                {!showOtp ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <input type='text' placeholder='First Name'
                                    className={`w-full p-4 border outline-none text-sm placeholder:text-black/40 transition-colors font-medium ${errors.firstname ? 'border-red-500' : 'border-black focus:border-black'}`}
                                    {...register("firstname", { required: "Required" })}
                                />
                                {errors.firstname && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.firstname.message}</p>}
                            </div>
                            <div>
                                <input type='text' placeholder='Last Name'
                                    className={`w-full p-4 border outline-none text-sm placeholder:text-black/40 transition-colors font-medium ${errors.lastname ? 'border-red-500' : 'border-black focus:border-black'}`}
                                    {...register("lastname", { required: "Required" })}
                                />
                                {errors.lastname && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.lastname.message}</p>}
                            </div>
                        </div>

                        <div>
                            <input type='email' placeholder='E-mail'
                                className={`w-full p-4 border outline-none text-sm placeholder:text-black/40 transition-colors font-medium ${errors.email ? 'border-red-500' : 'border-black focus:border-black'}`}
                                {...register("email", { 
                                    required: "Email required",
                                    pattern: { value: /\S+@\S+\.\S+/, message: "Invalid format" }
                                })}
                            />
                            {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.email.message}</p>}
                        </div>

                        <div>
                            <input type='text' placeholder='Phone Number'
                                className={`w-full p-4 border outline-none text-sm placeholder:text-black/40 transition-colors font-medium ${errors.phonenumber ? 'border-red-500' : 'border-black focus:border-black'}`}
                                {...register("phonenumber", { required: "Phone required" })}
                            />
                            {errors.phonenumber && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.phonenumber.message}</p>}
                        </div>

                        <div>
                            <div className="relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    placeholder='Password'
                                    className={`w-full p-4 border outline-none text-sm placeholder:text-black/40 transition-colors font-medium ${errors.password ? 'border-red-500' : 'border-black focus:border-black'}`}
                                    {...register("password", { 
                                        required: "Password required", 
                                        minLength: { value: 6, message: "Min 6 characters" } 
                                    })}
                                />
                                <button type='button' onClick={() => setPasswordVisible(!passwordVisible)} className='absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors'>
                                    {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.password.message}</p>}
                        </div>

                        <button type='submit' disabled={signupMutation.isPending}
                            className="relative w-full py-4 text-xs tracking-[0.3em] uppercase font-black text-white border-2 border-black overflow-hidden group transition-colors duration-500 bg-black hover:text-black disabled:opacity-70">
                            <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                            <span className="relative z-10">{signupMutation.isPending ? "Processing..." : "Sign Up"}</span>
                        </button>

                        <div className='mt-8 text-center'>
                            <p className='text-[13px] text-black font-medium tracking-tight'>
                                Already have an account? 
                                <Link href="/login" className='text-black font-black uppercase text-[11px] tracking-widest border-b-2 border-black hover:text-black/50 hover:border-black/50 transition-all ml-2'>
                                    Login
                                </Link>
                            </p>
                        </div>
                    </form>
                ) : (
                    <div className="text-center">
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

                        <button 
                            onClick={() => { setServerError(null); verifyOtpMutation.mutate(); }} 
                            disabled={verifyOtpMutation.isPending}
                            className="relative w-full py-4 text-xs tracking-[0.3em] uppercase font-black text-white border-2 border-black overflow-hidden group transition-colors duration-500 bg-black hover:text-black"
                        >
                            <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                            <span className="relative z-10">{verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}</span>
                        </button>

                        <div className='mt-10 min-h-[24px]'>
                            {canResend ? (
                                <button onClick={() => signupMutation.mutate(userData!)} className='text-[11px] text-black font-bold uppercase tracking-widest underline underline-offset-4 decoration-black hover:text-black/50 transition-colors'>
                                    Resend Code
                                </button>
                            ) : (
                                <p className='text-[11px] text-black/40 uppercase tracking-widest font-bold'>
                                    Resend in {timer}s
                                </p>
                            )}
                        </div>
                        
                        <button onClick={() => setShowOtp(false)} className='mt-8 text-[11px] text-black font-bold uppercase tracking-widest hover:text-black/50 transition-colors underline underline-offset-4 decoration-black'>
                            ← Back to Signup
                        </button>
                    </div>
                )}

                {(serverError || successMessage) && (
                    <div className={`mt-6 p-3 border ${serverError ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                        <p className={`${serverError ? 'text-red-600' : 'text-green-600'} text-[11px] text-center font-black uppercase tracking-widest`}>
                            {serverError || successMessage}
                        </p>
                    </div>
                )}
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

export default Signup;