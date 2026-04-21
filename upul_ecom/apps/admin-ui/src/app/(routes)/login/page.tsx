'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import axios, { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type FormData = {
    email: string;
    password: string;
    rememberMe: boolean;
}

const Login = () => {
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const router = useRouter();
    const queryClient = useQueryClient(); // Initialize QueryClient
    

    
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            rememberMe: false
        }
    });

    const isRemembered = watch("rememberMe");

    useEffect(() => {
        const savedEmail = localStorage.getItem("rememberedEmail");
        if (savedEmail) {
            setValue("email", savedEmail);
            setValue("rememberMe", true);
        }
    }, [setValue]);

    const loginMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.post(`https://api.upuls.lk/api/auth/login-user`,
                data, { withCredentials: true }
            )
            return response.data;
        },
        onSuccess: async (data, variables) => {
            if (variables.rememberMe) {
                localStorage.setItem("rememberedEmail", variables.email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            // IMPORTANT: Invalidate the user query to update Header and other components
            await queryClient.invalidateQueries({ queryKey: ["user"] });

           

            toast.success("Login successful!");
            router.push("/dashboard");
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid credentials";
            toast.error(errorMessage);
            setServerError(errorMessage);
        }
    })

    const onSubmit = (data: FormData) => {
        setServerError(null);
        loginMutation.mutate(data);
    };

    return (
        <div className='w-full min-h-screen bg-white flex flex-col items-center justify-center font-sans'>
            <div className='w-full max-w-[450px] px-8'>
                <div className="mb-14 text-center"> 
                    <h2 className='text-2xl tracking-[0.4em] uppercase mb-6 text-black font-semibold'>Login</h2>
                    <p className='text-[13px] text-black/60 tracking-wide font-medium'>Enter your email and password to login:</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='mb-6'>
                        <input 
                            type='email' 
                            placeholder='E-mail'
                            className={`w-full p-4 border outline-none text-base md:text-sm placeholder:text-black/40 transition-colors font-medium ${errors.email ? 'border-red-500' : 'border-black focus:border-black'}`}
                            {...register("email", { 
                                required: "Email is required",
                                pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email format" }
                            })}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.email.message}</p>
                        )}
                    </div>

                    <div className='mb-6'>
                        <div className="relative">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                placeholder='Password'
                                className={`w-full p-4 border outline-none text-base md:text-sm placeholder:text-black/40 transition-colors font-medium ${errors.password ? 'border-red-500' : 'border-black focus:border-black'}`}
                                {...register("password", { 
                                    required: "Password is required",
                                    minLength: { value: 6, message: "Minimum 6 characters" } 
                                })}
                            />
                            <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors">
                                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{errors.password.message}</p>
                        )}
                    </div>

                    <div className='flex items-center mb-10'>
                        <label className='flex items-center cursor-pointer select-none group'>
                            <div className="relative">
                                <input type='checkbox' className='sr-only' {...register("rememberMe")} />
                                <div className={`w-4 h-4 border-2 border-black transition-all flex items-center justify-center ${isRemembered ? 'bg-black' : 'bg-white'}`}>
                                    {isRemembered && <div className="w-1.5 h-1.5 bg-white" />}
                                </div>
                            </div>
                            <span className='ml-3 text-[11px] text-black font-black uppercase tracking-widest'>Remember me</span>
                        </label>
                    </div>

                    <button type='submit' disabled={loginMutation.isPending}
                        className="relative w-full py-4 text-xs tracking-[0.3em] uppercase font-black text-white border-2 border-black overflow-hidden group transition-colors duration-500 bg-black hover:text-black disabled:opacity-70">
                        <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                        <span className="relative z-10">{loginMutation.isPending ? "Logging in..." : "Login"}</span>
                    </button>

                    <div className='mt-8 text-center space-y-4'>
                        <Link href="/forgot-password" 
                            className='block text-[11px] text-black font-bold uppercase tracking-widest hover:text-black/50 transition-colors underline underline-offset-4 decoration-black'>
                            Forgot your password?
                        </Link>
                        <p className='text-[13px] text-black font-medium tracking-tight'>
                            Don't have an account? 
                            <Link href="/signup" className='text-black font-black uppercase text-[11px] tracking-widest border-b-2 border-black hover:text-black/50 hover:border-black/50 transition-all ml-2'>
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {serverError && (
                        <div className="mt-6 p-3 border border-red-500 bg-red-50">
                            <p className='text-red-600 text-[11px] text-center font-black uppercase tracking-widest'>{serverError}</p>
                        </div>
                    )}
                </form>
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

export default Login;