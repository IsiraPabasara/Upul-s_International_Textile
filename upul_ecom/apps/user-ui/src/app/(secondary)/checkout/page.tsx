'use client';
import { usePageTitle } from '@/app/hooks/usePageTitle';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, AlertCircle, ShoppingCart, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useCart } from '@/app/hooks/useCart';
import useUser from '@/app/hooks/useUser';
import axiosInstance from '@/app/utils/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';

// --- Zod Schema ---
const checkoutSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstname: z.string().min(2, 'First name is required'),
  lastname: z.string().min(2, 'Last name is required'),
  addressLine: z.string().min(5, 'Address is required'),
  apartment: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  phoneNumber: z.string().min(9, 'Phone number is required'),
  saveAddress: z.boolean().default(false).optional(),

  billingFirstname: z.string().optional(),
  billingLastname: z.string().optional(),
  billingAddressLine: z.string().optional(),
  billingApartment: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingPhoneNumber: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const inputFieldClass =
  'w-full px-3 py-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm';
const inputErrorClass =
  'w-full px-3 py-3 bg-white border border-red-500 rounded-md text-sm outline-none transition-all';

export default function CheckoutPage() {
  usePageTitle('Checkout', 'Complete your purchase');
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    items,
    couponCode,
    discountAmount,
    applyCoupon,
    removeCoupon,
    getSubtotal,
  } = useCart();

  const { user, isLoading: isUserLoading } = useUser({ required: false });

  // Fetch active shipping cities
  const { data: dbCities = [] } = useQuery({
    queryKey: ['active-shipping-cities'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/shipping-cities');
      return response.data.cities || [];
    },
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [shippingCost, setShippingCost] = useState(450); // Default fallback
  const [citySearch, setCitySearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isValidCity, setIsValidCity] = useState(false); // Track if a valid city is selected

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'PAYHERE' | null>('COD');
  const [paymentError, setPaymentError] = useState(false);
  const [addressError, setAddressError] = useState(false); // New state for address selection error

  const [promoInput, setPromoInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: '' | 'success' | 'error'; text: string }>({
    type: '',
    text: '',
  });
  const [couponCheckoutError, setCouponCheckoutError] = useState('');

  // Filter cities based on search
  const filteredCities = dbCities.filter((c: any) => 
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const subtotal = useMemo(() => {
    if (!items) return 0;
    return items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
  }, [items]);

  const totalDiscount = useMemo(() => {
    if (!items) return 0;
    return items.reduce((sum, item) => {
      const original = item.originalPrice || item.price;
      const savings = (Number(original) - Number(item.price)) * Number(item.quantity);
      return sum + (savings > 0 ? savings : 0);
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    const totalAfterDiscount = subtotal - (discountAmount || 0);
    return Math.max(0, totalAfterDiscount) + shippingCost;
  }, [subtotal, discountAmount, shippingCost]);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { saveAddress: true },
  });

  const [isSameAsShipping, setIsSameAsShipping] = useState(true);

  useEffect(() => {
    if (!isProcessing && (!items || items.length === 0)) router.replace('/shop');
  }, [items, router, isProcessing]);

  useEffect(() => {
    // Reset scroll position and ensure body is scrollable
    window.scrollTo(0, 0);
    document.body.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleApplyCoupon = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    // Grab the email straight from the input field state
    const currentEmail = user?.email || getValues('email');

    setCouponLoading(true);
    setCouponMsg({ type: '', text: '' });
    setCouponCheckoutError('');  // Clear any previous checkout errors

    try {
      const res = await axiosInstance.post('/api/coupons/validate-coupon', {
        code,
        cartTotal: getSubtotal(),
        userId: user?.id,
        email: currentEmail,
      });

      if (res.data.success) {
        applyCoupon(res.data.code, res.data.discount);
        setCouponMsg({
          type: 'success',
          text: `Coupon applied! You saved LKR ${Number(res.data.discount || 0).toLocaleString()}`,
        });
        setPromoInput('');  // Clear the input after successful application
      }
    } catch (error: any) {
      setCouponMsg({
        type: 'error',
        text: error.response?.data?.message || 'Invalid coupon',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setPromoInput('');
    setCouponMsg({ type: '', text: '' });
    setCouponCheckoutError('');
  };

  // Function to handle city selection
  const handleCitySelect = (city: any) => {
    setValue('city', city.name, { shouldValidate: true }); // Updates React Hook Form
    setShippingCost(city.shippingCost); // Updates the UI Total
    setCitySearch(city.name); // Updates the input visual
    setIsDropdownOpen(false); // Closes dropdown
    setIsValidCity(true); // Mark city as valid
  };

  // Function to handle saved address selection - automatically set shipping cost based on city
  const handleSavedAddressSelect = (address: any) => {
    setSelectedAddressId(address.id);
    setAddressError(false);
    
    // Find matching city in database and update shipping cost
    const matchingCity = dbCities.find((c: any) => c.name.toLowerCase().trim() === address.city.toLowerCase().trim());
    if (matchingCity) {
      setShippingCost(matchingCity.shippingCost);
      setCitySearch(matchingCity.name);
      setIsValidCity(true); // Mark city as valid
    } else {
      // If city not found in database, use default
      setShippingCost(450);
      setCitySearch(address.city);
      setIsValidCity(false); // Mark city as invalid
    }
  };

  // Update shipping cost when dbCities loads and a saved address is selected
  useEffect(() => {
    if (dbCities.length > 0 && selectedAddressId && user?.addresses) {
      const selectedAddress = user.addresses.find((addr: any) => addr.id === selectedAddressId);
      if (selectedAddress) {
        const matchingCity = dbCities.find((c: any) => c.name.toLowerCase().trim() === selectedAddress.city.toLowerCase().trim());
        if (matchingCity) {
          setShippingCost(matchingCity.shippingCost);
          setIsValidCity(true);
        }
      }
    }
  }, [dbCities, selectedAddressId, user]);

  const onPlaceOrder = async (data: CheckoutFormValues) => {
    if (!paymentMethod) {
      setPaymentError(true);
      toast.error('Please select a payment method to continue');
      return;
    }

    setIsProcessing(true);
    try {
      let orderPayload: any;
      let finalBillingAddress = null;
      
      if (!isSameAsShipping) {
        finalBillingAddress = {
          firstname: data.billingFirstname,
          lastname: data.billingLastname,
          addressLine: data.billingAddressLine,
          apartment: data.billingApartment,
          city: data.billingCity,
          postalCode: data.billingPostalCode,
          phoneNumber: data.billingPhoneNumber,
        };
      }

      if (user) {
        let finalAddressId = selectedAddressId;

        // Validation for logged in user selecting an existing address
        if (!isAddingNewAddress && !finalAddressId) {
          setAddressError(true);
          toast.error('Please select a shipping address');
          // setIsProcessing(false);
          return;
        }

        if (isAddingNewAddress) {
          // Validate that a valid city from the database has been selected
          if (!isValidCity) {
            toast.error('Please select a valid city from the dropdown');
            setIsProcessing(false);
            return;
          }

          const res = await axiosInstance.post('/api/auth/add-address', {
            ...data,
            isDefault: !!data.saveAddress,
          });

          if (res.data.success) {
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            finalAddressId = res.data.addresses[res.data.addresses.length - 1].id;
            setSelectedAddressId(finalAddressId);
            setIsAddingNewAddress(false);
            setCitySearch('');
            setIsValidCity(false);
          } else {
            // setIsProcessing(false);
            return;
          }
        }

        orderPayload = {
          type: 'USER',
          userId: user.id,
          addressId: finalAddressId,
          billingAddress: finalBillingAddress,
          items,
          email: user.email,
          paymentMethod: paymentMethod,
          shippingFee: shippingCost,
          couponCode: couponCode,
        };
      } else {
        // Validation for guest user
        if (!isValidCity) {
          toast.error('Please select a valid city from the dropdown');
          setIsProcessing(false);
          return;
        }

        orderPayload = {
          type: 'GUEST',
          email: data.email,
          address: { ...data },
          billingAddress: finalBillingAddress,
          items,
          paymentMethod: paymentMethod,
          shippingFee: shippingCost,
          couponCode: couponCode,
        };
      }

      const res = await axiosInstance.post('/api/orders', orderPayload);

      if (res.data.success) {
        if (res.data.isPayHere) {
          const params = res.data.payhereParams;
          const form = document.createElement('form');
          form.setAttribute('method', 'POST');

          const payHereUrl =
            process.env.NODE_ENV === 'production'
              ? 'https://www.payhere.lk/pay/checkout'
              : 'https://sandbox.payhere.lk/pay/checkout';

          form.setAttribute('action', payHereUrl);

          Object.keys(params).forEach((key) => {
            const hiddenField = document.createElement('input');
            hiddenField.setAttribute('type', 'hidden');
            hiddenField.setAttribute('name', key);
            hiddenField.setAttribute('value', params[key]);
            form.appendChild(hiddenField);
          });

          document.body.appendChild(form);
          toast.loading('Redirecting to Secure Payment...');
          setTimeout(() => form.submit(), 1500);
          return;
        }

        router.replace(`/checkout/success?orderNumber=${res.data.orderId}&success=true`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Order failed';
      
      // Check if error is coupon-related and display it below coupon
      if (couponCode && errorMsg.toLowerCase().includes('coupon')) {
        setCouponCheckoutError(errorMsg);
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      // if (paymentMethod === 'COD') {
      //   setIsProcessing(false);
      // }
      setIsProcessing(false);
    }
  };

  const PlaceOrderButton = ({ className }: { className?: string }) => (
    <button
      disabled={isProcessing}
      onClick={(e) =>
        user && !isAddingNewAddress ? onPlaceOrder({} as CheckoutFormValues) : handleSubmit(onPlaceOrder)(e)
      }
      className={`w-full text-white py-4 md:py-5 rounded-md text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50 active:scale-[0.98] ${className} ${
        paymentMethod === 'PAYHERE' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'
      }`}
    >
      {isProcessing ? (
        <Loader2 className="animate-spin mx-auto" />
      ) : paymentMethod === 'PAYHERE' ? (
        'PAY & PLACE ORDER'
      ) : (
        'PLACE ORDER'
      )}
    </button>
  );

  if (isUserLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row font-sans text-gray-700 bg-white lg:min-h-screen">
      {/* MOBILE SUMMARY HEADER */}
      <div className="lg:hidden bg-[#FAFAFA] p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 text-black font-bold">
          <ShoppingCart size={18} />
          <span className="text-sm">Order summary</span>
        </div>
        <span className="text-black font-black">LKR {grandTotal.toLocaleString()}</span>
      </div>

      {/* LEFT COLUMN */}
      <div className="w-full lg:w-[58%] px-4 md:px-12 lg:px-24 py-8 lg:py-16">
        <div className="max-w-xl mx-auto lg:ml-auto lg:mr-0">
          <Link href="/" className="block mb-6 md:mb-10">
            <h1 className="text-3xl font-black tracking-tighter uppercase">
              Checkout<span className="text-blue-600">.</span>
            </h1>
          </Link>

          <Link
            href="/shop"
            className="flex items-center gap-2 text-xs md:text-sm text-gray-500 hover:text-black mb-6 md:mb-8 transition-colors uppercase tracking-widest font-bold"
          >
            <ArrowLeft size={16} /> Go back to shop
          </Link>

          {/* Shipping Address */}
          <section className="mb-10 md:mb-12">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-medium text-black">Shipping Address</h2>
              {!user && (
                <Link href="/login" className="text-xs font-bold text-blue-600 underline uppercase tracking-wider hover:text-blue-800">
                  Log In
                </Link>
              )}
            </div>

            {user && !isAddingNewAddress && (
              <div className="space-y-3 mb-6">
                {user.addresses?.map((addr: any) => (
                  <div
                    key={addr.id}
                    onClick={() => handleSavedAddressSelect(addr)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-4 ${
                      selectedAddressId === addr.id
                        ? 'border-black bg-gray-50'
                        : addressError 
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex shrink-0 items-center justify-center ${
                        selectedAddressId === addr.id ? 'border-black' : 'border-gray-300'
                      }`}
                    >
                      {selectedAddressId === addr.id && <div className="w-2 h-2 bg-black rounded-full" />}
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-black">
                        {addr.firstname} {addr.lastname}
                      </p>
                      <p className="text-gray-500 text-xs md:text-sm">
                        {addr.addressLine}, {addr.city}
                      </p>
                    </div>
                  </div>
                ))}
                
                {addressError && (
                  <p className="text-red-500 text-[10px] font-bold mt-2 flex items-center gap-1 uppercase tracking-tighter">
                    <AlertCircle size={12} /> Selection required to proceed
                  </p>
                )}

                <button
                  onClick={() => {
                    setIsAddingNewAddress(true);
                    setAddressError(false);
                    setCitySearch('');
                    setIsValidCity(false);
                  }}
                  className="text-xs md:text-sm font-bold text-black underline flex items-center gap-1 mt-4 uppercase tracking-tighter"
                >
                  + Use a different address
                </button>
              </div>
            )}

            {(!user || isAddingNewAddress || user?.addresses?.length === 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {!user && (
                  <div className="md:col-span-2">
                    <input
                      {...register('email')}
                      placeholder="Email Address"
                      className={errors.email ? inputErrorClass : inputFieldClass}
                    />
                  </div>
                )}
                <input
                  {...register('firstname')}
                  placeholder="First name"
                  className={errors.firstname ? inputErrorClass : inputFieldClass}
                />
                <input
                  {...register('lastname')}
                  placeholder="Last name"
                  className={errors.lastname ? inputErrorClass : inputFieldClass}
                />
                <div className="md:col-span-2">
                  <input
                    {...register('addressLine')}
                    placeholder="Address"
                    className={errors.addressLine ? inputErrorClass : inputFieldClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    {...register('apartment')}
                    placeholder="Apartment, suite, etc. (optional)"
                    className={inputFieldClass}
                  />
                </div>
                {/* Searchable City Dropdown */}
                <div className="relative md:col-span-1">
                  <input
                    type="text"
                    placeholder="City"
                    className={errors.city ? inputErrorClass : inputFieldClass}
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setIsDropdownOpen(true);
                      // If they clear the input, reset shipping
                      if(e.target.value === '') {
                         setValue('city', '');
                         setShippingCost(450);
                         setIsValidCity(false);
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    // Optional: delay blur so click event registers
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  />
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && filteredCities.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredCities.map((city: any) => (
                        <li
                          key={city.name}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between"
                          onMouseDown={(e) => e.preventDefault()} // Prevents onBlur from firing before click
                          onClick={() => handleCitySelect(city)}
                        >
                          <span>{city.name}</span>
                          <span className="text-gray-500 text-xs font-bold">LKR {city.shippingCost}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isDropdownOpen && filteredCities.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
                      City not found. Please type a nearby major city.
                    </div>
                  )}
                  
                  {/* Hidden input to keep react-hook-form happy if needed, though setValue handles it */}
                  <input type="hidden" {...register('city')} />
                  
                  {/* Warning if no valid city selected */}
                  {isAddingNewAddress && citySearch && !isValidCity && (
                    <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1 uppercase tracking-tighter">
                      Please select a valid city from the list
                    </p>
                  )}
                </div>
                <input
                  {...register('postalCode')}
                  placeholder="Postal code"
                  className={errors.postalCode ? inputErrorClass : inputFieldClass}
                />
                <div className="md:col-span-2">
                  <input
                    {...register('phoneNumber')}
                    placeholder="Phone"
                    className={errors.phoneNumber ? inputErrorClass : inputFieldClass}
                  />
                </div>

                {user && (
                  <div className="md:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('saveAddress')}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-xs md:text-sm">Save address to profile</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewAddress(false);
                        setCitySearch('');
                        setIsValidCity(false);
                      }}
                      className="text-xs md:text-sm text-red-500 font-bold uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Billing Address */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-medium text-black mb-4 md:mb-6">Billing Address</h2>
            <label className="flex items-center gap-2 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={isSameAsShipping}
                onChange={(e) => setIsSameAsShipping(e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm">Same as shipping address</span>
            </label>

            {!isSameAsShipping && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <input {...register('billingFirstname')} placeholder="First name" className={inputFieldClass} required={!isSameAsShipping} />
                <input {...register('billingLastname')} placeholder="Last name" className={inputFieldClass} required={!isSameAsShipping} />
                <div className="md:col-span-2">
                  <input {...register('billingAddressLine')} placeholder="Address" className={inputFieldClass} required={!isSameAsShipping} />
                </div>
                <div className="md:col-span-2">
                  <input {...register('billingApartment')} placeholder="Apartment, suite, etc. (optional)" className={inputFieldClass} />
                </div>
                <input {...register('billingCity')} placeholder="City" className={inputFieldClass} required={!isSameAsShipping} />
                <input {...register('billingPostalCode')} placeholder="Postal code" className={inputFieldClass} required={!isSameAsShipping} />
                <div className="md:col-span-2">
                  <input {...register('billingPhoneNumber')} placeholder="Phone" className={inputFieldClass} required={!isSameAsShipping} />
                </div>
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-medium text-black mb-2">Payment</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">All transactions are secure and encrypted.</p>

            <div className="space-y-3">
              <div
                onClick={() => { setPaymentMethod('PAYHERE'); setPaymentError(false); }}
                className={`border-2 rounded-lg p-4 md:p-5 cursor-pointer transition-all flex justify-between items-center ${
                  paymentMethod === 'PAYHERE' ? 'border-blue-600 bg-blue-50' : paymentError ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'PAYHERE' ? 'border-blue-600' : paymentError ? 'border-red-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'PAYHERE' && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-600 rounded-full" />}
                </div>
                  
                  <div>
                    <p className="text-xs md:text-sm font-bold text-black uppercase tracking-wider">Pay Online</p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-1">Visa, Master, Amex (Secured by PayHere)</p>
                  </div>
                </div>

                <img src="https://ik.imagekit.io/aqi4rj9dnl/mastercard-visa-cards-logos-icons-701751695036083sdqsk5ncvn%20(1).png?updatedAt=1773466068496" alt="Visa and Mastercard" className="h-4 md:h-6" />
              </div>

              <div
                onClick={() => { setPaymentMethod('COD'); setPaymentError(false); }}
                className={`border-2 rounded-lg p-4 md:p-5 cursor-pointer transition-all flex justify-between items-center ${
                  paymentMethod === 'COD' ? 'border-black bg-gray-50' : paymentError ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-black' : paymentError ? 'border-red-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-black rounded-full" />}
                </div>
                  
                  <div>
                    <p className="text-xs md:text-sm font-bold text-black uppercase tracking-wider">Cash on Delivery</p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-1">Pay with cash upon physical delivery</p>
                  </div>
                </div>
                
              </div>
            </div>

            {paymentError && (
              <p className="text-red-500 text-[10px] font-bold mt-2 flex items-center gap-1 uppercase tracking-tighter">
                <AlertCircle size={12} /> Selection required to proceed
              </p>
            )}
          </section>

          <PlaceOrderButton className="hidden lg:block" />
          <p className="text-[10px] text-gray-500 mt-4 text-center">By clicking Place Order, you agree to our <Link href="/terms-and-conditions" className="underline hover:text-black transition-colors">Terms and Conditions</Link>.</p>
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500">
            <Link href="/return-policy" className="underline hover:text-black transition-colors">Return Policy</Link>
            <span>•</span>
            <Link href="/shipping-policy" className="underline hover:text-black transition-colors">Shipping Policy</Link>
            <span>•</span>
            <Link href="/privacy-policy" className="underline hover:text-black transition-colors">Privacy Policy</Link>
          </div>
  
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-[42%] bg-[#FAFAFA] border-t lg:border-t-0 lg:border-l border-gray-200 px-4 md:px-12 lg:px-12 py-8 lg:py-16">
        <div className="mx-auto lg:mx-0 lg:sticky lg:top-16">
          <div className="space-y-4 mb-8 md:mb-10 lg:max-h-[50vh] lg:overflow-y-auto lg:pr-4">
            {items.map((item) => (
              <div key={item.sku} className="flex gap-4 items-center lg:pt-2">
                <div className="relative p-1 shrink-0">
                  <div className="w-14 md:w-16 aspect-[2/3] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-[9px] md:text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold z-10 shadow-md">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 text-[11px] md:text-xs">
                  <p className="font-bold text-black line-clamp-2 leading-tight uppercase tracking-tight">{item.name}</p>
                  <div className="text-gray-400 text-[9px] md:text-[10px] uppercase mt-1 tracking-tighter flex flex-wrap gap-2">
                    {item.size && <span>Size: {item.size}</span>}
                    <span>{item.color}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] md:text-xs font-bold text-black">LKR {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}</p>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <p className="text-[9px] text-gray-400 line-through">LKR {(item.originalPrice * item.quantity).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Coupon UI */}
          <div className="mb-5">
            {!couponCode ? (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo Code"
                    className="flex-1 border border-gray-300 p-3 rounded-md uppercase text-xs outline-none focus:border-black"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !promoInput.trim()}
                    className="bg-black text-white px-4 rounded-md text-xs font-bold uppercase tracking-wider disabled:bg-gray-400"
                  >
                    {couponLoading ? <Loader2 className="animate-spin" size={16} /> : 'Apply'}
                  </button>
                </div>
                {couponMsg.text && (
                  <p className={`text-[11px] mt-2 font-bold ${couponMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{couponMsg.text}</p>
                )}
              </div>
            ) : (
              <div>
                <div className={`flex justify-between items-center p-3 rounded-md border ${couponCheckoutError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${couponCheckoutError ? 'text-red-700' : 'text-green-700'}`}>
                    Code <span className="underline">{couponCode}</span> {couponCheckoutError ? 'invalid' : 'applied'}
                  </span>
                  <button type="button" onClick={handleRemoveCoupon} className={`hover:opacity-80 ${couponCheckoutError ? 'text-red-700' : 'text-green-700'}`}>
                    <X size={16} />
                  </button>
                </div>
                {couponCheckoutError && (
                  <p className="text-[11px] mt-2 font-bold text-red-500">{couponCheckoutError}</p>
                )}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-[11px] md:text-xs uppercase tracking-wider">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-black">LKR {subtotal.toLocaleString()}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-[11px] md:text-xs text-green-600 font-bold uppercase tracking-tighter">
                <span>Savings</span>
                <span>- LKR {totalDiscount.toLocaleString()}</span>
              </div>
            )}
            {couponCode && discountAmount > 0 && (
              <div className="flex justify-between text-[11px] md:text-xs text-green-700 font-bold uppercase tracking-tighter">
                <span>Coupon ({couponCode})</span>
                <span>- LKR {Number(discountAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] md:text-xs uppercase tracking-wider">
              <span className="text-gray-500">Shipping</span>
              <span className="text-black font-bold">LKR {shippingCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-5 border-t border-black mb-8 lg:mb-0">
              <span className="text-sm md:text-base font-black uppercase tracking-tighter">Total</span>
              <div className="text-right flex items-baseline gap-1">
                <span className="text-[9px] text-gray-400 font-bold">LKR</span>
                <span className="text-xl md:text-2xl font-black text-black tracking-tighter">{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <PlaceOrderButton className="lg:hidden mt-8" />
          <p className="text-[10px] text-gray-500 mt-4 text-center">By clicking Pay Now, you agree to our <Link href="/terms-and-conditions" className="underline hover:text-black transition-colors">Terms and Conditions</Link>.</p>
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500">
            <Link href="/return-policy" className="underline hover:text-black transition-colors">Return Policy</Link>
            <span>•</span>
            <Link href="/shipping-policy" className="underline hover:text-black transition-colors">Shipping Policy</Link>
            <span>•</span>
            <Link href="/privacy-policy" className="underline hover:text-black transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}