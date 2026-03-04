'use client'
import { useMutation } from '@tanstack/react-query';
import { EyeIcon, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react'
import {useForm} from 'react-hook-form';
import axios from 'axios'

type FormData = {
    firstname: string;
    lastname: string;
    email: string;
    phonenumber: string; // Stored as string to preserve leading zeros
    password: string;
}

const Signup = () => {

    const [passwordVisible, setPasswordVisible] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [canResend, setCanResend] = useState(true);
    const [showOtp, setShowOtp] = useState(false);
    const [timer, setTimer] = useState(60);
    const [otp, setOtp] = useState(["", "", "", ""]);
    const router = useRouter();
    const [userData, setUserData] = useState<FormData | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const {register, handleSubmit, formState:{errors},} = useForm<FormData>(); 

    const startResendTimer = () => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if(prev <= 1) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prev-1;
            })
        },1000)
    }

    const signupMutation = useMutation({
        mutationFn: async(data: FormData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/register`, data);
            return response.data;
        },
        onSuccess: (_, formData) => {
            setUserData(formData);
            setShowOtp(true);
            setCanResend(false);
            setTimer(60);
            startResendTimer();
        },
        onError: (error: unknown) => {
            if(axios.isAxiosError(error)) {
                setServerError(error.response?.data?.message || "Something went wrong");
            }
            else {
                setServerError("Something went wrong");
            }
        }
    })

    const verifyOtpMutaioin = useMutation({
        mutationFn: async () => {
            if(!userData) return;
            const  response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/verify-user`,
                {
                    ...userData,
                    otp: otp.join(""),
                }
            );
            return response.data;
        },
        onSuccess: () => {
            router.push("/login");
        },
        onError: (error: unknown) => {
            if(axios.isAxiosError(error)) {
                setServerError(error.response?.data?.message || "Something went wrong");
            }
            else {
                setServerError("Something went wrong");
            }
        }
    })
    
    const onSubmit = (data: FormData) => {
        signupMutation.mutate(data);
    };

    const handleOtpChange = (index:number, value:string) => {
        if(!/^[0-9]?$/.test(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if(value && index < inputRefs.current.length - 1 ) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    const handleOtpKeyDown = (index:number, e:React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    const resendOtp = () => {
        if (!canResend || !userData) return;

        setServerError(null);
        setCanResend(false);
        setTimer(60);
        startResendTimer();

        signupMutation.mutate(userData);
    };


    return (
        <div className='w-full py-10 min-h-[85vh] bg-[#f1f1f1]'>
            
            <div className='w-full flex justify-center'>
                <div className='md:w-[480px] p-8 bg-white shadow rounded-lg'>
                    <h3 className='text-3xl font-semibold text-center mb-2'>
                        Signup
                    </h3>
                    <p className='text-center text-gray-500 mb-4'>
                        Already have an account?{" "}
                        <Link href="/login" className='text-blue-500'>Login</Link>
                    </p>
                    
                    

                    {!showOtp ? (
                        <form onSubmit={handleSubmit(onSubmit)}>
                        {/* First Name */}
                        <label className='block text-gray-700 mb-1'>First Name</label>
                        <input type='text' placeholder='saminu'
                            className='w-full p-2 border border-gray-300 outline-0 rounded-md mb-1'
                            {...register("firstname", { required: "First name is required" })}
                        />
                        {errors.firstname && <p className='text-red-500 text-sm'>{errors.firstname.message}</p>}

                        {/* Last Name */}
                        <label className='block text-gray-700 mb-1'>Last Name</label>
                        <input type='text' placeholder='hansaja'
                            className='w-full p-2 border border-gray-300 outline-0 rounded-md mb-1'
                            {...register("lastname", { required: "Last name is required" })}
                        />
                        {errors.lastname && <p className='text-red-500 text-sm'>{errors.lastname.message}</p>}

                        {/* Email */}
                        <label className='block text-gray-700 mb-1'>Email</label>
                        <input type='email' placeholder='email@example.com'
                            className='w-full p-2 border border-gray-300 outline-0 rounded-md mb-1'
                            {...register("email", { 
                                required: "Email is required",
                                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
                            })}
                        />
                        {errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}

                        {/* Phone Number (10 Digits) */}
                        <label className='block text-gray-700 mb-1'>Phone Number</label>
                        <input type='text' placeholder='1234567890'
                            className='w-full p-2 border border-gray-300 outline-0 rounded-md mb-1'
                            {...register("phonenumber", { 
                                required: "Phone number is required",
                                pattern: {
                                    value: /^\d{10}$/,
                                    message: "Phone number must be exactly 10 digits"
                                }
                            })}
                        />
                        {errors.phonenumber && <p className='text-red-500 text-sm'>{errors.phonenumber.message}</p>}

                        {/* Password */}
                        <label className='block text-gray-700 mb-1'>Password</label>
                        <div className="relative">
                            <input
                            type={passwordVisible ? "text" : "password"}
                            placeholder='Min. 6 characters'
                            className='w-full p-2 border border-gray-300 outline-0 rounded-md mb-1'
                            {...register("password", { 
                                required: "Password is required", 
                                minLength: { value: 6, message: "Min 6 characters" } 
                            })}
                            />
                            <button type='button' onClick={() => setPasswordVisible(!passwordVisible)} className='absolute inset-y-0 right-3 flex items-center text-gray-400'>
                            {passwordVisible ? <EyeIcon size={20}/> : <EyeOff size={20}/>}
                            </button>
                        </div>
                        {errors.password && <p className='text-red-500 text-sm'>{errors.password.message}</p>}

                        <button type='submit' className='w-full text-lg cursor-pointer mt-4 bg-black text-white py-2 rounded-lg' disabled={signupMutation.isPending}>
                            {signupMutation.isPending ? "Signing Up..." : "Sign Up"}
                        </button>
                        </form>
                    ): (
                        <div>
                            <h3 className='text-xl font-semibold text-center mb-4'>Enter OTP</h3>
                            <div className='flex justify-center gap-6'>
                                {otp.map((digit, index) => (
                                    <input
                                    key={index}
                                    type='text'
                                    ref={(el) => {
                                        if(el) inputRefs.current[index] = el;
                                    }}
                                    maxLength={1}
                                    className='w-12 h-12 text-center border border-gray-300 outline-none !rounded'
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index,e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    >
                                    </input>
                                ))}
                            </div>
                            <button className='w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg'
                            disabled = {verifyOtpMutaioin.isPending}
                            onClick={() => verifyOtpMutaioin.mutate()}
                            >
                                {verifyOtpMutaioin.isPending? "Verifying..." : "Verify OTP"}
                            </button>
                            <p className='text-center text-sm mt-4'>
                                {canResend ? (
                                    <button onClick={resendOtp} className=''>
                                        Resend OTP
                                    </button>
                                ): (
                                    `Resend OTP in ${timer}s`
                                )}
                            </p>
                            {serverError && (
                            <p className='text-red-500 text-sm'>
                                {serverError}
                            </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Signup