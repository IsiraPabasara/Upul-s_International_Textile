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
    // UI States
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Timer & OTP States
    const [canResend, setCanResend] = useState(true);
    const [timer, setTimer] = useState(60);
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [userData, setUserData] = useState<FormData | null>(null);
    
    const router = useRouter();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

    // Resend Timer Logic
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

    // Mutation: Initial Signup & Resend
    const signupMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.post(`https://api.upuls.lk/api/auth/register`, data);
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
            setSuccessMessage(null);
        }
    });

    // Mutation: OTP Verification
    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            if (!userData) return;
            const response = await axios.post(`https://api.upuls.lk/api/auth/verify-user`, {
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
            setSuccessMessage(null);
        }
    });

    const onSubmit = (data: FormData) => {
        setServerError(null);
        signupMutation.mutate(data);
    };

    const handleResend = () => {
        if (!canResend || !userData) return;
        setServerError(null);
        setSuccessMessage(null);
        signupMutation.reset(); 
        signupMutation.mutate(userData);
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
        <>
        <div className='w-full min-h-screen bg-white flex flex-col items-center justify-center font-sans py-20'>
            <div className='w-full max-w-[450px] px-8'>
                
                <div className="mb-14 text-center">
                    <h2 className='text-2xl tracking-[0.4em] uppercase mb-6 text-[#111] font-light'>
                        {showOtp ? "Verify" : "Signup"}
                    </h2>
                    <p className='text-[13px] text-gray-400 tracking-wide'>
                        {showOtp ? "Enter the code sent to your email:" : "Create your account below:"}
                    </p>
                </div>

                {!showOtp ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* FIRST & LAST NAME */}
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <input type='text' placeholder='First Name'
                                    className={`w-full p-4 border outline-none text-base md:text-sm placeholder:text-gray-400 transition-colors ${errors.firstname ? 'border-red-500' : 'border-gray-200 focus:border-black'}`}
                                    {...register("firstname", { required: "Required" })}
                                />
                                {errors.firstname && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.firstname.message}</p>}
                            </div>
                            <div>
                                <input type='text' placeholder='Last Name'
                                    className={`w-full p-4 border outline-none text-base md:text-sm placeholder:text-gray-400 transition-colors ${errors.lastname ? 'border-red-500' : 'border-gray-200 focus:border-black'}`}
                                    {...register("lastname", { required: "Required" })}
                                />
                                {errors.lastname && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.lastname.message}</p>}
                            </div>
                        </div>

                        {/* EMAIL */}
                        <div>
                            <input type='email' placeholder='E-mail'
                                className={`w-full p-4 border outline-none text-base md:text-sm placeholder:text-gray-400 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-black'}`}
                                {...register("email", { 
                                    required: "Email required",
                                    pattern: { value: /\S+@\S+\.\S+/, message: "Invalid format" }
                                })}
                            />
                            {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.email.message}</p>}
                        </div>

                        {/* PHONE */}
                        <div>
                            <input type='text' placeholder='Phone Number'
                                className={`w-full p-4 border outline-none text-base md:text-sm placeholder:text-gray-400 transition-colors ${errors.phonenumber ? 'border-red-500' : 'border-gray-200 focus:border-black'}`}
                                {...register("phonenumber", { required: "Phone required" })}
                            />
                            {errors.phonenumber && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.phonenumber.message}</p>}
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <div className="relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    placeholder='Password'
                                    className={`w-full p-4 border outline-none text-base md:text-sm placeholder:text-gray-400 transition-colors ${errors.password ? 'border-red-500' : 'border-gray-200 focus:border-black'}`}
                                    {...register("password", { 
                                        required: "Password required", 
                                        minLength: { value: 6, message: "Min 6 characters" } 
                                    })}
                                />
                                <button type='button' onClick={() => setPasswordVisible(!passwordVisible)} className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors'>
                                    {passwordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.password.message}</p>}
                        </div>

                        {serverError && <p className='text-red-500 text-center text-[11px] uppercase tracking-widest font-bold'>{serverError}</p>}

                        <button type='submit' disabled={signupMutation.isPending}
                            className="relative w-full py-4 mt-4 text-xs tracking-[0.3em] uppercase font-bold text-white border border-black overflow-hidden group bg-black hover:text-black transition-colors duration-500 disabled:opacity-50">
                            <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                            <span className="relative z-10">{signupMutation.isPending ? "Processing..." : "Sign Up"}</span>
                        </button>

                        <div className='mt-12 text-center'>
                            <p className='text-[13px] text-gray-400 tracking-tight'>
                                Already have an account? 
                                <Link href="/login" className='text-black font-medium hover:underline underline-offset-4 ml-1'>Login</Link>
                            </p>
                        </div>
                    </form>
                ) : (
                    /* OTP VERIFICATION VIEW */
                    <div className="text-center">
                        <div className='flex justify-center gap-4 mb-10'>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    type='text'
                                    ref={(el) => { if (el) inputRefs.current[index] = el; }}
                                    maxLength={1}
                                    className='w-14 h-14 text-center border border-gray-200 outline-none text-lg focus:border-black transition-colors'
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                />
                            ))}
                        </div>

                        <button 
                            onClick={() => { setServerError(null); verifyOtpMutation.mutate(); }} 
                            disabled={verifyOtpMutation.isPending}
                            className="relative w-full py-4 text-xs tracking-[0.3em] uppercase font-bold text-white border border-black overflow-hidden group bg-black hover:text-black transition-colors duration-500"
                        >
                            <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                            <span className="relative z-10">{verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}</span>
                        </button>

                        <div className='mt-10 min-h-[24px]'>
                            {canResend ? (
                                <button onClick={handleResend} className='text-[11px] text-black font-bold uppercase tracking-[0.2em] hover:underline underline-offset-4'>
                                    Resend Code
                                </button>
                            ) : (
                                <p className='text-[11px] text-gray-400 uppercase tracking-[0.2em]'>
                                    Resend in {timer}s
                                </p>
                            )}
                        </div>

                        <div className="mt-6 space-y-2">
                            {successMessage && <p className='text-green-600 text-[11px] uppercase tracking-widest font-bold'>{successMessage}</p>}
                            {serverError && <p className='text-red-500 text-[11px] uppercase tracking-widest font-bold'>{serverError}</p>}
                        </div>
                        
                        <button onClick={() => setShowOtp(false)} className='mt-8 text-[11px] text-gray-400 hover:text-black uppercase tracking-widest transition-colors'>
                            ← Back to Signup
                        </button>
                    </div>
                )}
            </div>
        </div>

        <style jsx>{`
            @media (max-width: 768px) {
                input {
                    font-size: 16px !important;
                }
            }
        `}</style>
    </>
    )
}

export default Signup;