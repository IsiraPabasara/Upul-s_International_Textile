import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


interface UseUserOptions {
    required?: boolean;
}

const useUser = ({ required = false }: UseUserOptions = {}) => {
    const router = useRouter();

    const { data: user, isLoading, isError, refetch } = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            try {
                const response = await axiosInstance.get("/api/auth/logged-in-user", {
                    isPublic: !required 
                });
                return response.data.user;
            } catch (error) {
                if (!required) return null;
                throw error;
            }
        },
        staleTime: 0, // Always fetch fresh - prevents stale auth state
        gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes but always refetch
        retry: required ? 1 : false, 
        refetchOnMount: true, // Always refetch when component mounts
        refetchOnWindowFocus: false, // Don't refetch on window focus to avoid spam
        
    });

    
    useEffect(() => {
        if (required && !isLoading && (isError || !user)) {
            router.push("/login");
        }
    }, [required, isLoading, isError, user, router]);

    return { user, isLoading, isError, refetch };
}

export default useUser;