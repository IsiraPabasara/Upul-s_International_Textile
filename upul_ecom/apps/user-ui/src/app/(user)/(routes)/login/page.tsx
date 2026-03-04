'use client'
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { EyeIcon, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast'; // Highly recommended since you installed it!

type FormData = {
    email: string;
    password: string;
}

const Login = () => {
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [rememberMe, setRememberMe] = useState(false)
    const router = useRouter();

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();

    useEffect(() => {
        const savedEmail = localStorage.getItem("rememberedEmail");
        if (savedEmail) {
            setValue("email", savedEmail);
            setRememberMe(true);
        }
    }, [setValue]);

    const loginMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/login-user`,
                data,
                { withCredentials: true },
            )
            return response.data;
        },
        onSuccess: (data, variables) => {
            if (rememberMe) {
                localStorage.setItem("rememberedEmail", variables.email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }
            
            toast.success("Login successful!");
            setServerError(null);
            router.push("/");
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid credentials";
            toast.error(errorMessage);
            setServerError(errorMessage);
        }
    })

    const onSubmit = (data: FormData) => {
        loginMutation.mutate(data);
    };

    return (
        <div className='w-full py-10 min-h-[85vh] bg-[#f1f1f1]'>
            {/* ... title and breadcrumbs remain same ... */}
            <div className='w-full flex justify-center'>
                <div className='md:w-[480px] p-8 bg-white shadow rounded-lg'>
                    <h3 className='text-3xl font-semibold text-center mb-2'>Login to Eshop</h3>
                    {/* ... link to signup remains same ... */}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <label className='block text-gray-700 mb-1'>Email</label>
                        <input type='email' placeholder='email@example.com'
                            className='w-full p-2 border border-gray-300 outline-0 rounded-md mb-1'
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Invalid email address",
                                }
                            })}
                        />
                        {errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}

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
                                {passwordVisible ? <EyeIcon /> : <EyeOff />}
                            </button>
                        </div>
                        {errors.password && <p className='text-red-500 text-sm'>{errors.password.message}</p>}

                        <div className='flex justify-between items-center my-4'>
                            <label className='text-gray-600 flex items-center cursor-pointer'>
                                <input 
                                    type='checkbox' 
                                    className='mr-2' 
                                    checked={rememberMe} 
                                    onChange={() => setRememberMe(!rememberMe)} 
                                />
                                Remember me
                            </label>
                            <Link href={"/forgot-password"} className='text-blue-500 text-sm'>Forgot Password?</Link>
                        </div>

                        <button type='submit' className='w-full text-lg cursor-pointer bg-black text-white py-2 rounded-lg' disabled={loginMutation.isPending}>
                            {loginMutation.isPending ? "Logging in..." : "Login"}
                        </button>
                        
                        {serverError && <p className='text-red-500 text-sm mt-2 text-center'>{serverError}</p>}
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login